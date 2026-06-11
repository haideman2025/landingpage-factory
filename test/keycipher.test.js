import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encrypt, decrypt } from '../src/crypto/keycipher.js';

const KEY = '0'.repeat(64); // 32 bytes hex

test('decrypt(encrypt(x)) round-trips', () => {
  const enc = encrypt('AIzaSy-secret-key', KEY);
  assert.notEqual(enc, 'AIzaSy-secret-key');
  assert.equal(decrypt(enc, KEY), 'AIzaSy-secret-key');
});

test('ciphertext differs each call (random IV)', () => {
  assert.notEqual(encrypt('same', KEY), encrypt('same', KEY));
});

test('tampered ciphertext throws', () => {
  const enc = encrypt('secret', KEY);
  const bad = enc.slice(0, -4) + 'AAAA';
  assert.throws(() => decrypt(bad, KEY));
});
