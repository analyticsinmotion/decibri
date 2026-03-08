'use strict';

const { Readable } = require('stream');

// Load the pre-built binary (falls back to compiled build/ output)
const binding = require('node-gyp-build')(__dirname);

const { MicStream: NativeMicStream } = binding;

// ─── MicStream (Readable) ────────────────────────────────────────────────────

/**
 * A Node.js Readable stream that emits raw PCM audio from the default
 * microphone as Buffer chunks.
 *
 * Audio format:
 *   - Encoding:    16-bit signed integer (Int16), little-endian
 *   - Sample rate: 16000 Hz  (default — ideal for speech/wake-word)
 *   - Channels:    1 (mono)  (default)
 *
 * @fires MicStream#backpressure - Emitted when the stream's internal buffer is
 *   full and the consumer is reading too slowly. The microphone cannot be
 *   paused, so chunks will continue to arrive; callers should drain or drop
 *   data as appropriate.
 *
 * @example
 * const mic = new MicStream();
 * mic.on('data', (chunk) => {
 *   // chunk is a Buffer of Int16 PCM samples
 * });
 * mic.on('error', (err) => console.error(err));
 * mic.on('backpressure', () => console.warn('Consumer too slow'));
 *
 * // Stop after 5 seconds
 * setTimeout(() => mic.stop(), 5000);
 */
class MicStream extends Readable {
  /**
   * @param {object} [options]
   * @param {number} [options.sampleRate=16000]        Samples per second (1000–384000)
   * @param {number} [options.channels=1]              Number of input channels (1–32)
   * @param {number} [options.framesPerBuffer=1600]    Frames per audio callback (64–65536)
   * @param {number} [options.device]                  Device index from MicStream.devices(); omit to use system default
   */
  constructor(options = {}) {
    const {
      sampleRate       = 16000,
      channels         = 1,
      framesPerBuffer  = 1600,
      device,
      ...streamOptions
    } = options;

    super({ ...streamOptions, objectMode: false });

    const nativeOpts = { sampleRate, channels, framesPerBuffer };
    if (device !== undefined) nativeOpts.device = device;

    this._native  = new NativeMicStream(nativeOpts);
    this._started = false;
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
    });
  }

  /**
   * Stop microphone capture and end the stream cleanly.
   */
  stop() {
    if (!this._started) return;
    this._started = false;
    this._native.stop();
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
    return NativeMicStream.devices();
  }

  /**
   * Version information for micstream and the bundled PortAudio.
   * @returns {{ micstream: string, portaudio: string }}
   */
  static version() {
    return NativeMicStream.version();
  }
}

module.exports = MicStream;
