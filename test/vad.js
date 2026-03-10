'use strict';
// Live VAD test — microphone required.
// Speak into the mic; you should see SPEECH and SILENCE alternate.
// Run: node test/vad.js

const MicStream = require('../index');

const DURATION_MS    = 10000;
const VAD_THRESHOLD  = 0.01;
const VAD_HOLDOFF_MS = 300;

console.log(`VAD test running for ${DURATION_MS / 1000}s...`);
console.log(`Threshold: ${VAD_THRESHOLD} | Holdoff: ${VAD_HOLDOFF_MS}ms`);
console.log('Speak into your microphone.\n');

const mic = new MicStream({
  vad:          true,
  vadThreshold: VAD_THRESHOLD,
  vadHoldoff:   VAD_HOLDOFF_MS,
});

mic.on('data',        () => {}); // keep stream flowing so VAD processes chunks
mic.on('speech',      () => console.log(`[${timestamp()}] SPEECH`));
mic.on('silence',     () => console.log(`[${timestamp()}] SILENCE`));
mic.on('error',       (err) => { console.error('Error:', err.message); process.exit(1); });
mic.on('backpressure',() => console.warn('Backpressure'));

setTimeout(() => {
  mic.stop();
  console.log('\nVAD test complete.');
}, DURATION_MS);

function timestamp() {
  return new Date().toISOString().slice(11, 23);
}