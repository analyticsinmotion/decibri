/// <reference types="node" />

import { Readable, ReadableOptions } from 'stream';

// ─── Interfaces ───────────────────────────────────────────────────────────────

/** Describes a single audio input device returned by `Decibri.devices()`. */
export interface DeviceInfo {
  /** PortAudio device index — pass as `options.device` to target this device. */
  index: number;
  /** Human-readable device name reported by the OS. */
  name: string;
  /** Maximum number of input channels supported by this device. */
  maxInputChannels: number;
  /** Device's native/preferred sample rate in Hz. */
  defaultSampleRate: number;
  /** Whether this is the current system default input device. */
  isDefault: boolean;
}

/** Version strings returned by `Decibri.version()`. */
export interface VersionInfo {
  /** decibri package version (e.g. `"1.0.0"`). */
  decibri: string;
  /** Bundled PortAudio version string (e.g. `"PortAudio V19.7.0-devel..."`). */
  portaudio: string;
}

/**
 * Constructor options for `Decibri`.
 * All standard Node.js `ReadableOptions` (e.g. `highWaterMark`) are also accepted.
 */
export interface DecibriOptions extends ReadableOptions {
  /**
   * Samples per second.
   * @default 16000
   * @minimum 1000
   * @maximum 384000
   */
  sampleRate?: number;

  /**
   * Number of input channels.
   * @default 1
   * @minimum 1
   * @maximum 32
   */
  channels?: number;

  /**
   * Frames delivered per audio callback — controls chunk size and latency.
   * At 16 kHz the default of 1600 produces 100 ms chunks.
   * @default 1600
   * @minimum 64
   * @maximum 65536
   */
  framesPerBuffer?: number;

  /**
   * Device to capture from. Pass a numeric index from `Decibri.devices()`,
   * or a case-insensitive substring of the device name.
   * Omit to use the system default input device.
   * Throws `TypeError` if a name string matches zero or multiple devices.
   */
  device?: number | string;

  /**
   * Enable voice activity detection. When `true`, emits `'speech'` when RMS
   * energy crosses `vadThreshold` and `'silence'` after `vadHoldoff` ms of
   * sub-threshold audio.
   * @default false
   */
  vad?: boolean;

  /**
   * RMS energy threshold for speech detection (0–1 normalised scale).
   * Tune upward in noisy environments.
   * @default 0.01
   * @minimum 0
   * @maximum 1
   */
  vadThreshold?: number;

  /**
   * Milliseconds of sub-threshold audio before `'silence'` is emitted.
   * Prevents rapid toggling on natural speech pauses.
   * @default 300
   * @minimum 0
   */
  vadHoldoff?: number;

  /**
   * Sample encoding format.
   * - `'int16'`   — 16-bit signed integer, little-endian (default)
   * - `'float32'` — 32-bit IEEE 754 float, little-endian
   *
   * Both formats emit a `Buffer`. For zero-copy typed array access:
   * ```ts
   * // int16 (default)
   * const samples = new Int16Array(chunk.buffer, chunk.byteOffset, chunk.length / 2);
   * // float32
   * const samples = new Float32Array(chunk.buffer, chunk.byteOffset, chunk.length / 4);
   * ```
   * @default 'int16'
   */
  format?: 'int16' | 'float32';
}

// ─── Decibri ─────────────────────────────────────────────────────────────────

/**
 * A Node.js `Readable` stream that captures raw PCM audio from the microphone.
 *
 * **Audio format** (default):
 * - Encoding:    16-bit signed integer (Int16), little-endian
 * - Sample rate: 16 000 Hz
 * - Channels:    1 (mono)
 *
 * Each `'data'` event emits a `Buffer` of Int16 samples. To view as a typed
 * array without copying:
 * ```ts
 * mic.on('data', (chunk: Buffer) => {
 *   const samples = new Int16Array(chunk.buffer, chunk.byteOffset, chunk.length / 2);
 * });
 * ```
 *
 * @example
 * ```ts
 * import Decibri from 'decibri';
 *
 * const mic = new Decibri({ sampleRate: 16000, channels: 1 });
 *
 * mic.on('data', (chunk) => {
 *   // chunk is a Buffer of Int16 PCM samples
 * });
 * mic.on('error', (err) => console.error(err));
 * mic.on('backpressure', () => console.warn('Consumer too slow — consider dropping frames'));
 *
 * setTimeout(() => mic.stop(), 5000);
 * ```
 */
declare class Decibri extends Readable {
  constructor(options?: DecibriOptions);

  /**
   * Stop microphone capture and end the stream cleanly.
   * Safe to call multiple times — subsequent calls are no-ops.
   */
  stop(): void;

  /**
   * `true` while the microphone is actively capturing audio.
   */
  readonly isOpen: boolean;

  /**
   * Returns all available audio input devices on the system.
   *
   * @example
   * ```ts
   * const devices = Decibri.devices();
   * // [
   * //   { index: 0, name: 'Built-in Microphone', maxInputChannels: 1,
   * //     defaultSampleRate: 44100, isDefault: true },
   * //   ...
   * // ]
   * ```
   */
  static devices(): DeviceInfo[];

  /**
   * Returns version information for decibri and the bundled PortAudio library.
   *
   * @example
   * ```ts
   * Decibri.version();
   * // { decibri: '1.0.0', portaudio: 'PortAudio V19.7.0-devel...' }
   * ```
   */
  static version(): VersionInfo;

  // ── Event overloads ─────────────────────────────────────────────────────────
  //
  // The 'backpressure' event is added to all listener methods below.
  // It fires when push() returns false — the mic cannot be paused, so the
  // consumer should drain the stream or drop frames.

  addListener(event: 'close', listener: () => void): this;
  addListener(event: 'data', listener: (chunk: Buffer) => void): this;
  addListener(event: 'end', listener: () => void): this;
  addListener(event: 'error', listener: (err: Error) => void): this;
  addListener(event: 'pause', listener: () => void): this;
  addListener(event: 'readable', listener: () => void): this;
  addListener(event: 'resume', listener: () => void): this;
  addListener(event: 'backpressure', listener: () => void): this;
  addListener(event: 'speech', listener: () => void): this;
  addListener(event: 'silence', listener: () => void): this;
  addListener(event: string | symbol, listener: (...args: any[]) => void): this;

  emit(event: 'close'): boolean;
  emit(event: 'data', chunk: Buffer): boolean;
  emit(event: 'end'): boolean;
  emit(event: 'error', err: Error): boolean;
  emit(event: 'pause'): boolean;
  emit(event: 'readable'): boolean;
  emit(event: 'resume'): boolean;
  emit(event: 'backpressure'): boolean;
  emit(event: 'speech'): boolean;
  emit(event: 'silence'): boolean;
  emit(event: string | symbol, ...args: any[]): boolean;

  on(event: 'close', listener: () => void): this;
  on(event: 'data', listener: (chunk: Buffer) => void): this;
  on(event: 'end', listener: () => void): this;
  on(event: 'error', listener: (err: Error) => void): this;
  on(event: 'pause', listener: () => void): this;
  on(event: 'readable', listener: () => void): this;
  on(event: 'resume', listener: () => void): this;
  on(event: 'backpressure', listener: () => void): this;
  on(event: 'speech', listener: () => void): this;
  on(event: 'silence', listener: () => void): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this;

  once(event: 'close', listener: () => void): this;
  once(event: 'data', listener: (chunk: Buffer) => void): this;
  once(event: 'end', listener: () => void): this;
  once(event: 'error', listener: (err: Error) => void): this;
  once(event: 'pause', listener: () => void): this;
  once(event: 'readable', listener: () => void): this;
  once(event: 'resume', listener: () => void): this;
  once(event: 'backpressure', listener: () => void): this;
  once(event: 'speech', listener: () => void): this;
  once(event: 'silence', listener: () => void): this;
  once(event: string | symbol, listener: (...args: any[]) => void): this;

  prependListener(event: 'close', listener: () => void): this;
  prependListener(event: 'data', listener: (chunk: Buffer) => void): this;
  prependListener(event: 'end', listener: () => void): this;
  prependListener(event: 'error', listener: (err: Error) => void): this;
  prependListener(event: 'pause', listener: () => void): this;
  prependListener(event: 'readable', listener: () => void): this;
  prependListener(event: 'resume', listener: () => void): this;
  prependListener(event: 'backpressure', listener: () => void): this;
  prependListener(event: 'speech', listener: () => void): this;
  prependListener(event: 'silence', listener: () => void): this;
  prependListener(event: string | symbol, listener: (...args: any[]) => void): this;

  prependOnceListener(event: 'close', listener: () => void): this;
  prependOnceListener(event: 'data', listener: (chunk: Buffer) => void): this;
  prependOnceListener(event: 'end', listener: () => void): this;
  prependOnceListener(event: 'error', listener: (err: Error) => void): this;
  prependOnceListener(event: 'pause', listener: () => void): this;
  prependOnceListener(event: 'readable', listener: () => void): this;
  prependOnceListener(event: 'resume', listener: () => void): this;
  prependOnceListener(event: 'backpressure', listener: () => void): this;
  prependOnceListener(event: 'speech', listener: () => void): this;
  prependOnceListener(event: 'silence', listener: () => void): this;
  prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;

  removeListener(event: 'close', listener: () => void): this;
  removeListener(event: 'data', listener: (chunk: Buffer) => void): this;
  removeListener(event: 'end', listener: () => void): this;
  removeListener(event: 'error', listener: (err: Error) => void): this;
  removeListener(event: 'pause', listener: () => void): this;
  removeListener(event: 'readable', listener: () => void): this;
  removeListener(event: 'resume', listener: () => void): this;
  removeListener(event: 'backpressure', listener: () => void): this;
  removeListener(event: 'speech', listener: () => void): this;
  removeListener(event: 'silence', listener: () => void): this;
  removeListener(event: string | symbol, listener: (...args: any[]) => void): this;
}

export = Decibri;
