import { makeState, stateCookie } from '../_lib/oauth.js';

export default function handler(req, res) {
  const base = process.env.OAUTH_REDIRECT_BASE;
  const state = makeState();
  const redirectUri = `${base}/api/auth/github/callback`;
  const url = 'https://github.com/login/oauth/authorize'
    + `?client_id=${encodeURIComponent(process.env.GITHUB_CLIENT_ID)}`
    + `&redirect_uri=${encodeURIComponent(redirectUri)}`
    + '&scope=repo'
    + `&state=${state}`;
  res.setHeader('Set-Cookie', stateCookie(state));
  res.statusCode = 302;
  res.setHeader('Location', url);
  res.end();
}
