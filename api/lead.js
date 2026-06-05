import { getSAAccessToken, appendRow } from './_lib/google-sa.js';

function parseBody(req) {
  const b = req.body;
  if (!b) return {};
  if (typeof b === 'string') return Object.fromEntries(new URLSearchParams(b));
  return b;
}

// Public relay: a deployed LP's COD form POSTs leads here; we append to the user's
// Sheet using the owner's Service Account. Always returns 200 fast so the form never blocks.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  try {
    const u = new URL(req.url, 'http://x');
    const sheetId = u.searchParams.get('s');
    const p = parseBody(req);
    if (sheetId && process.env.GOOGLE_SA_EMAIL && process.env.GOOGLE_SA_PRIVATE_KEY) {
      const key = process.env.GOOGLE_SA_PRIVATE_KEY.replace(/\\n/g, '\n');
      const token = await getSAAccessToken(process.env.GOOGLE_SA_EMAIL, key);
      await appendRow(token, sheetId, [
        p.ts || new Date().toISOString(),
        p.lp || '', p.name || '', p.phone || '', p.address || '', p.fav || '', p.qty || '',
      ]);
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end('{"ok":true}');
  } catch (e) {
    res.statusCode = 200; // never block the form, even on failure
    res.setHeader('Content-Type', 'application/json');
    res.end('{"ok":false}');
  }
}
