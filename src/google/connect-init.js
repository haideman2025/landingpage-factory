import { connectCached, clearCachedToken } from '../deploy/oauth-client.js';
import { createLeadSheet } from './sheets.js';

function el(id) { return document.getElementById(id); }

async function onConnect() {
  const btn = el('lpf-gconnect');
  const status = el('lpf-gstatus');
  if (btn) btn.disabled = true;
  if (status) status.textContent = '⏳ Đang kết nối Google & tạo Sheet…';
  try {
    const g = await connectCached('google');
    const brand = (window.__LPF_getBrand && window.__LPF_getBrand()) || 'Landing Page';
    const { sheetId, url } = await createLeadSheet(g.token, brand, g.saEmail);
    const endpoint = window.location.origin + '/api/lead?s=' + sheetId;
    const input = el('sheet');
    if (input) input.value = endpoint;
    if (status) status.innerHTML =
      '✅ Đã tạo Sheet: <a href="' + url + '" target="_blank">mở Sheet</a> — lead sẽ tự đổ về đây.';
  } catch (e) {
    if (e && (e.status === 401 || e.status === 403)) clearCachedToken('google');
    if (status) status.textContent = 'Lỗi: ' + e.message;
  } finally {
    if (btn) btn.disabled = false;
  }
}

export function initGoogleConnect() {
  const btn = el('lpf-gconnect');
  if (btn) btn.addEventListener('click', onConnect);
}

initGoogleConnect();
