import crypto from 'node:crypto';

export function makeState() {
  return crypto.randomBytes(16).toString('hex');
}

export function stateCookie(state) {
  return `lpf_oauth_state=${state}; Max-Age=600; Path=/; HttpOnly; SameSite=Lax; Secure`;
}

export function clearStateCookie() {
  return 'lpf_oauth_state=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax; Secure';
}

export function readCookie(header, name) {
  if (!header) return null;
  const m = String(header).match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}

export function popupResultHTML(provider, payload, allowedOrigin) {
  const msg = JSON.stringify({ source: 'lpf-oauth', provider, ...payload });
  return `<!doctype html><meta charset="utf-8"><body style="font-family:sans-serif;padding:24px">
Đăng nhập xong, đang đóng cửa sổ…
<script>
(function(){
  var msg = ${msg};
  try { if (window.opener) window.opener.postMessage(msg, ${JSON.stringify(allowedOrigin)}); } catch(e){}
  setTimeout(function(){ try{ window.close(); }catch(e){} }, 300);
})();
</script></body>`;
}
