import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { mockRes, installFetch } from './helpers.js';

const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const PEM = privateKey.export({ type: 'pkcs8', format: 'pem' });

beforeEach(() => {
  process.env.OAUTH_REDIRECT_BASE = 'https://app.example';
  process.env.GOOGLE_CLIENT_ID = 'g_id';
  process.env.GOOGLE_CLIENT_SECRET = 'g_secret';
  process.env.GOOGLE_SA_EMAIL = 'sa@proj.iam.gserviceaccount.com';
  process.env.GOOGLE_SA_PRIVATE_KEY = PEM.replace(/\n/g, '\\n'); // stored with escaped newlines
});

test('google authorize redirects with drive.file scope + state cookie', async () => {
  const { default: handler } = await import('../api/auth/google.js');
  const res = mockRes();
  handler({}, res);
  assert.equal(res.statusCode, 302);
  assert.match(res.headers['location'], /^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?/);
  assert.match(res.headers['location'], /drive\.file/);
  assert.match(res.headers['set-cookie'], /lpf_oauth_state=/);
});

test('google callback exchanges code and returns token + saEmail in popup HTML', async () => {
  const fx = installFetch([{ body: { access_token: 'ya29.USER' } }]);
  const { default: handler } = await import('../api/auth/google/callback.js');
  const res = mockRes();
  await handler({ url: '/api/auth/google/callback?code=c&state=S', headers: { cookie: 'lpf_oauth_state=S' } }, res);
  fx.restore();
  assert.match(res.body, /ya29\.USER/);
  assert.match(res.body, /sa@proj\.iam\.gserviceaccount\.com/);
  assert.equal(fx.calls[0].url, 'https://oauth2.googleapis.com/token');
});

test('lead relay signs SA JWT, gets token, appends the row', async () => {
  const fx = installFetch([
    { body: { access_token: 'ya29.SA' } },        // SA token
    { body: { updates: { updatedRows: 1 } } },    // append
  ]);
  const { default: handler } = await import('../api/lead.js');
  const res = mockRes();
  const req = { method: 'POST', url: '/api/lead?s=SHEET9', body: { name: 'Nguyen', phone: '090', address: 'HN', qty: '2', lp: 'LP1' } };
  await handler(req, res);
  fx.restore();
  assert.equal(res.statusCode, 200);
  assert.match(res.body, /ok":true/);
  // second call is the append, containing the lead name
  assert.match(fx.calls[1].url, /spreadsheets\/SHEET9\/values\/Orders!A1:append/);
  const sent = JSON.parse(fx.calls[1].opts.body);
  assert.ok(sent.values[0].includes('Nguyen'));
});

test('lead relay still returns 200 on failure (never blocks the form)', async () => {
  const fx = installFetch([{ ok: false, status: 400, body: { error: 'bad' } }]);
  const { default: handler } = await import('../api/lead.js');
  const res = mockRes();
  await handler({ method: 'POST', url: '/api/lead?s=X', body: { name: 'A' } }, res);
  fx.restore();
  assert.equal(res.statusCode, 200);
  assert.match(res.body, /ok":false/);
});

test('lead relay handles CORS preflight', async () => {
  const { default: handler } = await import('../api/lead.js');
  const res = mockRes();
  await handler({ method: 'OPTIONS', url: '/api/lead?s=X', headers: {} }, res);
  assert.equal(res.statusCode, 204);
  assert.equal(res.headers['access-control-allow-origin'], '*');
});
