import { makeState, stateCookie } from '../_lib/oauth.js';

export default function handler(req, res) {
  const base = process.env.OAUTH_REDIRECT_BASE;
  const state = makeState();
  const redirectUri = `${base}/api/auth/vercel/callback`;
  const url = 'https://vercel.com/oauth/authorize'
    + `?client_id=${encodeURIComponent(process.env.VERCEL_CLIENT_ID)}`
    + `&redirect_uri=${encodeURIComponent(redirectUri)}`
    + `&state=${state}`;
  res.setHeader('Set-Cookie', stateCookie(state));
  res.statusCode = 302;
  res.setHeader('Location', url);
  res.end();
}
