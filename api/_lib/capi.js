import crypto from 'node:crypto';

// Normalize + SHA-256 hash a PII value per Meta/TikTok advanced-matching rules.
export function hashPII(value) {
  if (!value) return undefined;
  const norm = String(value).trim().toLowerCase();
  if (!norm) return undefined;
  return crypto.createHash('sha256').update(norm).digest('hex');
}

// Normalize a Vietnamese phone to E.164-ish digits before hashing (drop spaces/+, leading 0 -> 84).
export function normalizePhone(phone) {
  if (!phone) return undefined;
  let d = String(phone).replace(/[^0-9]/g, '');
  if (!d) return undefined;
  if (d.startsWith('0')) d = '84' + d.slice(1);
  return d;
}

// Build a Meta Conversions API event (server-side), matching the browser Pixel via eventId.
export function buildMetaEvent({ eventName = 'Lead', eventId, sourceUrl, phone, email, clientIp, userAgent, fbp, fbc, eventTime }) {
  const user_data = {};
  const ph = hashPII(normalizePhone(phone));
  if (ph) user_data.ph = [ph];
  const em = hashPII(email);
  if (em) user_data.em = [em];
  if (clientIp) user_data.client_ip_address = clientIp;
  if (userAgent) user_data.client_user_agent = userAgent;
  if (fbp) user_data.fbp = fbp;
  if (fbc) user_data.fbc = fbc;
  return {
    event_name: eventName,
    event_time: eventTime || Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: 'website',
    event_source_url: sourceUrl || undefined,
    user_data,
  };
}

export async function sendMetaCAPI(pixelId, accessToken, event, fetchImpl = fetch) {
  const url = `https://graph.facebook.com/v22.0/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`;
  const r = await fetchImpl(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [event] }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error('Meta CAPI ' + r.status + ': ' + JSON.stringify(d));
    err.status = r.status; err.data = d;
    throw err;
  }
  return d;
}

// Build a TikTok Events API 2.0 event, matching the browser pixel via event_id.
export function buildTikTokEvent({ eventName = 'SubmitForm', eventId, sourceUrl, phone, email, clientIp, userAgent, ttp, eventTime }) {
  const user = {};
  const ph = hashPII(normalizePhone(phone));
  if (ph) user.phone = ph;
  const em = hashPII(email);
  if (em) user.email = em;
  if (ttp) user.ttp = ttp;
  return {
    event: eventName,
    event_time: eventTime || Math.floor(Date.now() / 1000),
    event_id: eventId,
    user,
    page: sourceUrl ? { url: sourceUrl } : undefined,
    ip: clientIp || undefined,
    user_agent: userAgent || undefined,
  };
}

export async function sendTikTokEvents(pixelCode, accessToken, event, fetchImpl = fetch) {
  const url = 'https://business-api.tiktok.com/open_api/v1.3/event/track/';
  const r = await fetchImpl(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Access-Token': accessToken },
    body: JSON.stringify({ event_source: 'web', event_source_id: pixelCode, data: [event] }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || (d && d.code && d.code !== 0)) {
    const err = new Error('TikTok Events ' + r.status + ': ' + JSON.stringify(d));
    err.status = r.status; err.data = d;
    throw err;
  }
  return d;
}
