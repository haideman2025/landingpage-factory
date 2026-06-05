import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAmount, buildVietQRUrl, genOrderCode, extractOrderCode } from '../src/payment/vietqr.js';

test('parseAmount extracts integer VND from formatted price strings', () => {
  assert.equal(parseAmount('299.000đ'), 299000);
  assert.equal(parseAmount('1,290,000 VND'), 1290000);
  assert.equal(parseAmount('Liên hệ'), null);
  assert.equal(parseAmount(''), null);
});

test('buildVietQRUrl builds an img.vietqr.io URL with amount + note', () => {
  const u = buildVietQRUrl({ bank: 'MB', account: '1131331313', accountName: 'NGUYEN A', amount: 299000, note: 'DHABC123' });
  assert.match(u, /^https:\/\/img\.vietqr\.io\/image\/MB-1131331313-compact2\.png\?/);
  assert.match(u, /amount=299000/);
  assert.match(u, /addInfo=DHABC123/);
  assert.match(u, /accountName=NGUYEN%20A/);
});

test('buildVietQRUrl returns empty when bank/account missing', () => {
  assert.equal(buildVietQRUrl({ amount: 1 }), '');
});

test('genOrderCode is deterministic given a seed and starts with DH', () => {
  assert.equal(genOrderCode(0.5), genOrderCode(0.5));
  assert.match(genOrderCode(0.5), /^DH[0-9A-Z]+$/);
});

test('extractOrderCode finds DH code inside a transfer description', () => {
  assert.equal(extractOrderCode('CHUYEN KHOAN DHAB12CD nguyen van a'), 'DHAB12CD');
  assert.equal(extractOrderCode('khong co ma'), null);
  assert.equal(extractOrderCode(''), null);
});
