'use strict';
const Decibri = require('../index');

// Test float32 constructs OK
const mic = new Decibri({ format: 'float32' });
console.log('float32 constructed OK');
mic.stop();

// Test invalid format throws
try {
  new Decibri({ format: 'invalid' });
  console.log('FAIL — should have thrown');
} catch (e) {
  console.log('TypeError thrown OK:', e.message);
}

console.log('All float32 tests passed.');
