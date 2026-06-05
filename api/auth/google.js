import { makeState, stateCookie } from '../_lib/oauth.js';

export default function handler(req, res) {
  const base = process.env.OAUTH_REDIRECT_BASE;
  const state = makeState();
  const redirectUri = `${base}/api/auth/google/callback`;
  const scope = 'openid email profile https://www.googleapis.com/auth/drive.file';
  const url = 'https://accounts.google.com/o/oauth2/v2/auth'
    + `?client_id=${encodeURIComponent(process.env.GOOGLE_CLIENT_ID)}`
    + `&redirect_uri=${encodeURIComponent(redirectUri)}`
    + '&response_type=code'
    + `&scope=${encodeURIComponent(scope)}`
    + '&access_type=online&include_granted_scopes=true'
    + `&state=${state}`;
  res.setHeader('Set-Cookie', stateCookie(state));
  res.statusCode = 302;
  res.setHeader('Location', url);
  res.end();
}
