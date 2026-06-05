import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { installFetch } from './helpers.js';
import { buildSignedJWT, getSAAccessToken, appendRow } from '../api/_lib/google-sa.js';

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const PEM = privateKey.export({ type: 'pkcs8', format: 'pem' });

function decodeSegment(seg) {
  return JSON.parse(Buffer.from(seg.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
}

test('buildSignedJWT produces a verifiable RS256 JWT with correct claims', () => {
  const jwt = buildSignedJWT('sa@proj.iam.gserviceaccount.com', PEM, 'scope-x', 1000);
  const [h, c, s] = jwt.split('.');
  assert.deepEqual(decodeSegment(h), { alg: 'RS256', typ: 'JWT' });
  const claim = decodeSegment(c);
  assert.equal(claim.iss, 'sa@proj.iam.gserviceaccount.com');
  assert.equal(claim.aud, 'https://oauth2.googleapis.com/token');
  assert.equal(claim.exp - claim.iat, 3600);
  // signature verifies against the public key
  const sig = Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  assert.equal(crypto.verify('RSA-SHA256', Buffer.from(h + '.' + c), publicKey, sig), true);
});

test('getSAAccessToken posts a jwt-bearer assertion and returns the token', async () => {
  const fx = installFetch([{ body: { access_token: 'ya29.SA' } }]);
  const tok = await getSAAccessToken('sa@x', PEM, fetch, 1000);
  fx.restore();
  assert.equal(tok, 'ya29.SA');
  assert.equal(fx.calls[0].url, 'https://oauth2.googleapis.com/token');
  assert.match(fx.calls[0].opts.body, /grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer/);
});

test('getSAAccessToken throws on error response', async () => {
  const fx = installFetch([{ body: { error: 'invalid_grant', error_description: 'bad' } }]);
  await assert.rejects(() => getSAAccessToken('sa@x', PEM, fetch, 1000), /bad/);
  fx.restore();
});

test('appendRow posts row values to the Orders append endpoint', async () => {
  const fx = installFetch([{ body: { updates: { updatedRows: 1 } } }]);
  await appendRow('ya29.SA', 'SHEET123', ['t', 'lp', 'Name', '090', 'addr', '', '2'], fetch);
  fx.restore();
  assert.match(fx.calls[0].url, /spreadsheets\/SHEET123\/values\/Orders!A1:append/);
  const sent = JSON.parse(fx.calls[0].opts.body);
  assert.deepEqual(sent.values[0][2], 'Name');
});
