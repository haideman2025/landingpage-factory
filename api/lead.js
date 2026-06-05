import { getSAAccessToken, appendRow, getSheetConfig } from './_lib/google-sa.js';
import { buildMetaEvent, sendMetaCAPI, buildTikTokEvent, sendTikTokEvents } from './_lib/capi.js';

function parseBody(req) {
  const b = req.body;
  if (!b) return {};
  if (typeof b === 'string') return Object.fromEntries(new URLSearchParams(b));
  return b;
}

function clientIp(req) {
  const xff = req.headers && (req.headers['x-forwarded-for'] || req.headers['X-Forwarded-For']);
  if (xff) return String(xff).split(',')[0].trim();
  return undefined;
}

// Public relay: a deployed LP's COD form POSTs leads here. We append to the user's Sheet
// (via Service Account) and fire server-side Meta CAPI + TikTok Events with the same
// event_id as the browser pixel (dedup). Always returns 200 fast so the form never blocks.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  try {
    const u = new URL(req.url, 'http://x');
    const sheetId = u.searchParams.get('s');
    const p = parseBody(req);

    // Honeypot: bots fill the hidden field; humans leave it empty. Silently drop.
    if (p.website || p.url || p.company_url) {
      res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); res.end('{"ok":true}');
      return;
    }
    // Basic validation: require a plausible phone (digits).
    const phoneDigits = String(p.phone || '').replace(/[^0-9]/g, '');
    const valid = phoneDigits.length >= 8;

    if (sheetId && valid && process.env.GOOGLE_SA_EMAIL && process.env.GOOGLE_SA_PRIVATE_KEY) {
      const key = process.env.GOOGLE_SA_PRIVATE_KEY.replace(/\\n/g, '\n');
      const saToken = await getSAAccessToken(process.env.GOOGLE_SA_EMAIL, key);

      await appendRow(saToken, sheetId, [
        p.ts || new Date().toISOString(),
        p.lp || '', p.name || '', p.phone || '', p.address || '', p.fav || '', p.qty || '',
      ]);

      // Server-side conversions (best-effort; never block the response).
      const cfg = await getSheetConfig(saToken, sheetId).catch(() => ({}));
      const ctx = {
        eventId: p.eid || undefined,
        sourceUrl: p.src || undefined,
        phone: p.phone, email: p.email,
        clientIp: clientIp(req), userAgent: req.headers && req.headers['user-agent'],
        fbp: p.fbp, fbc: p.fbc, ttp: p.ttp,
      };
      const jobs = [];
      if (cfg.meta_pixel && cfg.meta_token) {
        jobs.push(sendMetaCAPI(cfg.meta_pixel, cfg.meta_token, buildMetaEvent(ctx)).catch(() => {}));
      }
      if (cfg.tiktok_pixel && cfg.tiktok_token) {
        jobs.push(sendTikTokEvents(cfg.tiktok_pixel, cfg.tiktok_token, buildTikTokEvent(ctx)).catch(() => {}));
      }
      await Promise.all(jobs);
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
