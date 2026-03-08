#include <napi.h>
#include <portaudio.h>
#include <vector>
#include <mutex>
#include <atomic>
#include <cstring>

// ─── Defaults ────────────────────────────────────────────────────────────────
// Optimised for speech/wake-word: 16kHz mono 16-bit
#define DEFAULT_SAMPLE_RATE    16000
#define DEFAULT_CHANNELS       1
// 100ms of audio per chunk at 16kHz — low enough latency, not too chatty
#define DEFAULT_FRAMES_PER_BUFFER 1600

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
        running_(false),
        sampleRate_(DEFAULT_SAMPLE_RATE),
        channels_(DEFAULT_CHANNELS),
        framesPerBuffer_(DEFAULT_FRAMES_PER_BUFFER) {

    Napi::Env env = info.Env();

    // Parse optional config object
    if (info.Length() > 0 && info[0].IsObject()) {
      Napi::Object opts = info[0].As<Napi::Object>();

      if (opts.Has("sampleRate") && opts.Get("sampleRate").IsNumber()) {
        sampleRate_ = opts.Get("sampleRate").As<Napi::Number>().Int32Value();
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

    const int16_t* input = static_cast<const int16_t*>(inputBuffer);
    size_t numSamples = framesPerBuffer * static_cast<size_t>(self->channels_);

    // Heap-allocate; ownership passes to the JS callback lambda below
    auto* chunk = new std::vector<int16_t>(input, input + numSamples);

    napi_status status = self->tsfn_.NonBlockingCall(
        chunk,
        [](Napi::Env env, Napi::Function jsCallback, std::vector<int16_t>* data) {
          // Copy into a Node.js Buffer (int16 viewed as raw bytes)
          size_t byteLen = data->size() * sizeof(int16_t);
          Napi::Buffer<uint8_t> buf = Napi::Buffer<uint8_t>::Copy(
              env,
              reinterpret_cast<const uint8_t*>(data->data()),
              byteLen);
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

    // Locate the default input device
    PaDeviceIndex deviceIndex = Pa_GetDefaultInputDevice();
    if (deviceIndex == paNoDevice) {
      tsfn_.Release();
      Napi::Error::New(env, "No microphone found. Check system audio input settings.")
          .ThrowAsJavaScriptException();
      return env.Undefined();
    }

    const PaDeviceInfo* deviceInfo = Pa_GetDeviceInfo(deviceIndex);

    PaStreamParameters inputParams;
    inputParams.device                    = deviceIndex;
    inputParams.channelCount              = channels_;
    inputParams.sampleFormat              = paInt16;
    inputParams.suggestedLatency          = deviceInfo->defaultLowInputLatency;
    inputParams.hostApiSpecificStreamInfo = nullptr;

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
    v.Set("micstream",  Napi::String::New(env, "0.1.0"));
    return v;
  }

  // ── Members ──────────────────────────────────────────────────────────────

  PaStream*                stream_;
  Napi::ThreadSafeFunction tsfn_;
  std::atomic<bool>        running_;
  int                      sampleRate_;
  int                      channels_;
  int                      framesPerBuffer_;
};

// ─── Module entry point ──────────────────────────────────────────────────────

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  MicStream::Init(env, exports);
  return exports;
}

NODE_API_MODULE(micstream, Init)
