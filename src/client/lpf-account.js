// Browser ESM glue. Loaded as <script type="module">. Exposes window.LPFAccount.
// Assumes window.supabase (UMD CDN build) is already loaded.
import { collectImages, toConfig, fromConfig, applyImages } from '/src/store/serialize.js';
import { planSync } from '/src/store/diff.js';

const State = { sb: null, user: null, projectId: null, knownHashes: {} };
const QUOTA_BYTES = 1024 * 1024 * 1024; // 1 GB free tier

let saveTimer = null;
let saving = false;

function setStatus(text) {
  const el = document.getElementById('lpf-savestatus');
  if (el) el.textContent = text;
}

async function init() {
  let cfg;
  try { cfg = await fetch('/api/config').then(r => r.json()); } catch (_) { cfg = {}; }
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
    console.error('LPFAccount: missing Supabase config from /api/config');
    setStatus('⚠️ Chưa cấu hình Supabase (xem SETUP.md)');
    return;
  }
  State.sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  const { data } = await State.sb.auth.getSession();
  State.user = data.session ? data.session.user : null;
  State.sb.auth.onAuthStateChange(async (_e, session) => {
    const was = State.user;
    State.user = session ? session.user : null;
    renderGate();
    if (!was && State.user) await onSignedIn();
  });
  renderGate();
  if (State.user) await onSignedIn();
}

function renderGate() {
  const gate = document.getElementById('lpf-gate');
  if (gate) gate.style.display = State.user ? 'none' : 'flex';
  const who = document.getElementById('lpf-who');
  if (who) who.textContent = State.user ? (State.user.email || 'Đã đăng nhập') : '';
}

async function signInGoogle() {
  await State.sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + window.location.pathname },
  });
}

async function signInEmail(email) {
  const { error } = await State.sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin + window.location.pathname },
  });
  return error ? error.message : null;
}

async function signOut() { await State.sb.auth.signOut(); State.user = null; State.projectId = null; State.knownHashes = {}; renderGate(); }

async function accessToken() {
  const { data } = await State.sb.auth.getSession();
  return data.session ? data.session.access_token : '';
}

async function loadKey() {
  const token = await accessToken();
  if (!token) return;
  try {
    const { key } = await fetch('/api/key', { headers: { Authorization: 'Bearer ' + token } }).then(r => r.json());
    const el = document.getElementById('key');
    if (key && el && !el.value) { el.value = key; el.dispatchEvent(new Event('input', { bubbles: true })); }
  } catch (_) {}
}

async function saveKey(key) {
  const token = await accessToken();
  if (!token) return;
  try {
    await fetch('/api/key', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });
  } catch (_) {}
}

async function migrateTemplates() {
  let local = [];
  try { local = JSON.parse(localStorage.getItem('lpf_templates') || '[]'); } catch (_) {}
  if (!local.length) return;
  const { data: existing } = await State.sb.from('templates').select('name');
  const have = new Set((existing || []).map(r => r.name));
  const rows = local.filter(t => t && t.name && !have.has(t.name))
    .map(t => ({ user_id: State.user.id, name: t.name, data: t }));
  if (rows.length) await State.sb.from('templates').insert(rows);
}

async function onSignedIn() {
  renderGate();
  await loadKey();
  try { await migrateTemplates(); } catch (_) {}
}

// ---------------- auto-save ----------------
function scheduleSave() {
  if (!State.user) return;
  if (saveTimer) clearTimeout(saveTimer);
  setStatus('Sắp lưu…');
  saveTimer = setTimeout(() => { saveNow().catch(e => setStatus('Lỗi lưu: ' + e.message)); }, 4000);
}

async function ensureProject(state) {
  if (State.projectId) return State.projectId;
  const cfg = state.CFG || {};
  const { data, error } = await State.sb.from('projects')
    .insert({ user_id: State.user.id, title: cfg.product || 'Untitled', brand: cfg.brand || null, product: cfg.product || null })
    .select('id').single();
  if (error) throw error;
  State.projectId = data.id;
  State.knownHashes = {};
  return State.projectId;
}

function b64ToBytes(b64) {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

async function saveNow() {
  if (!State.user || saving) return;
  const state = window.__lpfState ? window.__lpfState() : null;
  if (!state || !state.LPS || !state.LPS.length) return; // nothing meaningful yet
  saving = true;
  setStatus('Đang lưu…');
  try {
    const projectId = await ensureProject(state);
    const cfg = state.CFG || {};
    const config = toConfig(state);
    await State.sb.from('projects').update({
      title: cfg.product || 'Untitled', brand: cfg.brand || null, product: cfg.product || null,
      config, updated_at: new Date().toISOString(),
    }).eq('id', projectId);

    const images = collectImages(state);
    const plan = planSync(State.user.id, projectId, images, State.knownHashes);
    for (const up of plan.uploads) {
      const { error } = await State.sb.storage.from('lp-assets').upload(up.path, b64ToBytes(up.b64), { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
      await State.sb.from('project_images').upsert({
        project_id: projectId, user_id: State.user.id, lp_index: up.lp_index, slot_key: up.slot_key,
        kind: up.kind, storage_path: up.path, content_hash: up.hash, bytes: up.bytes,
      }, { onConflict: 'project_id,lp_index,slot_key' });
    }
    for (const path of plan.removed) {
      await State.sb.storage.from('lp-assets').remove([path]);
      await State.sb.from('project_images').delete().eq('project_id', projectId).eq('storage_path', path);
    }
    const hero = images.find(i => i.kind === 'lp' && i.slot_key === 'hero');
    if (hero) await State.sb.from('projects').update({ thumbnail_path: `${State.user.id}/${projectId}/${hero.lp_index}/hero.jpg` }).eq('id', projectId);
    State.knownHashes = plan.hashes;
    setStatus('Đã lưu • ' + new Date().toLocaleTimeString());
  } finally {
    saving = false;
  }
}

// ---------------- history ----------------
async function listProjects() {
  const { data, error } = await State.sb.from('projects')
    .select('id,title,brand,product,thumbnail_path,updated_at')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function storageUsage() {
  const { data, error } = await State.sb.from('project_images').select('bytes');
  if (error) throw error;
  const used = (data || []).reduce((s, r) => s + (r.bytes || 0), 0);
  return { used, quota: QUOTA_BYTES };
}

async function signedUrl(path) {
  const { data } = await State.sb.storage.from('lp-assets').createSignedUrl(path, 3600);
  return data ? data.signedUrl : '';
}

async function fetchB64(path) {
  const url = await signedUrl(path);
  if (!url) return '';
  const buf = await fetch(url).then(r => r.arrayBuffer());
  let bin = ''; const arr = new Uint8Array(buf);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin);
}

async function openProject(id) {
  const { data: proj, error } = await State.sb.from('projects').select('config').eq('id', id).single();
  if (error) throw error;
  const { data: imgs } = await State.sb.from('project_images').select('lp_index,slot_key,kind,storage_path,content_hash').eq('project_id', id);
  const state = fromConfig(proj.config);
  const known = {};
  const withBytes = [];
  for (const row of (imgs || [])) {
    const b64 = await fetchB64(row.storage_path);
    if (b64) { withBytes.push({ lp_index: row.lp_index, slot_key: row.slot_key, kind: row.kind, b64 }); known[row.storage_path] = row.content_hash; }
  }
  applyImages(state, withBytes);
  window.__lpfRestore(state);
  State.projectId = id;
  State.knownHashes = known;
  setStatus('Đã mở dự án • ' + new Date().toLocaleTimeString());
}

async function deleteProject(id) {
  const { data: rows } = await State.sb.from('project_images').select('storage_path').eq('project_id', id);
  const paths = (rows || []).map(r => r.storage_path);
  if (paths.length) await State.sb.storage.from('lp-assets').remove(paths);
  await State.sb.from('projects').delete().eq('id', id); // cascade clears project_images
  if (State.projectId === id) { State.projectId = null; State.knownHashes = {}; }
}

async function duplicateProject(id) {
  const { data: proj } = await State.sb.from('projects').select('title,brand,product,config').eq('id', id).single();
  const { data: created, error } = await State.sb.from('projects')
    .insert({ user_id: State.user.id, title: (proj.title || 'Untitled') + ' (copy)', brand: proj.brand, product: proj.product, config: proj.config })
    .select('id').single();
  if (error) throw error;
  const { data: imgs } = await State.sb.from('project_images').select('lp_index,slot_key,kind,storage_path,content_hash,bytes').eq('project_id', id);
  for (const row of (imgs || [])) {
    const b64 = await fetchB64(row.storage_path);
    if (!b64) continue;
    const newPath = `${State.user.id}/${created.id}/${row.lp_index}/${row.slot_key}.jpg`;
    await State.sb.storage.from('lp-assets').upload(newPath, b64ToBytes(b64), { contentType: 'image/jpeg', upsert: true });
    await State.sb.from('project_images').insert({ project_id: created.id, user_id: State.user.id, lp_index: row.lp_index, slot_key: row.slot_key, kind: row.kind, storage_path: newPath, content_hash: row.content_hash, bytes: row.bytes });
  }
  return created.id;
}

function newProject() { State.projectId = null; State.knownHashes = {}; }

window.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveNow().catch(() => {}); });
window.addEventListener('beforeunload', () => { try { saveNow(); } catch (_) {} });

window.LPFAccount = {
  init, signInGoogle, signInEmail, signOut, saveKey, accessToken,
  scheduleSave, saveNow, newProject,
  listProjects, openProject, deleteProject, duplicateProject, storageUsage,
  _state: State,
};

init();
