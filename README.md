<!-- markdownlint-disable MD033 MD041 -->
<div align="center">
  <!-- <img width="85" height="85" alt="Image" src="https://github.com/user-attachments/assets/2dce8788-02b4-4877-849c-274f776e063d" /> -->

# decibri

  Cross-platform microphone audio capture for Node.js.

  Pre-built binaries for Windows, macOS, and Linux. No build tools, no SoX, no system dependencies required.

  <!-- badges: start -->
  <table>
    <tr>
      <td><strong>Meta</strong></td>
      <td>
        <a href="https://www.npmjs.com/package/decibri"><img src="https://img.shields.io/npm/v/decibri" alt="npm version"></a>&nbsp;
        <a href="https://github.com/analyticsinmotion/decibri/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-Apache_2.0-blue.svg" alt="Apache 2.0 License"></a>&nbsp;
        <a href="https://decibri.com"><img src="https://img.shields.io/badge/Website-decibri.com-blue" alt="decibri.com"></a>&nbsp;
        <a href="https://decibri.com/docs/"><img src="https://img.shields.io/badge/docs-passing-brightgreen" alt="Docs"></a>&nbsp;
        <a href="https://github.com/analyticsinmotion"><img src="https://github.com/user-attachments/assets/616c530f-cf2a-4f26-8f6c-7397be513847" alt="Analytics in Motion" width="137" height="20"></a>
      </td>
    </tr>
    <tr>
      <td><strong>Binaries</strong></td>
      <td>
        <a href="https://github.com/analyticsinmotion/decibri/actions/workflows/prebuild.yml"><img src="https://img.shields.io/github/actions/workflow/status/analyticsinmotion/decibri/prebuild.yml?job=Windows%20x64&label=Windows%20x64&logo=microsoft&logoColor=white" alt="Windows x64"></a>&nbsp;
        <a href="https://github.com/analyticsinmotion/decibri/actions/workflows/prebuild.yml"><img src="https://img.shields.io/github/actions/workflow/status/analyticsinmotion/decibri/prebuild.yml?job=macOS%20ARM64&label=macOS%20ARM64&logo=apple" alt="macOS ARM64"></a>&nbsp;
        <a href="https://github.com/analyticsinmotion/decibri/actions/workflows/prebuild.yml"><img src="https://img.shields.io/github/actions/workflow/status/analyticsinmotion/decibri/prebuild.yml?job=Linux%20x64&label=Linux%20x64&logo=linux&logoColor=white" alt="Linux x64"></a>&nbsp;
        <a href="https://github.com/analyticsinmotion/decibri/actions/workflows/prebuild.yml"><img src="https://img.shields.io/github/actions/workflow/status/analyticsinmotion/decibri/prebuild.yml?job=Linux%20ARM64&label=Linux%20ARM64&logo=linux&logoColor=white" alt="Linux ARM64"></a>
      </td>
    </tr>
    <tr>
  <td><strong>Integrations</strong></td>
  <td>
    <a href="https://decibri.com/docs/node/integrations/openai-realtime.html"><img src="https://img.shields.io/badge/OpenAI-cloud-blue" alt="OpenAI"></a>&nbsp;
    <a href="https://decibri.com/docs/node/integrations/deepgram.html"><img src="https://img.shields.io/badge/Deepgram-cloud-blue" alt="Deepgram"></a>&nbsp;
    <a href="https://decibri.com/docs/node/integrations/assemblyai.html"><img src="https://img.shields.io/badge/AssemblyAI-cloud-blue" alt="AssemblyAI"></a>&nbsp;
    <a href="https://decibri.com/docs/node/integrations/mistral-voxtral.html"><img src="https://img.shields.io/badge/Mistral-cloud-blue" alt="Mistral"></a>&nbsp;
    <a href="https://decibri.com/docs/node/integrations/aws-transcribe.html"><img src="https://img.shields.io/badge/AWS_Transcribe-cloud-blue" alt="AWS Transcribe"></a>&nbsp;
    <a href="https://decibri.com/docs/node/integrations/google-speech.html"><img src="https://img.shields.io/badge/Google_Speech-cloud-blue" alt="Google Speech-to-Text"></a>&nbsp;
    <a href="https://decibri.com/docs/node/integrations/azure-speech.html"><img src="https://img.shields.io/badge/Azure_Speech-cloud-blue" alt="Azure Speech-to-Text"></a>&nbsp;
    <a href="https://decibri.com/docs/node/integrations/sherpa-onnx-stt.html"><img src="https://img.shields.io/badge/Sherpa--ONNX-local-brightgreen" alt="Sherpa-ONNX"></a>&nbsp;
    <a href="https://decibri.com/docs/node/integrations/whisper-cpp.html"><img src="https://img.shields.io/badge/Whisper.cpp-local-brightgreen" alt="Whisper.cpp"></a>
  </td>
</tr>
  </table>
  <!-- badges: end -->
</div>

---

## Installation

```bash
npm install decibri
```

Pre-compiled binaries for all supported platforms are bundled inside the package and loaded automatically by `node-gyp-build`. If no binary is available for your platform, it falls back to compiling from source (requires build tools and `libasound2-dev` on Linux).

---

## Usage

### Stream PCM audio from the default microphone

```javascript
const Decibri = require('decibri');

const mic = new Decibri();

mic.on('data', (chunk) => {
  // chunk is a Buffer of 16-bit signed integer PCM samples (little-endian)
  // default: 16kHz, mono, 1600 frames per chunk (100ms)
});

mic.on('error', (err) => {
  console.error('Microphone error:', err);
});

// Stop after 10 seconds
setTimeout(() => mic.stop(), 10000);
```

### Pipe to a file

```javascript
const fs = require('fs');
const Decibri = require('decibri');

const mic = new Decibri({ sampleRate: 44100, channels: 2 });
const out = fs.createWriteStream('capture.raw');

mic.pipe(out);

setTimeout(() => mic.stop(), 5000);
```

### Pipe to a speech engine

```javascript
const Decibri = require('decibri');

const mic = new Decibri({ sampleRate: 16000, channels: 1 });

mic.on('data', (chunk) => {
  speechEngine.feed(chunk); // pass raw PCM directly
});
```

### TypeScript

TypeScript definitions are bundled. No `@types/` package needed.

```typescript
import Decibri, { DeviceInfo, DecibriOptions } from 'decibri';

const options: DecibriOptions = { sampleRate: 16000, channels: 1 };
const mic = new Decibri(options);

mic.on('data', (chunk: Buffer) => {
  // zero-copy Int16 view over the same memory
  const samples = new Int16Array(chunk.buffer, chunk.byteOffset, chunk.length / 2);
});

mic.on('backpressure', () => console.warn('Consumer too slow'));

const devices: DeviceInfo[] = Decibri.devices();
```

---

## API

### `new Decibri(options?)`

Creates a Readable stream that captures from the system default microphone.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `sampleRate` | number | `16000` | Samples per second (1000–384000) |
| `channels` | number | `1` | Number of input channels (1–32) |
| `framesPerBuffer` | number | `1600` | Frames per audio callback (64–65536) |
| `device` | number \| string | system default | Device index from `Decibri.devices()` or case-insensitive name substring |
| `format` | `'int16'` \| `'float32'` | `'int16'` | Sample encoding — 16-bit signed integer or 32-bit IEEE 754 float |
| `vad` | boolean | `false` | Enable voice activity detection |
| `vadThreshold` | number | `0.01` | RMS energy threshold for speech (0–1) |
| `vadHoldoff` | number | `300` | Silence holdoff in ms before `'silence'` is emitted |

Standard Node.js `Readable` stream options (e.g. `highWaterMark`) are also accepted.

### `mic.stop()`

Stops microphone capture and ends the stream. Safe to call multiple times.

### Event: `'backpressure'`

Emitted when `push()` returns `false`, meaning the stream's internal buffer is full and the consumer is reading too slowly. Because a microphone cannot be paused, audio chunks will continue to arrive. Callers should drain the stream or drop data to avoid unbounded memory growth.

### Event: `'speech'`

Emitted when the RMS energy of an audio chunk crosses `vadThreshold`. Requires `vad: true`.

### Event: `'silence'`

Emitted when audio stays below `vadThreshold` for `vadHoldoff` ms after a speech period. Requires `vad: true`.

### `mic.isOpen`

`true` if the microphone is currently capturing.

### `Decibri.devices()`

Returns an array of available input devices on the system.

```javascript
const devices = Decibri.devices();
// [
//   { index: 0, name: 'Built-in Microphone', maxInputChannels: 1, defaultSampleRate: 44100, isDefault: true },
//   ...
// ]
```

### `Decibri.version()`

Returns version information for decibri and the bundled PortAudio.

```javascript
Decibri.version();
// { decibri: '1.0.0', portaudio: 'PortAudio V19.7.0-devel...' }
```

---

## Examples

Runnable examples are in [`examples/`](examples/).

### Capture to WAV file

No external dependencies.

```bash
node examples/wav-capture.js
# writes capture.wav (5 seconds, 16 kHz mono)
```

### Stream to WebSocket

The WebSocket examples require the `ws` package, which is **not** bundled with decibri. Install it before running:

```bash
npm install ws
```

Then in two terminals:

```bash
# Terminal 1 — start receiver
node examples/websocket-server.js

# Terminal 2 — start streaming
node examples/websocket-stream.js
# streams raw PCM to ws://localhost:8080
```

---

## Audio format

All audio is captured as **16-bit signed integer PCM, little-endian**. This is the raw format expected by most speech and wake-word engines (Vosk, sherpa-onnx, whisper.cpp, openWakeWord).

Each `data` event emits a `Buffer` where every 2 bytes is one 16-bit sample:

```javascript
mic.on('data', (chunk) => {
  const samples = new Int16Array(chunk.buffer, chunk.byteOffset, chunk.length / 2);
  // samples[0], samples[1], ...
});
```

---

## Platform Support

### Pre-built binaries (zero setup)

| Platform | Architecture | Audio Backend |
| --- | --- | --- |
| Windows 11 | x64 | WASAPI |
| macOS (Apple Silicon) | arm64 | CoreAudio |
| Linux | x64 | ALSA |
| Linux | arm64 | ALSA |

### Source build fallback (requires build tools)

| Platform | Requirements |
| --- | --- |
| macOS Intel (pre-2020) | Xcode CLI tools: `xcode-select --install` |
| Windows ARM64 | Visual C++ Build Tools |

### Not supported

| Platform | Reason |
| --- | --- |
| Windows 32-bit | N-API native addons require 64-bit |

---

## Building from source

Requires Node.js >= 18, node-gyp, and platform build tools.

**Linux:**

```bash
sudo apt-get install -y build-essential libasound2-dev
```

**macOS:**

```bash
xcode-select --install
```

**Windows:**
Install [Visual C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/).

Then:

```bash
git clone --recurse-submodules https://github.com/analyticsinmotion/decibri.git
cd decibri
npm install
npm run build
```

---

## How it works

decibri wraps [PortAudio](http://www.portaudio.com/), the standard cross-platform audio I/O library, as a Node.js native addon using [N-API](https://nodejs.org/api/n-api.html). PortAudio is compiled from source and statically linked, so there is no system PortAudio dependency.

The native addon opens the default input device, runs a PortAudio callback in an audio thread, and forwards PCM chunks to JavaScript via an N-API `ThreadSafeFunction`. The JavaScript layer wraps this in a standard Node.js `Readable` stream.

---

## License

Apache-2.0 © [Analytics in Motion](https://github.com/analyticsinmotion)
