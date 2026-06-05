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
  const r = await fetch('https://api.vercel.com/v2/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.VERCEL_CLIENT_ID,
      client_secret: process.env.VERCEL_CLIENT_SECRET,
      code,
      redirect_uri: `${base}/api/auth/vercel/callback`,
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
  res.end(popupResultHTML('vercel', { token: data.access_token, teamId: data.team_id || null }, base));
}
