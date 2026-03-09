# micstream

Cross-platform microphone audio capture for Node.js.

Pre-built binaries for Windows, macOS, and Linux. No build tools, no SoX, no system dependencies required.

---

## Installation

```bash
npm install @analyticsinmotion/micstream
```

At install time `prebuild-install` downloads the correct pre-compiled binary for your platform. If no binary is available, it falls back to compiling from source (requires build tools and `libasound2-dev` on Linux).

---

## Usage

### Stream PCM audio from the default microphone

```javascript
const MicStream = require('@analyticsinmotion/micstream');

const mic = new MicStream();

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
const MicStream = require('@analyticsinmotion/micstream');

const mic = new MicStream({ sampleRate: 44100, channels: 2 });
const out = fs.createWriteStream('capture.raw');

mic.pipe(out);

setTimeout(() => mic.stop(), 5000);
```

### Pipe to a speech engine

```javascript
const MicStream = require('@analyticsinmotion/micstream');

const mic = new MicStream({ sampleRate: 16000, channels: 1 });

mic.on('data', (chunk) => {
  speechEngine.feed(chunk); // pass raw PCM directly
});
```

---

## API

### `new MicStream(options?)`

Creates a Readable stream that captures from the system default microphone.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `sampleRate` | number | `16000` | Samples per second (1000–384000) |
| `channels` | number | `1` | Number of input channels (1–32) |
| `framesPerBuffer` | number | `1600` | Frames per audio callback (64–65536) |
| `device` | number | system default | Device index from `MicStream.devices()`; omit to use the system default |

Standard Node.js `Readable` stream options (e.g. `highWaterMark`) are also accepted.

### `mic.stop()`

Stops microphone capture and ends the stream. Safe to call multiple times.

### Event: `'backpressure'`

Emitted when `push()` returns `false`, meaning the stream's internal buffer is full and the consumer is reading too slowly. Because a microphone cannot be paused, audio chunks will continue to arrive. Callers should drain the stream or drop data to avoid unbounded memory growth.

### `mic.isOpen`

`true` if the microphone is currently capturing.

### `MicStream.devices()`

Returns an array of available input devices on the system.

```javascript
const devices = MicStream.devices();
// [
//   { index: 0, name: 'Built-in Microphone', maxInputChannels: 1, defaultSampleRate: 44100, isDefault: true },
//   ...
// ]
```

### `MicStream.version()`

Returns version information for micstream and the bundled PortAudio.

```javascript
MicStream.version();
// { micstream: '0.1.0', portaudio: 'PortAudio V19.7.0-devel...' }
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

Requires Node.js >= 16, node-gyp, and platform build tools.

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
git clone --recurse-submodules https://github.com/analyticsinmotion/micstream.git
cd micstream
npm install
npm run build
```

---

## How it works

micstream wraps [PortAudio](http://www.portaudio.com/) — the standard cross-platform audio I/O library — as a Node.js native addon using [N-API](https://nodejs.org/api/n-api.html). PortAudio is compiled from source and statically linked, so there is no system PortAudio dependency.

The native addon opens the default input device, runs a PortAudio callback in an audio thread, and forwards PCM chunks to JavaScript via an N-API `ThreadSafeFunction`. The JavaScript layer wraps this in a standard Node.js `Readable` stream.

---

## License

Apache-2.0 © [Analytics in Motion](https://analyticsinmotion.com)
