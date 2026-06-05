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

test('lead relay appends the row then reads Config (no CAPI when unset)', async () => {
  const fx = installFetch([
    { body: { access_token: 'ya29.SA' } },        // SA token
    { body: { updates: { updatedRows: 1 } } },    // append
    { body: { values: [] } },                     // Config read -> empty
  ]);
  const { default: handler } = await import('../api/lead.js');
  const res = mockRes();
  const req = { method: 'POST', url: '/api/lead?s=SHEET9', headers: {}, body: { name: 'Nguyen', phone: '0901234567', address: 'HN', qty: '2', lp: 'LP1' } };
  await handler(req, res);
  fx.restore();
  assert.equal(res.statusCode, 200);
  assert.match(res.body, /ok":true/);
  assert.match(fx.calls[1].url, /spreadsheets\/SHEET9\/values\/Orders!A1:append/);
  assert.ok(JSON.parse(fx.calls[1].opts.body).values[0].includes('Nguyen'));
  assert.match(fx.calls[2].url, /values\/Config!A:B/);
});

test('lead relay fires Meta CAPI with dedup event_id when Config has tokens', async () => {
  const fx = installFetch([
    { body: { access_token: 'ya29.SA' } },                                // SA token
    { body: { updates: { updatedRows: 1 } } },                            // append
    { body: { values: [['meta_pixel', 'PIX'], ['meta_token', 'TOK']] } }, // Config
    { body: { events_received: 1 } },                                     // Meta CAPI
  ]);
  const { default: handler } = await import('../api/lead.js');
  const res = mockRes();
  const req = { method: 'POST', url: '/api/lead?s=S', headers: { 'user-agent': 'UA' }, body: { name: 'A', phone: '0901234567', eid: 'EVT9', src: 'https://lp' } };
  await handler(req, res);
  fx.restore();
  assert.match(fx.calls[3].url, /graph\.facebook\.com\/v22\.0\/PIX\/events/);
  assert.equal(JSON.parse(fx.calls[3].opts.body).data[0].event_id, 'EVT9');
});

test('lead relay drops honeypot submissions without writing', async () => {
  const fx = installFetch([]); // no fetch should happen
  const { default: handler } = await import('../api/lead.js');
  const res = mockRes();
  await handler({ method: 'POST', url: '/api/lead?s=S', headers: {}, body: { name: 'bot', phone: '0901234567', website: 'http://spam' } }, res);
  fx.restore();
  assert.equal(res.statusCode, 200);
  assert.equal(fx.calls.length, 0);
});

test('lead relay ignores submissions with no valid phone', async () => {
  const fx = installFetch([]);
  const { default: handler } = await import('../api/lead.js');
  const res = mockRes();
  await handler({ method: 'POST', url: '/api/lead?s=S', headers: {}, body: { name: 'x', phone: '123' } }, res);
  fx.restore();
  assert.equal(fx.calls.length, 0);
});

test('lead relay still returns 200 on failure (never blocks the form)', async () => {
  const fx = installFetch([{ ok: false, status: 400, body: { error: 'bad' } }]);
  const { default: handler } = await import('../api/lead.js');
  const res = mockRes();
  await handler({ method: 'POST', url: '/api/lead?s=X', headers: {}, body: { name: 'A', phone: '0901234567' } }, res);
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
