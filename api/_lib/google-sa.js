import crypto from 'node:crypto';

function b64url(input) {
  return Buffer.from(input).toString('base64')
    .replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

// Build a signed RS256 JWT for a Google service account (zero-dependency).
export function buildSignedJWT(saEmail, privateKey, scope, nowSec) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: saEmail,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    iat: nowSec,
    exp: nowSec + 3600,
  };
  const unsigned = b64url(JSON.stringify(header)) + '.' + b64url(JSON.stringify(claim));
  const sig = crypto.sign('RSA-SHA256', Buffer.from(unsigned), privateKey);
  return unsigned + '.' + b64url(sig);
}

// Exchange the signed JWT for a short-lived access token.
export async function getSAAccessToken(saEmail, privateKey, fetchImpl = fetch, nowSec = Math.floor(Date.now() / 1000)) {
  const jwt = buildSignedJWT(saEmail, privateKey, 'https://www.googleapis.com/auth/spreadsheets', nowSec);
  const r = await fetchImpl('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString(),
  });
  const d = await r.json();
  if (!d.access_token) throw new Error('SA token failed: ' + (d.error_description || d.error || 'unknown'));
  return d.access_token;
}

// Read the "Config" tab (key in col A, value in col B) into a plain object.
// Returns {} if the tab is missing or empty.
export async function getSheetConfig(accessToken, sheetId, fetchImpl = fetch) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Config!A:B`;
  const r = await fetchImpl(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!r.ok) return {};
  const d = await r.json().catch(() => ({}));
  const out = {};
  for (const row of d.values || []) {
    if (row[0]) out[String(row[0]).trim()] = (row[1] != null ? String(row[1]) : '');
  }
  return out;
}

// Append one row to the "Orders" tab of a spreadsheet.
export async function appendRow(accessToken, sheetId, values, fetchImpl = fetch) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Orders!A1:append`
    + '?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS';
  const r = await fetchImpl(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [values] }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error('Sheets append failed: ' + t);
  }
  return true;
}
