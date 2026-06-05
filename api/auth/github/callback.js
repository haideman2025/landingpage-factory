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
  const r = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${base}/api/auth/github/callback`,
    }),
  });
  const data = await r.json();
  if (!data.access_token) {
    res.statusCode = 400;
    res.end('Token exchange failed');
    return;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Set-Cookie', clearStateCookie());
  res.end(popupResultHTML('github', { token: data.access_token }, base));
}
