import { adminClient, userFromReq } from './_lib/supabase-admin.js';
import { encrypt, decrypt } from '../src/crypto/keycipher.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const user = await userFromReq(req);
  if (!user) { res.statusCode = 401; return res.end(JSON.stringify({ error: 'unauthorized' })); }
  const db = adminClient();

  if (req.method === 'GET') {
    const { data } = await db.from('profiles').select('gemini_key_enc').eq('id', user.id).single();
    let key = '';
    try { if (data && data.gemini_key_enc) key = decrypt(data.gemini_key_enc, process.env.APP_ENC_KEY); } catch (_) {}
    return res.end(JSON.stringify({ key }));
  }

  if (req.method === 'POST') {
    let body = '';
    for await (const ch of req) body += ch;
    let key = '';
    try { key = (JSON.parse(body || '{}').key) || ''; } catch (_) {}
    const enc = key ? encrypt(String(key), process.env.APP_ENC_KEY) : null;
    const { error } = await db.from('profiles').update({ gemini_key_enc: enc }).eq('id', user.id);
    if (error) { res.statusCode = 500; return res.end(JSON.stringify({ error: error.message })); }
    return res.end(JSON.stringify({ ok: true }));
  }

  res.statusCode = 405;
  res.end(JSON.stringify({ error: 'method not allowed' }));
}
