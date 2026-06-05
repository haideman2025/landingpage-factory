import { connectCached, clearCachedToken } from './oauth-client.js';
import * as vercel from './vercel.js';
import { runDeploy } from './wizard.js';

const STEP_LABELS = { vercel: '① Vercel — lấy link', domain: '② Tên miền riêng', github: 'GitHub' };

function el(id) { return document.getElementById(id); }

function renderStep(key, state, info) {
  const box = el('lpf-deploy-steps');
  if (!box) return;
  let row = document.getElementById('lpf-step-' + key);
  if (!row) {
    row = document.createElement('div');
    row.id = 'lpf-step-' + key;
    row.style.margin = '6px 0';
    box.appendChild(row);
  }
  const icon = state === 'done' ? '✅' : state === 'error' ? '❌' : '⏳';
  let extra = '';
  if (info && info.repo) extra = ' — ' + info.repo;
  if (info && info.url) extra = ' — <a href="https://' + info.url + '" target="_blank">https://' + info.url + '</a>';
  if (info && info.state) extra = ' — ' + info.state;
  if (info && info.aRecord) extra = ' — Thêm DNS: A @ ' + info.aRecord + ' (hoặc CNAME ' + info.cname + ')';
  if (info && info.message) extra = ' — ' + info.message;
  row.innerHTML = icon + ' ' + (STEP_LABELS[key] || key) + extra;
}

function showResult(out) {
  const box = el('lpf-deploy-steps');
  if (!box) return;
  const link = 'https://' + out.url;
  const wrap = document.createElement('div');
  wrap.style.cssText = 'margin-top:12px;padding:12px;border:1px solid #46d6a8;border-radius:10px';
  wrap.innerHTML =
    '<div style="font-weight:700;margin-bottom:6px">🎉 Link chạy ads của bạn đã sẵn sàng:</div>' +
    '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
      '<a id="lpf-result-link" href="' + link + '" target="_blank" style="font-size:16px;word-break:break-all">' + link + '</a>' +
      '<button id="lpf-copy" type="button" class="sec" style="padding:6px 12px">📋 Copy</button>' +
    '</div>' +
    (out.domain
      ? '<div style="margin-top:8px;font-size:13px;color:#98a2b2">Tên miền riêng: thêm bản ghi DNS ở trên rồi đợi vài phút là chạy.</div>'
      : '<div style="margin-top:8px;font-size:13px;color:#98a2b2">Muốn dùng tên miền riêng? Nhập vào ô trên rồi bấm Deploy lại.</div>');
  box.appendChild(wrap);
  const copyBtn = el('lpf-copy');
  if (copyBtn) copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(link).then(() => { copyBtn.textContent = '✓ Đã copy'; });
  });
}

async function onDeployClick() {
  const btn = el('lpf-deploy-btn');
  const box = el('lpf-deploy-steps');
  if (box) box.innerHTML = '';
  if (typeof window.__LPF_collectSiteFiles !== 'function') {
    alert('Hãy tạo landing page trước khi deploy.');
    return;
  }
  const files = window.__LPF_collectSiteFiles();
  if (!files.length) { alert('Chưa có landing page nào để deploy.'); return; }
  const brand = (window.__LPF_getBrand && window.__LPF_getBrand()) || 'lp';
  const domain = (el('lpf-domain') && el('lpf-domain').value.trim()) || '';

  btn.disabled = true;
  const oldLabel = btn.textContent;
  btn.textContent = '⏳ Đang deploy…';
  try {
    const out = await runDeploy({
      brand, files, domain,
      deps: { connect: connectCached, vercel, onStep: renderStep },
    });
    showResult(out);
  } catch (e) {
    // If the cached Vercel token is stale/unauthorized, forget it so the next click logs in fresh.
    if (e && (e.status === 401 || e.status === 403)) clearCachedToken('vercel');
    const err = document.createElement('div');
    err.style.cssText = 'margin-top:10px;color:#ff7a6e';
    err.textContent = 'Deploy dừng lại: ' + e.message;
    if (box) box.appendChild(err);
  } finally {
    btn.disabled = false;
    btn.textContent = oldLabel;
  }
}

export function initWizard() {
  const btn = el('lpf-deploy-btn');
  if (btn) btn.addEventListener('click', onDeployClick);
}

initWizard();
