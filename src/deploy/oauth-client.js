export function parseOAuthMessage(ev, provider, expectedOrigin) {
  if (!ev || ev.origin !== expectedOrigin) return null;
  const d = ev.data;
  if (!d || d.source !== 'lpf-oauth' || d.provider !== provider) return null;
  if (!d.token) return null;
  return { token: d.token, teamId: d.teamId || null };
}

export function tokenCacheKey(provider) {
  return 'lpf_token_' + provider;
}

// Browser-only: opens the OAuth popup and resolves with { token, teamId }.
export function connect(provider, origin) {
  const expectedOrigin = origin || window.location.origin;
  return new Promise((resolve, reject) => {
    const w = window.open(`/api/auth/${provider}`, 'lpf_oauth', 'width=600,height=720');
    if (!w) { reject(new Error('Popup bị chặn. Hãy cho phép popup rồi thử lại.')); return; }
    function onMsg(ev) {
      const parsed = parseOAuthMessage(ev, provider, expectedOrigin);
      if (!parsed) return;
      cleanup();
      resolve(parsed);
    }
    const poll = setInterval(() => {
      if (w.closed) { cleanup(); reject(new Error('Bạn đã đóng cửa sổ đăng nhập.')); }
    }, 500);
    function cleanup() { window.removeEventListener('message', onMsg); clearInterval(poll); }
    window.addEventListener('message', onMsg);
  });
}

// Browser-only: reuse a token from sessionStorage if present, else log in once and cache it.
export async function connectCached(provider, origin) {
  try {
    const raw = sessionStorage.getItem(tokenCacheKey(provider));
    if (raw) return JSON.parse(raw);
  } catch (e) { /* sessionStorage unavailable */ }
  const tok = await connect(provider, origin);
  try { sessionStorage.setItem(tokenCacheKey(provider), JSON.stringify(tok)); } catch (e) { /* ignore */ }
  return tok;
}

// Browser-only: forget a cached token (e.g. after an auth error or "switch account").
export function clearCachedToken(provider) {
  try { sessionStorage.removeItem(tokenCacheKey(provider)); } catch (e) { /* ignore */ }
}
