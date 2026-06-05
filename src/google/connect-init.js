import { connectCached, clearCachedToken } from '../deploy/oauth-client.js';
import { createLeadSheet, writeConfig } from './sheets.js';

function el(id) { return document.getElementById(id); }

function fieldVal(id) { const e = el(id); return e ? e.value.trim() : ''; }

async function onConnect() {
  const btn = el('lpf-gconnect');
  const status = el('lpf-gstatus');
  if (btn) btn.disabled = true;
  if (status) status.textContent = '⏳ Đang kết nối Google & tạo Sheet…';
  try {
    const g = await connectCached('google');
    const brand = (window.__LPF_getBrand && window.__LPF_getBrand()) || 'Landing Page';
    const { sheetId, url } = await createLeadSheet(g.token, brand, g.saEmail);
    // Store CAPI config in the sheet's Config tab so /api/lead can fire Meta/TikTok server-side.
    await writeConfig(g.token, sheetId, {
      meta_pixel: fieldVal('pixel'),
      meta_token: fieldVal('metatoken'),
      tiktok_pixel: fieldVal('ttpixel'),
      tiktok_token: fieldVal('tttoken'),
    }).catch(function () {});
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
