import { connect } from './oauth-client.js';
import * as github from './github.js';
import * as vercel from './vercel.js';
import { runDeploy } from './wizard.js';

const STEP_LABELS = { github: '① GitHub', vercel: '② Vercel', domain: '③ Domain' };

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
  try {
    const out = await runDeploy({
      brand, files, domain,
      deps: { connect, github, vercel, onStep: renderStep },
    });
    const done = document.createElement('div');
    done.style.marginTop = '10px';
    done.innerHTML = '🎉 Xong! Repo: ' + out.repo + ' · Live: <a target="_blank" href="https://' + out.url + '">https://' + out.url + '</a>';
    if (box) box.appendChild(done);
  } catch (e) {
    const err = document.createElement('div');
    err.style.cssText = 'margin-top:10px;color:#c00';
    err.textContent = 'Deploy dừng lại: ' + e.message;
    if (box) box.appendChild(err);
  } finally {
    btn.disabled = false;
  }
}

export function initWizard() {
  const btn = el('lpf-deploy-btn');
  if (btn) btn.addEventListener('click', onDeployClick);
}

initWizard();
