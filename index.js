'use strict';

const { Readable } = require('stream');

// Load the pre-built binary (falls back to compiled build/ output)
const binding = require('node-gyp-build')(__dirname);

const { Decibri: NativeDecibri } = binding;

// ─── RMS helper ──────────────────────────────────────────────────────────────

function computeRMS(chunk, format) {
  let sum = 0, n;
  if (format === 'float32') {
    const samples = new Float32Array(chunk.buffer, chunk.byteOffset, chunk.length / 4);
    n = samples.length;
    for (let i = 0; i < n; i++) sum += samples[i] * samples[i];
  } else {
    const samples = new Int16Array(chunk.buffer, chunk.byteOffset, chunk.length / 2);
    n = samples.length;
    for (let i = 0; i < n; i++) {
      const s = samples[i] / 32768;
      sum += s * s;
    }
  }
  return n > 0 ? Math.sqrt(sum / n) : 0;
}

// ─── Decibri (Readable) ─────────────────────────────────────────────────────

/**
 * A Node.js Readable stream that emits raw PCM audio from the default
 * microphone as Buffer chunks.
 *
 * Audio format:
 *   - Encoding:    16-bit signed integer (Int16), little-endian
 *   - Sample rate: 16000 Hz  (default — ideal for speech/wake-word)
 *   - Channels:    1 (mono)  (default)
 *
 * @fires Decibri#backpressure - Emitted when the stream's internal buffer is
 *   full and the consumer is reading too slowly. The microphone cannot be
 *   paused, so chunks will continue to arrive; callers should drain or drop
 *   data as appropriate.
 *
 * @example
 * const mic = new Decibri();
 * mic.on('data', (chunk) => {
 *   // chunk is a Buffer of Int16 PCM samples
 * });
 * mic.on('error', (err) => console.error(err));
 * mic.on('backpressure', () => console.warn('Consumer too slow'));
 *
 * // Stop after 5 seconds
 * setTimeout(() => mic.stop(), 5000);
 */
class Decibri extends Readable {
  /**
   * @param {object} [options]
   * @param {number} [options.sampleRate=16000]           Samples per second (1000–384000)
   * @param {number} [options.channels=1]                 Number of input channels (1–32)
   * @param {number} [options.framesPerBuffer=1600]       Frames per audio callback (64–65536)
   * @param {number|string} [options.device]              Device index from Decibri.devices() or case-insensitive name substring
   * @param {'int16'|'float32'} [options.format='int16']  Sample encoding format
   * @param {boolean} [options.vad=false]                 Enable voice activity detection
   * @param {number}  [options.vadThreshold=0.01]         RMS energy threshold for speech (0–1)
   * @param {number}  [options.vadHoldoff=300]            ms of silence before 'silence' event fires
   */
  constructor(options = {}) {
    const {
      sampleRate      = 16000,
      channels        = 1,
      framesPerBuffer = 1600,
      device,
      format,
      vad             = false,
      vadThreshold    = 0.01,
      vadHoldoff      = 300,
      ...streamOptions
    } = options;

    // Resolve device name → index
    let resolvedDevice = device;
    if (typeof device === 'string') {
      const lower = device.toLowerCase();
      const matches = NativeDecibri.devices().filter(d =>
        d.name.toLowerCase().includes(lower)
      );
      if (matches.length === 0) {
        throw new TypeError(`No audio input device found matching "${device}"`);
      }
      if (matches.length > 1) {
        const names = matches.map(d => `  [${d.index}] ${d.name}`).join('\n');
        throw new TypeError(
          `Multiple devices match "${device}":\n${names}\nUse a more specific name or pass the device index directly.`
        );
      }
      resolvedDevice = matches[0].index;
    }

    super({ ...streamOptions, objectMode: false });

    const nativeOpts = { sampleRate, channels, framesPerBuffer };
    if (resolvedDevice !== undefined) nativeOpts.device = resolvedDevice;
    if (format !== undefined) nativeOpts.format = format;

    this._native       = new NativeDecibri(nativeOpts);
    this._started      = false;
    this._vad          = vad;
    this._vadThreshold = vadThreshold;
    this._vadHoldoff   = vadHoldoff;
    this._format       = format || 'int16';
    this._isSpeaking   = false;
    this._silenceTimer = null;
  }

  // Called by the stream machinery when it wants data
  _read() {
    if (this._started) return;
    this._started = true;

    this._native.start((err, chunk) => {
      if (err) {
        this._started = false;
        this.destroy(err);
        return;
      }
      // push returns false when the consumer is slow — we can't pause a mic,
      // but we surface the backpressure warning so callers can react.
      if (!this.push(chunk)) {
        this.emit('backpressure');
      }

      if (this._vad) {
        const rms = computeRMS(chunk, this._format);
        if (rms >= this._vadThreshold) {
          clearTimeout(this._silenceTimer);
          this._silenceTimer = null;
          if (!this._isSpeaking) {
            this._isSpeaking = true;
            this.emit('speech');
          }
        } else if (this._isSpeaking && !this._silenceTimer) {
          this._silenceTimer = setTimeout(() => {
            this._isSpeaking = false;
            this._silenceTimer = null;
            this.emit('silence');
          }, this._vadHoldoff);
        }
      }
    });
  }

  /**
   * Stop microphone capture and end the stream cleanly.
   */
  stop() {
    if (!this._started) return;
    this._started = false;
    this._native.stop();
    clearTimeout(this._silenceTimer);
    this._silenceTimer = null;
    this.push(null); // signals stream end
  }

  /**
   * Whether the microphone is currently open.
   * @returns {boolean}
   */
  get isOpen() {
    return this._native.isOpen();
  }

  /**
   * List all available input devices on the system.
   * @returns {Array<{index: number, name: string, maxInputChannels: number, defaultSampleRate: number, isDefault: boolean}>}
   */
  static devices() {
    return NativeDecibri.devices();
  }

  /**
   * Version information for decibri and the bundled PortAudio.
   * @returns {{ decibri: string, portaudio: string }}
   */
  static version() {
    return NativeDecibri.version();
  }
}

module.exports = Decibri;
