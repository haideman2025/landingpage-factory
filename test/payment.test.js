import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { mockRes, installFetch } from './helpers.js';

const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const PEM = privateKey.export({ type: 'pkcs8', format: 'pem' });

beforeEach(() => {
  process.env.GOOGLE_SA_EMAIL = 'sa@proj.iam.gserviceaccount.com';
  process.env.GOOGLE_SA_PRIVATE_KEY = PEM.replace(/\n/g, '\\n');
});

test('payment webhook logs incoming transfer to Payments tab with extracted order code', async () => {
  const fx = installFetch([
    { body: { access_token: 'ya29.SA' } }, // SA token
    { body: {} },                          // ensureTab batchUpdate
    { body: { updates: { updatedRows: 1 } } }, // append to Payments
  ]);
  const { default: handler } = await import('../api/payment.js');
  const res = mockRes();
  const req = { method: 'POST', url: '/api/payment?s=SHEET1', headers: {},
    body: { transferType: 'in', transferAmount: 299000, content: 'CK DHAB12CD nguyen a', gateway: 'MB' } };
  await handler(req, res);
  fx.restore();
  assert.equal(res.statusCode, 200);
  assert.match(res.body, /success":true/);
  assert.match(fx.calls[1].url, /:batchUpdate/);
  assert.match(fx.calls[2].url, /values\/Payments!A1:append/);
  const row = JSON.parse(fx.calls[2].opts.body).values[0];
  assert.ok(row.includes('DHAB12CD'));
});

test('payment webhook ignores outgoing transfers', async () => {
  const fx = installFetch([]);
  const { default: handler } = await import('../api/payment.js');
  const res = mockRes();
  await handler({ method: 'POST', url: '/api/payment?s=S', headers: {}, body: { transferType: 'out', transferAmount: 1 } }, res);
  fx.restore();
  assert.equal(fx.calls.length, 0);
  assert.equal(res.statusCode, 200);
});

test('payment webhook handles CORS preflight', async () => {
  const { default: handler } = await import('../api/payment.js');
  const res = mockRes();
  await handler({ method: 'OPTIONS', url: '/api/payment', headers: {} }, res);
  assert.equal(res.statusCode, 204);
});
