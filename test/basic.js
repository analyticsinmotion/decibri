'use strict';

const Decibri = require('../index');

// ── Static API checks (no hardware needed) ──────────────────────────────────

console.log('Testing Decibri.version()...');
const ver = Decibri.version();
console.assert(typeof ver.decibri === 'string', 'decibri version is a string');
console.assert(typeof ver.portaudio === 'string', 'portaudio version is a string');
console.log('  decibri:', ver.decibri);
console.log('  portaudio:', ver.portaudio);

console.log('\nTesting Decibri.devices()...');
const devices = Decibri.devices();
console.assert(Array.isArray(devices), 'devices() returns an array');
if (devices.length === 0) {
  console.warn('  WARNING: No input devices found. Is a microphone connected?');
} else {
  console.log(`  Found ${devices.length} input device(s):`);
  devices.forEach((d) => {
    const marker = d.isDefault ? ' (default)' : '';
    console.log(`  [${d.index}] ${d.name}${marker} — ${d.maxInputChannels}ch @ ${d.defaultSampleRate}Hz`);
  });
}

// ── Live capture test (5 seconds) ───────────────────────────────────────────

if (process.argv.includes('--live')) {
  console.log('\nStarting live capture for 5 seconds...');
  const mic = new Decibri({ sampleRate: 16000, channels: 1 });
  let totalBytes = 0;

  mic.on('data', (chunk) => {
    totalBytes += chunk.length;
  });

  mic.on('error', (err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });

  setTimeout(() => {
    mic.stop();
    const seconds = 5;
    const samples = totalBytes / 2; // Int16 = 2 bytes
    console.log(`  Captured ${totalBytes} bytes = ${samples} samples over ${seconds}s`);
    console.log(`  Effective sample rate: ${Math.round(samples / seconds)} Hz`);
    console.log('\nAll tests passed.');
  }, 5000);
}

// ── VAD options — accepted without error ──────────────────────────────────────
console.log('\nTesting VAD constructor options...');
const vadMic = new Decibri({ vad: true, vadThreshold: 0.02, vadHoldoff: 500 });
console.assert(vadMic !== null, 'VAD options accepted');
vadMic.stop();

// ── 16kHz sample rate (standard for most integrations) ──────
console.log('\nTesting 16kHz sample rate...');
const mic16k = new Decibri({ sampleRate: 16000, channels: 1 });
console.assert(mic16k !== null, '16kHz accepted');
mic16k.stop();
console.log('  16kHz OK');

// ── 24kHz sample rate (OpenAI Realtime — only non-16kHz integration) ──
console.log('\nTesting 24kHz sample rate...');
const mic24k = new Decibri({ sampleRate: 24000, channels: 1 });
console.assert(mic24k !== null, '24kHz accepted');
mic24k.stop();
console.log('  24kHz OK');

// ── Explicit int16 format (required by all cloud integrations) ──
console.log('\nTesting explicit int16 format...');
const micInt16 = new Decibri({ format: 'int16' });
console.assert(micInt16 !== null, 'int16 accepted');
micInt16.stop();
console.log('  int16 OK');

// ── Device by name — no match throws TypeError ────────────────────────────────
console.log('\nTesting device-by-name (no match)...');
try {
  new Decibri({ device: '__no_device_will_ever_match_this__' });
  console.assert(false, 'should have thrown');
} catch (e) {
  console.assert(e instanceof TypeError, 'throws TypeError for no match');
  console.log('  TypeError:', e.message.split('\n')[0]);
}

console.log('\nAll static tests passed.');
console.log('Run with --live flag to test actual microphone capture.');
