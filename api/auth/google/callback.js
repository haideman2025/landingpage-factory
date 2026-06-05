import { readCookie, clearStateCookie, popupResultHTML } from '../../_lib/oauth.js';

export default async function handler(req, res) {
  const base = process.env.OAUTH_REDIRECT_BASE;
  const u = new URL(req.url, base);
  const code = u.searchParams.get('code');
  const state = u.searchParams.get('state');
  const cookieState = readCookie(req.headers && req.headers.cookie, 'lpf_oauth_state');

  if (!code || !state || state !== cookieState) {
    res.statusCode = 400;
    res.end('Invalid OAuth state');
    return;
  }
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${base}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    }).toString(),
  });
  const data = await r.json();
  if (!data.access_token) {
    res.statusCode = 400;
    res.end('Token exchange failed');
    return;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Set-Cookie', clearStateCookie());
  res.end(popupResultHTML('google', { token: data.access_token, saEmail: process.env.GOOGLE_SA_EMAIL || null }, base));
}
