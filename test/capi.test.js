import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { installFetch } from './helpers.js';
import { hashPII, normalizePhone, buildMetaEvent, sendMetaCAPI, buildTikTokEvent, sendTikTokEvents } from '../api/_lib/capi.js';

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

test('hashPII lowercases, trims, sha256s; empty -> undefined', () => {
  assert.equal(hashPII('  Test@X.COM '), sha256('test@x.com'));
  assert.equal(hashPII(''), undefined);
  assert.equal(hashPII(null), undefined);
});

test('normalizePhone strips non-digits and converts leading 0 to 84', () => {
  assert.equal(normalizePhone('090 123 4567'), '84901234567');
  assert.equal(normalizePhone('+84901234567'), '84901234567');
  assert.equal(normalizePhone(''), undefined);
});

test('buildMetaEvent hashes phone/email and carries dedup event_id', () => {
  const ev = buildMetaEvent({ eventId: 'EID1', phone: '0901234567', email: 'A@b.com', clientIp: '1.2.3.4', userAgent: 'UA', sourceUrl: 'https://lp', eventTime: 100 });
  assert.equal(ev.event_id, 'EID1');
  assert.equal(ev.action_source, 'website');
  assert.equal(ev.event_time, 100);
  assert.deepEqual(ev.user_data.ph, [sha256('84901234567')]);
  assert.deepEqual(ev.user_data.em, [sha256('a@b.com')]);
  assert.equal(ev.user_data.client_ip_address, '1.2.3.4');
});

test('sendMetaCAPI posts to graph v22 with the pixel + token', async () => {
  const fx = installFetch([{ body: { events_received: 1 } }]);
  await sendMetaCAPI('PIX1', 'TOK1', { event_name: 'Lead' });
  fx.restore();
  assert.match(fx.calls[0].url, /graph\.facebook\.com\/v22\.0\/PIX1\/events\?access_token=TOK1/);
  assert.deepEqual(JSON.parse(fx.calls[0].opts.body).data[0].event_name, 'Lead');
});

test('sendMetaCAPI throws on error response', async () => {
  const fx = installFetch([{ ok: false, status: 400, body: { error: { message: 'bad pixel' } } }]);
  await assert.rejects(() => sendMetaCAPI('P', 'T', {}), /Meta CAPI 400/);
  fx.restore();
});

test('buildTikTokEvent hashes user fields with dedup event_id', () => {
  const ev = buildTikTokEvent({ eventId: 'EID2', phone: '0901234567', email: 'A@b.com', eventTime: 50 });
  assert.equal(ev.event_id, 'EID2');
  assert.equal(ev.user.phone, sha256('84901234567'));
  assert.equal(ev.user.email, sha256('a@b.com'));
});

test('sendTikTokEvents posts to events API and treats code!=0 as error', async () => {
  const ok = installFetch([{ body: { code: 0 } }]);
  await sendTikTokEvents('TTPIX', 'TTTOK', { event: 'SubmitForm' });
  ok.restore();
  assert.match(ok.calls[0].url, /business-api\.tiktok\.com\/open_api\/v1\.3\/event\/track/);
  assert.equal(ok.calls[0].opts.headers['Access-Token'], 'TTTOK');

  const bad = installFetch([{ body: { code: 40001, message: 'nope' } }]);
  await assert.rejects(() => sendTikTokEvents('P', 'T', {}), /TikTok Events/);
  bad.restore();
});
