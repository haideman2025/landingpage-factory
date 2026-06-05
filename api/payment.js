import { getSAAccessToken, appendRow, ensureTab } from './_lib/google-sa.js';
import { extractOrderCode } from '../src/payment/vietqr.js';

function parseBody(req) {
  const b = req.body;
  if (!b) return {};
  if (typeof b === 'string') { try { return JSON.parse(b); } catch (e) { return {}; } }
  return b;
}

// Payment webhook (SePay/Casso compatible). Point your bank-notification service at
// https://<app>/api/payment?s=<sheetId>. On an incoming transfer we log a row to the
// "Payments" tab of the user's Sheet (time, amount, content, order code). Always 200.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  try {
    const u = new URL(req.url, 'http://x');
    const sheetId = u.searchParams.get('s');
    const p = parseBody(req);

    const direction = p.transferType || p.type || 'in';
    const amount = p.transferAmount || p.amount || p.creditAmount || '';
    const content = p.content || p.description || p.transferContent || '';

    if (sheetId && direction === 'in' && process.env.GOOGLE_SA_EMAIL && process.env.GOOGLE_SA_PRIVATE_KEY) {
      const key = process.env.GOOGLE_SA_PRIVATE_KEY.replace(/\\n/g, '\n');
      const token = await getSAAccessToken(process.env.GOOGLE_SA_EMAIL, key);
      await ensureTab(token, sheetId, 'Payments');
      await appendRow(token, sheetId, [
        p.transactionDate || new Date().toISOString(),
        String(amount),
        String(content),
        extractOrderCode(content) || '',
        p.gateway || p.bank || '',
      ], fetch, 'Payments');
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end('{"success":true}');
  } catch (e) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end('{"success":false}');
  }
}
