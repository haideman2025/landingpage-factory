import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseOAuthMessage, tokenCacheKey } from '../src/deploy/oauth-client.js';

const ORIGIN = 'https://app.example';

test('tokenCacheKey is namespaced per provider', () => {
  assert.equal(tokenCacheKey('vercel'), 'lpf_token_vercel');
  assert.equal(tokenCacheKey('github'), 'lpf_token_github');
});

test('parseOAuthMessage accepts a matching github message', () => {
  const ev = { origin: ORIGIN, data: { source: 'lpf-oauth', provider: 'github', token: 'gho_X' } };
  assert.deepEqual(parseOAuthMessage(ev, 'github', ORIGIN), { token: 'gho_X', teamId: null });
});

test('parseOAuthMessage returns teamId for vercel', () => {
  const ev = { origin: ORIGIN, data: { source: 'lpf-oauth', provider: 'vercel', token: 'v', teamId: 't1' } };
  assert.deepEqual(parseOAuthMessage(ev, 'vercel', ORIGIN), { token: 'v', teamId: 't1' });
});

test('parseOAuthMessage rejects wrong origin/provider/source', () => {
  assert.equal(parseOAuthMessage({ origin: 'https://evil', data: { source: 'lpf-oauth', provider: 'github', token: 'x' } }, 'github', ORIGIN), null);
  assert.equal(parseOAuthMessage({ origin: ORIGIN, data: { source: 'x', provider: 'github', token: 'x' } }, 'github', ORIGIN), null);
  assert.equal(parseOAuthMessage({ origin: ORIGIN, data: { source: 'lpf-oauth', provider: 'vercel', token: 'x' } }, 'github', ORIGIN), null);
});
