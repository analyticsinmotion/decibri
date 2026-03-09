<!-- markdownlint-disable MD024 -->
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
<!-- Add new features here -->

### Changed
<!-- Add changed behavior here -->

### Fixed
<!-- Add bug fixes here -->

### Removed
<!-- Add removals/deprecations here -->

---

## [0.3.0] - 2026-03-10

### Changed

- Pre-built binaries now bundle inside the npm package (`prebuilds/`) and are loaded
  directly by `node-gyp-build` at `require()` time — no install-time network call to
  GitHub Releases. Eliminates `prebuild-install` as a runtime dependency.
- Removed deprecated `prebuild` (build/upload) and `prebuild-install` (download)
  toolchain. CI now builds with `node-gyp rebuild`, stages artifacts, and publishes
  to npm via a dedicated publish job.

### Security

- Upgraded `node-gyp` to `^12.0.0` to resolve four high-severity vulnerabilities in
  the transitive `tar` dependency (GHSA-r6q2-hw4h-h46w, GHSA-34x7-hfp2-rc4v,
  GHSA-8qq5-rm4j-mr97, GHSA-83g3-92jg-28cx).

---

## [0.2.0] - 2026-03-09

### Added

- TypeScript declarations (`types/index.d.ts`) — full type coverage for `MicStream`, `MicStreamOptions`, `DeviceInfo`, and `VersionInfo` with typed event overloads for all `Readable` events plus `backpressure`. No `@types/` install required.
- macOS microphone permission helper — checks `AVCaptureDevice` authorization status before opening the PortAudio stream. When access is denied or restricted, emits a clear, actionable error (`Microphone access denied. Enable access in System Settings → Privacy & Security → Microphone.`) instead of silently delivering zero-amplitude audio.
- `format` option (`'int16'` | `'float32'`) — opt in to 32-bit float PCM output. Default is `'int16'`; existing code requires no changes. Zero-copy view: `new Float32Array(chunk.buffer, chunk.byteOffset, chunk.length / 4)`.

### Changed

<!-- Add changed behavior here -->

### Fixed

<!-- Add bug fixes here -->

### Removed

<!-- Add removals/deprecations here -->

---

## [0.1.0] - 2026-03-09

### Added

- Initial release of `@analyticsinmotion/micstream`.
- Cross-platform microphone audio capture via PortAudio, statically compiled — no system audio library required at runtime on Windows or macOS.
- Node.js `Readable` stream interface emitting raw PCM `Buffer` chunks (16-bit signed integer, little-endian).
- Default audio format: 16 000 Hz, mono, 100 ms chunks (1 600 frames per callback) — optimised for speech and wake-word workloads.
- Configurable `sampleRate` (1 000–384 000 Hz), `channels` (1–32), `framesPerBuffer` (64–65 536), and `device` index options.
- `stop()` method for clean stream termination and EOF signalling.
- `isOpen` property indicating whether the microphone is actively capturing.
- `backpressure` event emitted when the internal buffer is full and the consumer is reading too slowly.
- `MicStream.devices()` static method listing all available audio input devices with index, name, channel count, sample rate, and default flag.
- `MicStream.version()` static method returning `micstream` and bundled PortAudio version strings.
- Windows x64 support via WASAPI with automatic format conversion, allowing any requested sample rate regardless of the device's native mix format.
- macOS ARM64 (Apple Silicon) support via CoreAudio.
- Linux x64 and Linux ARM64 support via ALSA.
- Pre-built binaries for all four supported platform/architecture combinations, distributed via GitHub Releases.
- `prebuild-install` integration for automatic binary download at `npm install` time.
- `node-gyp rebuild` source-build fallback for unsupported platforms or environments without pre-built binaries.
- GitHub Actions CI workflow building and uploading prebuilds to GitHub Releases on version tags.

---
