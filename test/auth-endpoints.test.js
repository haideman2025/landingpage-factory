import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockRes, installFetch } from './helpers.js';

beforeEach(() => {
  process.env.OAUTH_REDIRECT_BASE = 'https://app.example';
  process.env.GITHUB_CLIENT_ID = 'gh_id';
  process.env.GITHUB_CLIENT_SECRET = 'gh_secret';
  process.env.VERCEL_CLIENT_ID = 'vc_id';
  process.env.VERCEL_CLIENT_SECRET = 'vc_secret';
});

test('github authorize redirects with client_id + scope=repo + state cookie', async () => {
  const { default: handler } = await import('../api/auth/github.js');
  const res = mockRes();
  handler({}, res);
  assert.equal(res.statusCode, 302);
  const loc = res.headers['location'];
  assert.match(loc, /^https:\/\/github\.com\/login\/oauth\/authorize\?/);
  assert.match(loc, /client_id=gh_id/);
  assert.match(loc, /scope=repo/);
  assert.match(res.headers['set-cookie'], /lpf_oauth_state=/);
});

test('vercel authorize redirects with client_id + state cookie', async () => {
  const { default: handler } = await import('../api/auth/vercel.js');
  const res = mockRes();
  handler({}, res);
  assert.equal(res.statusCode, 302);
  assert.match(res.headers['location'], /^https:\/\/vercel\.com\/oauth\/authorize\?/);
  assert.match(res.headers['location'], /client_id=vc_id/);
});

test('github callback rejects mismatched state', async () => {
  const { default: handler } = await import('../api/auth/github/callback.js');
  const res = mockRes();
  await handler({ url: '/api/auth/github/callback?code=c&state=WRONG', headers: { cookie: 'lpf_oauth_state=RIGHT' } }, res);
  assert.equal(res.statusCode, 400);
});

test('github callback exchanges code and returns token in popup HTML', async () => {
  const fx = installFetch([{ body: { access_token: 'gho_TOKEN' } }]);
  const { default: handler } = await import('../api/auth/github/callback.js');
  const res = mockRes();
  await handler({ url: '/api/auth/github/callback?code=c&state=S', headers: { cookie: 'lpf_oauth_state=S' } }, res);
  fx.restore();
  assert.match(res.headers['content-type'], /text\/html/);
  assert.match(res.body, /gho_TOKEN/);
  assert.equal(fx.calls[0].url, 'https://github.com/login/oauth/access_token');
});

test('vercel callback exchanges code and returns token + teamId', async () => {
  const fx = installFetch([{ body: { access_token: 'vc_TOKEN', team_id: 'team_1' } }]);
  const { default: handler } = await import('../api/auth/vercel/callback.js');
  const res = mockRes();
  await handler({ url: '/api/auth/vercel/callback?code=c&state=S', headers: { cookie: 'lpf_oauth_state=S' } }, res);
  fx.restore();
  assert.match(res.body, /vc_TOKEN/);
  assert.match(res.body, /team_1/);
});
