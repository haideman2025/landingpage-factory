export function parseOAuthMessage(ev, provider, expectedOrigin) {
  if (!ev || ev.origin !== expectedOrigin) return null;
  const d = ev.data;
  if (!d || d.source !== 'lpf-oauth' || d.provider !== provider) return null;
  if (!d.token) return null;
  return { token: d.token, teamId: d.teamId || null };
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
