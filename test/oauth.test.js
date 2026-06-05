import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeState, stateCookie, readCookie, popupResultHTML } from '../api/_lib/oauth.js';

test('makeState returns a long random hex string', () => {
  const a = makeState(), b = makeState();
  assert.match(a, /^[0-9a-f]{32}$/);
  assert.notEqual(a, b);
});

test('stateCookie is httpOnly + Secure + has the value', () => {
  const c = stateCookie('abc123');
  assert.match(c, /lpf_oauth_state=abc123/);
  assert.match(c, /HttpOnly/);
  assert.match(c, /Secure/);
});

test('readCookie extracts a named cookie', () => {
  assert.equal(readCookie('x=1; lpf_oauth_state=abc; y=2', 'lpf_oauth_state'), 'abc');
  assert.equal(readCookie('', 'lpf_oauth_state'), null);
  assert.equal(readCookie(undefined, 'lpf_oauth_state'), null);
});

test('popupResultHTML embeds token + origin and posts to opener', () => {
  const html = popupResultHTML('github', { token: 'gho_X' }, 'https://app.example');
  assert.match(html, /gho_X/);
  assert.match(html, /https:\/\/app\.example/);
  assert.match(html, /postMessage/);
  assert.match(html, /lpf-oauth/);
});
