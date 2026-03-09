#include <napi.h>
#include <portaudio.h>
#include <vector>
#include <atomic>
#include <cstring>

#ifdef PA_USE_WASAPI
#include <pa_win_wasapi.h>
#endif

#ifdef PA_USE_COREAUDIO
// Declared in src/mac_permission.mm (compiled on macOS only)
extern "C" const char* CheckMicrophonePermission();
#endif

// ─── Defaults ────────────────────────────────────────────────────────────────
// Optimised for speech/wake-word: 16kHz mono 16-bit
#define DEFAULT_SAMPLE_RATE    16000
#define DEFAULT_CHANNELS       1
// 100ms of audio per chunk at 16kHz — low enough latency, not too chatty
#define DEFAULT_FRAMES_PER_BUFFER 1600
// -1 means "use the system default input device"
#define DEFAULT_DEVICE         -1

// ─── MicStream class ─────────────────────────────────────────────────────────

class MicStream : public Napi::ObjectWrap<MicStream> {
public:

  static Napi::Object Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "MicStream", {
      InstanceMethod("start",   &MicStream::Start),
      InstanceMethod("stop",    &MicStream::Stop),
      InstanceMethod("isOpen",  &MicStream::IsOpen),
      StaticMethod("devices",   &MicStream::GetDevices),
      StaticMethod("version",   &MicStream::GetVersion),
    });

    Napi::FunctionReference* constructor = new Napi::FunctionReference();
    *constructor = Napi::Persistent(func);
    env.SetInstanceData(constructor);

    exports.Set("MicStream", func);
    return exports;
  }

  // ── Constructor ──────────────────────────────────────────────────────────

  MicStream(const Napi::CallbackInfo& info)
      : Napi::ObjectWrap<MicStream>(info),
        stream_(nullptr),
        tsfn_(),
        running_(false),
        sampleRate_(DEFAULT_SAMPLE_RATE),
        channels_(DEFAULT_CHANNELS),
        framesPerBuffer_(DEFAULT_FRAMES_PER_BUFFER),
        device_(DEFAULT_DEVICE),
        sampleFormat_(paInt16),
        bytesPerSample_(2) {

    Napi::Env env = info.Env();

    // Parse optional config object
    if (info.Length() > 0 && info[0].IsObject()) {
      Napi::Object opts = info[0].As<Napi::Object>();

      if (opts.Has("sampleRate") && opts.Get("sampleRate").IsNumber()) {
        sampleRate_ = opts.Get("sampleRate").As<Napi::Number>().Int32Value();
        if (sampleRate_ < 1000 || sampleRate_ > 384000) {
          Napi::RangeError::New(env, "sampleRate must be between 1000 and 384000").ThrowAsJavaScriptException();
          return;
        }
      }
      if (opts.Has("channels") && opts.Get("channels").IsNumber()) {
        channels_ = opts.Get("channels").As<Napi::Number>().Int32Value();
        if (channels_ < 1 || channels_ > 32) {
          Napi::RangeError::New(env, "channels must be between 1 and 32").ThrowAsJavaScriptException();
          return;
        }
      }
      if (opts.Has("framesPerBuffer") && opts.Get("framesPerBuffer").IsNumber()) {
        framesPerBuffer_ = opts.Get("framesPerBuffer").As<Napi::Number>().Int32Value();
        if (framesPerBuffer_ < 64 || framesPerBuffer_ > 65536) {
          Napi::RangeError::New(env, "framesPerBuffer must be between 64 and 65536").ThrowAsJavaScriptException();
          return;
        }
      }
      if (opts.Has("device") && opts.Get("device").IsNumber()) {
        device_ = opts.Get("device").As<Napi::Number>().Int32Value();
      }
      if (opts.Has("format") && opts.Get("format").IsString()) {
        std::string fmt = opts.Get("format").As<Napi::String>().Utf8Value();
        if (fmt == "float32") {
          sampleFormat_   = paFloat32;
          bytesPerSample_ = 4;
        } else if (fmt != "int16") {
          Napi::TypeError::New(env, "format must be 'int16' or 'float32'")
              .ThrowAsJavaScriptException();
          return;
        }
      }
    }

    PaError err = Pa_Initialize();
    if (err != paNoError) {
      Napi::Error::New(env, std::string("PortAudio init failed: ") + Pa_GetErrorText(err))
          .ThrowAsJavaScriptException();
    }
  }

  // ── Destructor ───────────────────────────────────────────────────────────

  ~MicStream() {
    if (running_.exchange(false)) {
      if (stream_) {
        Pa_StopStream(stream_);
        Pa_CloseStream(stream_);
        stream_ = nullptr;
      }
    }
    if (tsfn_) {
      tsfn_.Release();
    }
    Pa_Terminate();
  }

private:

  // ── PortAudio callback (audio thread — keep it fast) ─────────────────────

  static int AudioCallback(
      const void*                     inputBuffer,
      void*                           outputBuffer,
      unsigned long                   framesPerBuffer,
      const PaStreamCallbackTimeInfo* timeInfo,
      PaStreamCallbackFlags           statusFlags,
      void*                           userData) {

    (void)outputBuffer;
    (void)timeInfo;
    (void)statusFlags;

    MicStream* self = static_cast<MicStream*>(userData);

    if (!self->running_ || inputBuffer == nullptr) {
      return paContinue;
    }

    // Copy raw bytes regardless of sample format (int16 or float32).
    // Heap-allocate; ownership passes to the JS callback lambda below.
    size_t byteLen = framesPerBuffer
                     * static_cast<size_t>(self->channels_)
                     * static_cast<size_t>(self->bytesPerSample_);
    const uint8_t* src = static_cast<const uint8_t*>(inputBuffer);
    auto* chunk = new std::vector<uint8_t>(src, src + byteLen);

    napi_status status = self->tsfn_.NonBlockingCall(
        chunk,
        [](Napi::Env env, Napi::Function jsCallback, std::vector<uint8_t>* data) {
          Napi::Buffer<uint8_t> buf = Napi::Buffer<uint8_t>::Copy(
              env, data->data(), data->size());
          delete data;
          jsCallback.Call({env.Null(), buf});
        });

    if (status != napi_ok) {
      delete chunk;
    }

    return paContinue;
  }

  // ── start(callback) ──────────────────────────────────────────────────────

  Napi::Value Start(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (running_) {
      Napi::Error::New(env, "MicStream is already running. Call stop() first.")
          .ThrowAsJavaScriptException();
      return env.Undefined();
    }
    if (info.Length() < 1 || !info[0].IsFunction()) {
      Napi::TypeError::New(env, "start(callback): callback function required")
          .ThrowAsJavaScriptException();
      return env.Undefined();
    }

    Napi::Function callback = info[0].As<Napi::Function>();

    tsfn_ = Napi::ThreadSafeFunction::New(
        env,
        callback,
        "MicStreamCallback",
        0,    // unlimited queue depth
        1     // single producer (audio thread)
    );

    // Resolve the device index — use the caller-specified device if set,
    // otherwise fall back to the system default input device.
    PaDeviceIndex deviceIndex;
    if (device_ >= 0) {
      deviceIndex = static_cast<PaDeviceIndex>(device_);
      if (deviceIndex >= Pa_GetDeviceCount()) {
        tsfn_.Release();
        Napi::RangeError::New(env,
            "device index out of range — call MicStream.devices() to list available devices")
            .ThrowAsJavaScriptException();
        return env.Undefined();
      }
    } else {
      deviceIndex = Pa_GetDefaultInputDevice();
      if (deviceIndex == paNoDevice) {
        tsfn_.Release();
        Napi::Error::New(env, "No microphone found. Check system audio input settings.")
            .ThrowAsJavaScriptException();
        return env.Undefined();
      }
    }

    const PaDeviceInfo* deviceInfo = Pa_GetDeviceInfo(deviceIndex);
    if (deviceInfo == nullptr || deviceInfo->maxInputChannels < 1) {
      tsfn_.Release();
      Napi::Error::New(env, "Selected device is not a valid input device.")
          .ThrowAsJavaScriptException();
      return env.Undefined();
    }

    PaStreamParameters inputParams;
    inputParams.device                    = deviceIndex;
    inputParams.channelCount              = channels_;
    inputParams.sampleFormat              = sampleFormat_;
    inputParams.suggestedLatency          = deviceInfo->defaultLowInputLatency;
#ifdef PA_USE_WASAPI
    // Enable Windows Audio Session API automatic format conversion so that
    // any requested sample rate is accepted even when it differs from the
    // device's native mix format (e.g. 16kHz from a 48kHz webcam mic).
    PaWasapiStreamInfo wasapiInfo = {};
    wasapiInfo.size        = sizeof(PaWasapiStreamInfo);
    wasapiInfo.hostApiType = paWASAPI;
    wasapiInfo.version     = 1;
    wasapiInfo.flags       = paWinWasapiAutoConvert;
    inputParams.hostApiSpecificStreamInfo = &wasapiInfo;
#else
    inputParams.hostApiSpecificStreamInfo = nullptr;
#endif

#ifdef PA_USE_COREAUDIO
    {
      const char* permError = CheckMicrophonePermission();
      if (permError != nullptr) {
        tsfn_.Release();
        Napi::Error::New(env, permError).ThrowAsJavaScriptException();
        return env.Undefined();
      }
    }
#endif

    PaError err = Pa_OpenStream(
        &stream_,
        &inputParams,
        nullptr,           // capture only, no output
        sampleRate_,
        framesPerBuffer_,
        paClipOff,
        AudioCallback,
        this);

    if (err != paNoError) {
      stream_ = nullptr;
      tsfn_.Release();
      Napi::Error::New(env, std::string("Failed to open audio stream: ") + Pa_GetErrorText(err))
          .ThrowAsJavaScriptException();
      return env.Undefined();
    }

    err = Pa_StartStream(stream_);
    if (err != paNoError) {
      Pa_CloseStream(stream_);
      stream_ = nullptr;
      tsfn_.Release();
      Napi::Error::New(env, std::string("Failed to start audio stream: ") + Pa_GetErrorText(err))
          .ThrowAsJavaScriptException();
      return env.Undefined();
    }

    running_ = true;
    return env.Undefined();
  }

  // ── stop() ───────────────────────────────────────────────────────────────

  Napi::Value Stop(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (!running_.exchange(false)) {
      return env.Undefined();   // already stopped — no-op
    }

    if (stream_) {
      Pa_StopStream(stream_);
      Pa_CloseStream(stream_);
      stream_ = nullptr;
    }

    if (tsfn_) {
      tsfn_.Release();
      tsfn_ = Napi::ThreadSafeFunction();
    }

    return env.Undefined();
  }

  // ── isOpen() ─────────────────────────────────────────────────────────────

  Napi::Value IsOpen(const Napi::CallbackInfo& info) {
    return Napi::Boolean::New(info.Env(), running_.load());
  }

  // ── MicStream.devices() — static ─────────────────────────────────────────
  //
  // PortAudio v19 reference-counts Pa_Initialize / Pa_Terminate calls, so
  // it is safe to call them here even when a MicStream instance is actively
  // capturing. The instance's init increments the ref count to 1; this call
  // bumps it to 2 then back to 1 at the end — the live stream is unaffected.

  static Napi::Value GetDevices(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    PaError err = Pa_Initialize();
    if (err != paNoError) {
      Napi::Error::New(env, std::string("PortAudio init failed: ") + Pa_GetErrorText(err))
          .ThrowAsJavaScriptException();
      return env.Null();
    }

    int numDevices = Pa_GetDeviceCount();
    PaDeviceIndex defaultInput = Pa_GetDefaultInputDevice();
    Napi::Array devices = Napi::Array::New(env);
    uint32_t idx = 0;

    for (int i = 0; i < numDevices; i++) {
      const PaDeviceInfo* di = Pa_GetDeviceInfo(i);
      if (di == nullptr || di->maxInputChannels < 1) continue;

      Napi::Object device = Napi::Object::New(env);
      device.Set("index",             Napi::Number::New(env, i));
      device.Set("name",              Napi::String::New(env, di->name));
      device.Set("maxInputChannels",  Napi::Number::New(env, di->maxInputChannels));
      device.Set("defaultSampleRate", Napi::Number::New(env, di->defaultSampleRate));
      device.Set("isDefault",         Napi::Boolean::New(env, i == defaultInput));
      devices.Set(idx++, device);
    }

    Pa_Terminate();
    return devices;
  }

  // ── MicStream.version() — static ─────────────────────────────────────────

  static Napi::Value GetVersion(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Object v = Napi::Object::New(env);
    const PaVersionInfo* vi = Pa_GetVersionInfo();
    v.Set("portaudio", Napi::String::New(env, vi ? vi->versionText : Pa_GetVersionText()));
    v.Set("micstream",  Napi::String::New(env, MICSTREAM_VERSION));
    return v;
  }

  // ── Members ──────────────────────────────────────────────────────────────

  PaStream*                stream_;
  Napi::ThreadSafeFunction tsfn_;
  std::atomic<bool>        running_;
  int                      sampleRate_;
  int                      channels_;
  int                      framesPerBuffer_;
  int                      device_;
  PaSampleFormat           sampleFormat_;
  int                      bytesPerSample_;
};

// ─── Module entry point ──────────────────────────────────────────────────────

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  MicStream::Init(env, exports);
  return exports;
}

NODE_API_MODULE(micstream, Init)
