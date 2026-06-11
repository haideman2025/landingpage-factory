# LP-Factory User Accounts + Auto-Save Storage — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase-backed user accounts to LP-Factory-Studio that auto-save every generated landing page (config + AI images) so nothing is lost, with an in-page History panel to reopen, edit, download, and delete projects.

**Architecture:** The Studio stays client-side (keeps calling Gemini directly). A thin persistence layer is added: Supabase Auth (Google + email magic-link), Postgres for lightweight config/copy with Row-Level Security (RLS), and Supabase Storage for image bytes. Pure JS modules (serialize / diff / hash / crypto) are TDD'd with `node --test`; Supabase + DOM wiring is integration-tested manually. Two tiny Vercel functions expose public config and encrypt/decrypt the per-account Gemini key.

**Tech Stack:** Vanilla JS in `LP-Factory-Studio.html` (no build step), ESM modules served statically, `@supabase/supabase-js@2` (UMD in browser via CDN, npm in serverless), Vercel Node serverless functions, Node `crypto` (AES-256-GCM), `node --test`.

**Spec:** `docs/superpowers/specs/2026-06-11-lpf-user-accounts-storage-design.md`

**Phasing (each phase is independently shippable):**
- Phase 1 (Tasks 1–6): Supabase project + schema + RLS + Auth + login gate + BYOK key. Login works, profile auto-created.
- Phase 2 (Tasks 7–12): Pure store modules + auto-save (config + images to Storage, diff by hash) + save indicator.
- Phase 3 (Tasks 13–16): History panel (list / open / download / duplicate / delete) + storage usage + template migration.

---

## File Structure

**New files:**
- `src/store/hash.js` — FNV-1a string hash (sync, works in Node + browser). Change detection.
- `src/store/imagepaths.js` — Storage path builder.
- `src/store/serialize.js` — runtime Studio state ⇄ persisted `{config, images[]}`.
- `src/store/diff.js` — given current images + known hashes → upload/remove plan + byte totals.
- `src/crypto/keycipher.js` — AES-256-GCM encrypt/decrypt (serverless only; Node `crypto`).
- `src/client/lpf-account.js` — browser ESM glue: Supabase client, auth, autosave, history. Exposes `window.LPFAccount`.
- `api/config.js` — returns public `{ supabaseUrl, supabaseAnonKey }`.
- `api/_lib/supabase-admin.js` — service-role client + `userFromReq(req)` JWT verify.
- `api/key.js` — GET decrypted Gemini key / POST encrypted (auth-gated).
- `test/store.test.js` — tests for hash/imagepaths/serialize/diff.
- `test/keycipher.test.js` — tests for encrypt/decrypt.
- `db/schema.sql` — schema + RLS + storage policies + signup trigger (run in Supabase SQL editor).

**Modified files:**
- `LP-Factory-Studio.html` — add Supabase CDN + module script, state bridge (`window.__lpfState`/`__lpfRestore`), login gate, save indicator + History button, autosave hook calls, key load/save via `/api/key`.
- `package.json` — add `@supabase/supabase-js` dependency.

---

## Task 1: Supabase project, schema, RLS, storage, Auth (manual setup)

**Files:**
- Create: `db/schema.sql`

This task is environment setup. No automated test; verification is via the Supabase dashboard.

- [ ] **Step 1: Create the Supabase project**

In the Supabase dashboard: create a new project (region near your users, e.g. Singapore). Note the **Project URL**, **anon public key**, and **service_role key** (Settings → API).

- [ ] **Step 2: Write `db/schema.sql`**

Create `db/schema.sql`:

```sql
-- profiles: one row per auth user
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  gemini_key_enc text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile" on public.profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);

-- projects: lightweight config + copy (no image bytes)
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled',
  brand text,
  product text,
  status text not null default 'draft',
  config jsonb not null default '{}'::jsonb,
  thumbnail_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.projects enable row level security;
create policy "own projects" on public.projects for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index projects_user_updated on public.projects(user_id, updated_at desc);

-- project_images: index of image files in Storage
create table public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  lp_index int not null,
  slot_key text not null,
  kind text not null check (kind in ('lp','ad','ugc')),
  storage_path text not null,
  content_hash text,
  bytes int not null default 0,
  created_at timestamptz not null default now(),
  unique (project_id, lp_index, slot_key)
);
alter table public.project_images enable row level security;
create policy "own images" on public.project_images for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- templates: migrated from localStorage.lpf_templates
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.templates enable row level security;
create policy "own templates" on public.templates for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- auto-create a profile row on signup
create function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Storage bucket policies (run AFTER creating the 'lp-assets' bucket in Step 4).
-- Path convention: {user_id}/{project_id}/{lp_index}/{slot_key}.jpg
create policy "own files read" on storage.objects for select
  using (bucket_id = 'lp-assets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files insert" on storage.objects for insert
  with check (bucket_id = 'lp-assets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files update" on storage.objects for update
  using (bucket_id = 'lp-assets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files delete" on storage.objects for delete
  using (bucket_id = 'lp-assets' and (storage.foldername(name))[1] = auth.uid()::text);
```

- [ ] **Step 3: Run the table/trigger SQL**

In Supabase → SQL Editor, paste the contents of `db/schema.sql` **down to the end of the signup trigger** (stop before the storage policies) and run it. Verify in Table Editor that `profiles`, `projects`, `project_images`, `templates` exist with RLS enabled (shield icon).

- [ ] **Step 4: Create the Storage bucket, then run storage policies**

Storage → New bucket → name `lp-assets`, **Private** (uncheck public). Then run the storage policy statements (the `storage.objects` block at the bottom of `db/schema.sql`) in the SQL Editor.

- [ ] **Step 5: Configure Auth providers**

Authentication → Providers:
- **Email**: enabled (magic link works by default).
- **Google**: enable; paste a Google OAuth Client ID/secret (reuse the existing Google Cloud OAuth client from `GOOGLE_CLIENT_ID`, and add `https://<your-project-ref>.supabase.co/auth/v1/callback` to its Authorized redirect URIs in Google Cloud Console).

Authentication → URL Configuration → **Site URL** = `https://landingpage-factory.vercel.app`; add the same to **Redirect URLs** (and `http://localhost:3000` if testing locally).

- [ ] **Step 6: Set Vercel environment variables**

In Vercel project settings → Environment Variables, add (Production + Preview + Development):

```
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon public key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
APP_ENC_KEY=<64 hex chars>
```

Generate `APP_ENC_KEY` locally with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

- [ ] **Step 7: Commit the schema file**

```bash
git add db/schema.sql
git commit -m "feat(db): Supabase schema, RLS, storage policies, signup trigger"
```

---

## Task 2: Add Supabase dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add the dependency**

Edit `package.json` to add a `dependencies` block (it currently has none):

```json
{
  "name": "landingpage-factory",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  },
  "engines": { "node": ">=18" },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0"
  }
}
```

- [ ] **Step 2: Install**

Run: `npm install`
Expected: `node_modules/@supabase/supabase-js` exists, `package-lock.json` updated.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @supabase/supabase-js dependency"
```

---

## Task 3: `keycipher.js` — AES-256-GCM encrypt/decrypt (TDD)

**Files:**
- Create: `src/crypto/keycipher.js`
- Test: `test/keycipher.test.js`

- [ ] **Step 1: Write the failing test**

Create `test/keycipher.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encrypt, decrypt } from '../src/crypto/keycipher.js';

const KEY = '0'.repeat(64); // 32 bytes hex

test('decrypt(encrypt(x)) round-trips', () => {
  const enc = encrypt('AIzaSy-secret-key', KEY);
  assert.notEqual(enc, 'AIzaSy-secret-key');
  assert.equal(decrypt(enc, KEY), 'AIzaSy-secret-key');
});

test('ciphertext differs each call (random IV)', () => {
  assert.notEqual(encrypt('same', KEY), encrypt('same', KEY));
});

test('tampered ciphertext throws', () => {
  const enc = encrypt('secret', KEY);
  const bad = enc.slice(0, -4) + 'AAAA';
  assert.throws(() => decrypt(bad, KEY));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/keycipher.test.js`
Expected: FAIL — `Cannot find module '../src/crypto/keycipher.js'`.

- [ ] **Step 3: Write the implementation**

Create `src/crypto/keycipher.js`:

```js
import crypto from 'node:crypto';

// AES-256-GCM. encKeyHex must be 64 hex chars (32 bytes).
// Returns "ivB64:tagB64:cipherB64".
export function encrypt(plain, encKeyHex) {
  const key = Buffer.from(encKeyHex, 'hex');
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([c.update(String(plain), 'utf8'), c.final()]);
  const tag = c.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join(':');
}

export function decrypt(blob, encKeyHex) {
  const key = Buffer.from(encKeyHex, 'hex');
  const [ivB, tagB, dataB] = String(blob).split(':');
  const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB, 'base64'));
  d.setAuthTag(Buffer.from(tagB, 'base64'));
  return Buffer.concat([d.update(Buffer.from(dataB, 'base64')), d.final()]).toString('utf8');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/keycipher.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/crypto/keycipher.js test/keycipher.test.js
git commit -m "feat(crypto): AES-256-GCM keycipher for Gemini key at rest"
```

---

## Task 4: `api/config.js` + `api/_lib/supabase-admin.js`

**Files:**
- Create: `api/config.js`
- Create: `api/_lib/supabase-admin.js`

No unit test (thin env/IO wrappers); verified manually in Step 4.

- [ ] **Step 1: Write `api/config.js`**

```js
// Public, safe-to-expose config for the browser Supabase client.
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.end(JSON.stringify({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  }));
}
```

- [ ] **Step 2: Write `api/_lib/supabase-admin.js`**

```js
import { createClient } from '@supabase/supabase-js';

export function adminClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Verify the Supabase access token from the Authorization header.
// Returns the user object or null.
export async function userFromReq(req) {
  const auth = req.headers.authorization || '';
  const jwt = auth.replace(/^Bearer\s+/i, '').trim();
  if (!jwt) return null;
  try {
    const { data, error } = await adminClient().auth.getUser(jwt);
    if (error) return null;
    return data.user || null;
  } catch (_) {
    return null;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add api/config.js api/_lib/supabase-admin.js
git commit -m "feat(api): public config endpoint + supabase admin/auth helper"
```

- [ ] **Step 4: Manual verification (after deploy or local `vercel dev`)**

Run: `curl -s https://landingpage-factory.vercel.app/api/config`
Expected: JSON with non-empty `supabaseUrl` and `supabaseAnonKey`.

---

## Task 5: `api/key.js` — store/retrieve encrypted Gemini key

**Files:**
- Create: `api/key.js`

- [ ] **Step 1: Write `api/key.js`**

```js
import { adminClient, userFromReq } from './_lib/supabase-admin.js';
import { encrypt, decrypt } from '../src/crypto/keycipher.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const user = await userFromReq(req);
  if (!user) { res.statusCode = 401; return res.end(JSON.stringify({ error: 'unauthorized' })); }
  const db = adminClient();

  if (req.method === 'GET') {
    const { data } = await db.from('profiles').select('gemini_key_enc').eq('id', user.id).single();
    let key = '';
    try { if (data && data.gemini_key_enc) key = decrypt(data.gemini_key_enc, process.env.APP_ENC_KEY); } catch (_) {}
    return res.end(JSON.stringify({ key }));
  }

  if (req.method === 'POST') {
    let body = '';
    for await (const ch of req) body += ch;
    let key = '';
    try { key = (JSON.parse(body || '{}').key) || ''; } catch (_) {}
    const enc = key ? encrypt(String(key), process.env.APP_ENC_KEY) : null;
    const { error } = await db.from('profiles').update({ gemini_key_enc: enc }).eq('id', user.id);
    if (error) { res.statusCode = 500; return res.end(JSON.stringify({ error: error.message })); }
    return res.end(JSON.stringify({ ok: true }));
  }

  res.statusCode = 405;
  res.end(JSON.stringify({ error: 'method not allowed' }));
}
```

- [ ] **Step 2: Commit**

```bash
git add api/key.js
git commit -m "feat(api): encrypted per-account Gemini key store/retrieve"
```

- [ ] **Step 3: Manual verification (after Task 6 login works)**

Verified end-to-end in Task 6 Step 6 (key persists across reload/devices).

---

## Task 6: Login gate + Supabase client bootstrap (`lpf-account.js` part 1)

**Files:**
- Create: `src/client/lpf-account.js`
- Modify: `LP-Factory-Studio.html`

- [ ] **Step 1: Create `src/client/lpf-account.js` with auth bootstrap**

```js
// Browser ESM glue. Loaded as <script type="module">. Exposes window.LPFAccount.
// Assumes window.supabase (UMD) is already loaded.

const State = { sb: null, user: null, projectId: null, knownHashes: {} };

async function init() {
  const cfg = await fetch('/api/config').then(r => r.json());
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) { console.error('Missing Supabase config'); return; }
  State.sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  const { data } = await State.sb.auth.getSession();
  State.user = data.session ? data.session.user : null;
  State.sb.auth.onAuthStateChange((_e, session) => {
    State.user = session ? session.user : null;
    renderGate();
  });
  renderGate();
  if (State.user) await onSignedIn();
}

function renderGate() {
  const gate = document.getElementById('lpf-gate');
  if (!gate) return;
  gate.style.display = State.user ? 'none' : 'flex';
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

async function signOut() { await State.sb.auth.signOut(); State.user = null; renderGate(); }

async function accessToken() {
  const { data } = await State.sb.auth.getSession();
  return data.session ? data.session.access_token : '';
}

// Load the saved Gemini key into the #key input on sign-in.
async function loadKey() {
  const token = await accessToken();
  if (!token) return;
  try {
    const { key } = await fetch('/api/key', { headers: { Authorization: 'Bearer ' + token } }).then(r => r.json());
    const el = document.getElementById('key');
    if (key && el) { el.value = key; el.dispatchEvent(new Event('input', { bubbles: true })); }
  } catch (_) {}
}

async function saveKey(key) {
  const token = await accessToken();
  if (!token) return;
  await fetch('/api/key', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  });
}

async function onSignedIn() {
  renderGate();
  await loadKey();
  // Phases 2–3 wire autosave + history here.
}

window.LPFAccount = { init, signInGoogle, signInEmail, signOut, saveKey, _state: State, accessToken };
init();
```

- [ ] **Step 2: Add the login gate markup + scripts to `LP-Factory-Studio.html`**

Immediately after the opening `<body>` tag, insert the gate overlay:

```html
<div id="lpf-gate" style="display:none;position:fixed;inset:0;z-index:9999;background:#0a0d12;color:#e6edf3;flex-direction:column;align-items:center;justify-content:center;gap:14px;font-family:sans-serif">
  <h2 style="margin:0">Đăng nhập LP-Factory</h2>
  <p style="color:#8b98a5;margin:0">Lưu &amp; xem lại toàn bộ dữ liệu tạo sinh trên tài khoản của bạn.</p>
  <button id="lpf-google" style="padding:10px 18px;border-radius:8px;border:1px solid #2a313a;background:#fff;color:#111;cursor:pointer;font-weight:700">Đăng nhập với Google</button>
  <div style="display:flex;gap:6px;align-items:center">
    <input id="lpf-email" type="email" placeholder="email@cua-ban.com" style="padding:10px;border-radius:8px;border:1px solid #2a313a;background:#0f141a;color:#e6edf3">
    <button id="lpf-emailbtn" style="padding:10px 14px;border-radius:8px;border:1px solid #2a313a;background:#1f6feb;color:#fff;cursor:pointer">Gửi magic link</button>
  </div>
  <div id="lpf-emailmsg" style="color:#8b98a5;font-size:13px"></div>
</div>
```

Just before the closing `</body>`, after the existing inline `<script>...</script>`, add:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script type="module" src="/src/client/lpf-account.js"></script>
<script>
document.getElementById('lpf-google').onclick = () => window.LPFAccount.signInGoogle();
document.getElementById('lpf-emailbtn').onclick = async () => {
  const email = document.getElementById('lpf-email').value.trim();
  const msg = document.getElementById('lpf-emailmsg');
  if (!email) { msg.textContent = 'Nhập email trước.'; return; }
  const err = await window.LPFAccount.signInEmail(email);
  msg.textContent = err ? ('Lỗi: ' + err) : 'Đã gửi link đăng nhập tới email của bạn.';
};
</script>
```

- [ ] **Step 3: Persist the Gemini key to the account on change**

In the inline script, the `#remember` change handler currently writes localStorage (line ~187). Add an account save alongside it. Replace:

```js
$('#remember').addEventListener('change',e=>{try{e.target.checked?localStorage.setItem('lpf_key',$('#key').value):localStorage.removeItem('lpf_key');}catch(_){}});
```

with:

```js
$('#remember').addEventListener('change',e=>{try{e.target.checked?localStorage.setItem('lpf_key',$('#key').value):localStorage.removeItem('lpf_key');}catch(_){}
  try{ if(window.LPFAccount && e.target.checked) window.LPFAccount.saveKey($('#key').value.trim()); }catch(_){}
});
```

- [ ] **Step 4: Commit**

```bash
git add src/client/lpf-account.js LP-Factory-Studio.html
git commit -m "feat(auth): Supabase login gate, Google + email magic-link, BYOK key sync"
```

- [ ] **Step 5: Deploy & manually verify login**

Push to `main` (Vercel auto-deploys), open the Studio URL. Expected: the gate overlay blocks the app until you sign in. Sign in with Google → gate disappears, app usable. In Supabase → Table Editor → `profiles`, a row exists for your user.

- [ ] **Step 6: Verify key persistence (covers Task 5)**

Paste a Gemini key, tick "remember". Reload in a different browser/incognito after signing in there: the `#key` field is pre-filled from `/api/key`. Confirm `profiles.gemini_key_enc` is non-plaintext in the DB.

---

## Task 7: `hash.js` — FNV-1a (TDD)

**Files:**
- Create: `src/store/hash.js`
- Test: `test/store.test.js` (created here, extended in later tasks)

- [ ] **Step 1: Write the failing test**

Create `test/store.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fnv1a } from '../src/store/hash.js';

test('fnv1a is deterministic and 8 hex chars', () => {
  const h = fnv1a('hello');
  assert.match(h, /^[0-9a-f]{8}$/);
  assert.equal(fnv1a('hello'), h);
});

test('fnv1a differs for different input', () => {
  assert.notEqual(fnv1a('a'), fnv1a('b'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/store.test.js`
Expected: FAIL — `Cannot find module '../src/store/hash.js'`.

- [ ] **Step 3: Write the implementation**

Create `src/store/hash.js`:

```js
// FNV-1a 32-bit hash of a string -> 8 hex chars. Sync, identical in Node and browsers.
export function fnv1a(str) {
  const s = String(str);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/store.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/store/hash.js test/store.test.js
git commit -m "feat(store): FNV-1a hash for image change detection"
```

---

## Task 8: `imagepaths.js` (TDD)

**Files:**
- Create: `src/store/imagepaths.js`
- Test: `test/store.test.js` (append)

- [ ] **Step 1: Write the failing test (append to `test/store.test.js`)**

```js
import { storagePath } from '../src/store/imagepaths.js';

test('storagePath builds {user}/{project}/{lp}/{slot}.jpg', () => {
  const p = storagePath('U1', 'P1', { lp_index: 0, slot_key: 'hero' });
  assert.equal(p, 'U1/P1/0/hero.jpg');
});

test('storagePath handles ugc with lp_index -1', () => {
  const p = storagePath('U1', 'P1', { lp_index: -1, slot_key: 'ugc2' });
  assert.equal(p, 'U1/P1/-1/ugc2.jpg');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/store.test.js`
Expected: FAIL — `Cannot find module '../src/store/imagepaths.js'`.

- [ ] **Step 3: Write the implementation**

Create `src/store/imagepaths.js`:

```js
// Storage object path. Convention enforced by storage RLS: first folder = user id.
export function storagePath(userId, projectId, img) {
  return `${userId}/${projectId}/${img.lp_index}/${img.slot_key}.jpg`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/store.test.js`
Expected: PASS (4 tests total).

- [ ] **Step 5: Commit**

```bash
git add src/store/imagepaths.js test/store.test.js
git commit -m "feat(store): storage path builder"
```

---

## Task 9: `serialize.js` (TDD)

**Files:**
- Create: `src/store/serialize.js`
- Test: `test/store.test.js` (append)

- [ ] **Step 1: Write the failing test (append to `test/store.test.js`)**

```js
import { collectImages, toConfig, fromConfig, applyImages } from '../src/store/serialize.js';

const sampleState = () => ({
  CFG: { brand: 'ONIIZ', product: 'Foam', key: 'SECRET' },
  ANGLES: [{ slug: 'a1' }],
  UI: { cta: 'Mua' },
  LPS: [{ a: { slug: 'a1' }, slots: { hero: { ratio: '4/5' } }, b64: { hero: 'AAA' }, adB64: { ad0: 'BBB' } }],
  UGC: [{ b64: 'CCC', tag: 'u' }],
});

test('collectImages flattens lp/ad/ugc images', () => {
  const imgs = collectImages(sampleState());
  assert.deepEqual(imgs.sort((a, b) => a.slot_key.localeCompare(b.slot_key)), [
    { lp_index: 0, slot_key: 'ad0', kind: 'ad', b64: 'BBB' },
    { lp_index: 0, slot_key: 'hero', kind: 'lp', b64: 'AAA' },
    { lp_index: -1, slot_key: 'ugc0', kind: 'ugc', b64: 'CCC' },
  ]);
});

test('toConfig strips the API key and all image bytes', () => {
  const c = toConfig(sampleState());
  assert.equal(c.CFG.key, undefined);
  assert.equal(c.CFG.brand, 'ONIIZ');
  assert.equal(c.LPS[0].b64, undefined);
  assert.equal(c.LPS[0].adB64, undefined);
  assert.equal(c.LPS[0].slots.hero.ratio, '4/5');
  assert.equal(c.version, 1);
});

test('fromConfig rebuilds state with empty image maps', () => {
  const s = fromConfig(toConfig(sampleState()));
  assert.equal(s.LPS[0].a.slug, 'a1');
  assert.deepEqual(s.LPS[0].b64, {});
  assert.deepEqual(s.LPS[0].adB64, {});
  assert.equal(s.UGC.length, 1);
});

test('applyImages restores bytes into the rebuilt state', () => {
  const s = fromConfig(toConfig(sampleState()));
  applyImages(s, [
    { lp_index: 0, slot_key: 'hero', kind: 'lp', b64: 'AAA' },
    { lp_index: 0, slot_key: 'ad0', kind: 'ad', b64: 'BBB' },
    { lp_index: -1, slot_key: 'ugc0', kind: 'ugc', b64: 'CCC' },
  ]);
  assert.equal(s.LPS[0].b64.hero, 'AAA');
  assert.equal(s.LPS[0].adB64.ad0, 'BBB');
  assert.equal(s.UGC[0].b64, 'CCC');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/store.test.js`
Expected: FAIL — `Cannot find module '../src/store/serialize.js'`.

- [ ] **Step 3: Write the implementation**

Create `src/store/serialize.js`:

```js
// Runtime Studio state <-> persisted shape.
// Persisted = { config (lightweight JSON, no image bytes), images[] (bytes, stored separately) }.

export function collectImages(state) {
  const out = [];
  (state.LPS || []).forEach((lp, i) => {
    const b64 = lp.b64 || {};
    Object.keys(b64).forEach(k => { if (b64[k]) out.push({ lp_index: i, slot_key: k, kind: 'lp', b64: b64[k] }); });
    const ad = lp.adB64 || {};
    Object.keys(ad).forEach(k => { if (ad[k]) out.push({ lp_index: i, slot_key: k, kind: 'ad', b64: ad[k] }); });
  });
  (state.UGC || []).forEach((u, i) => {
    if (u && u.b64) out.push({ lp_index: -1, slot_key: 'ugc' + i, kind: 'ugc', b64: u.b64 });
  });
  return out;
}

export function toConfig(state) {
  const cfg = { ...(state.CFG || {}) };
  delete cfg.key; // never persist the API key in project config
  return {
    version: 1,
    CFG: cfg,
    ANGLES: state.ANGLES || [],
    UI: state.UI || {},
    LPS: (state.LPS || []).map(lp => ({ a: lp.a || {}, slots: lp.slots || {} })),
    UGC: (state.UGC || []).map(u => ({ tag: u && u.tag })),
  };
}

export function fromConfig(config) {
  const c = config || {};
  return {
    CFG: c.CFG || {},
    ANGLES: c.ANGLES || [],
    UI: c.UI || {},
    LPS: (c.LPS || []).map(lp => ({ a: lp.a || {}, slots: lp.slots || {}, b64: {}, adB64: {} })),
    UGC: (c.UGC || []).map(u => ({ tag: u && u.tag })),
  };
}

export function applyImages(state, images) {
  (images || []).forEach(img => {
    if (img.kind === 'ugc') {
      const idx = parseInt(String(img.slot_key).slice(3), 10) || 0;
      state.UGC[idx] = state.UGC[idx] || {};
      state.UGC[idx].b64 = img.b64;
    } else {
      const lp = state.LPS[img.lp_index];
      if (!lp) return;
      if (img.kind === 'ad') { lp.adB64 = lp.adB64 || {}; lp.adB64[img.slot_key] = img.b64; }
      else { lp.b64 = lp.b64 || {}; lp.b64[img.slot_key] = img.b64; }
    }
  });
  return state;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/store.test.js`
Expected: PASS (8 tests total).

- [ ] **Step 5: Commit**

```bash
git add src/store/serialize.js test/store.test.js
git commit -m "feat(store): serialize state to config + images and back"
```

---

## Task 10: `diff.js` — sync plan (TDD)

**Files:**
- Create: `src/store/diff.js`
- Test: `test/store.test.js` (append)

- [ ] **Step 1: Write the failing test (append to `test/store.test.js`)**

```js
import { planSync } from '../src/store/diff.js';
import { fnv1a as _fnv } from '../src/store/hash.js';

test('planSync uploads everything when no known hashes', () => {
  const imgs = [{ lp_index: 0, slot_key: 'hero', kind: 'lp', b64: 'AAAA' }];
  const r = planSync('U1', 'P1', imgs, {});
  assert.equal(r.uploads.length, 1);
  assert.equal(r.uploads[0].path, 'U1/P1/0/hero.jpg');
  assert.equal(r.uploads[0].hash, _fnv('AAAA'));
  assert.equal(r.uploads[0].bytes, 3); // floor(4 * 0.75)
  assert.deepEqual(r.removed, []);
  assert.equal(r.hashes['U1/P1/0/hero.jpg'], _fnv('AAAA'));
});

test('planSync skips unchanged images', () => {
  const imgs = [{ lp_index: 0, slot_key: 'hero', kind: 'lp', b64: 'AAAA' }];
  const known = { 'U1/P1/0/hero.jpg': _fnv('AAAA') };
  const r = planSync('U1', 'P1', imgs, known);
  assert.equal(r.uploads.length, 0);
  assert.deepEqual(r.removed, []);
});

test('planSync re-uploads changed images', () => {
  const imgs = [{ lp_index: 0, slot_key: 'hero', kind: 'lp', b64: 'ZZZZ' }];
  const known = { 'U1/P1/0/hero.jpg': _fnv('AAAA') };
  const r = planSync('U1', 'P1', imgs, known);
  assert.equal(r.uploads.length, 1);
  assert.equal(r.uploads[0].hash, _fnv('ZZZZ'));
});

test('planSync marks removed images', () => {
  const known = { 'U1/P1/0/hero.jpg': 'x', 'U1/P1/0/old.jpg': 'y' };
  const imgs = [{ lp_index: 0, slot_key: 'hero', kind: 'lp', b64: 'AAAA' }];
  const r = planSync('U1', 'P1', imgs, known);
  assert.deepEqual(r.removed, ['U1/P1/0/old.jpg']);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/store.test.js`
Expected: FAIL — `Cannot find module '../src/store/diff.js'`.

- [ ] **Step 3: Write the implementation**

Create `src/store/diff.js`:

```js
import { fnv1a } from './hash.js';
import { storagePath } from './imagepaths.js';

// Compare current images against already-uploaded {path: hash}.
// Returns { uploads:[{...img, path, hash, bytes}], hashes:{path:hash}, removed:[path] }.
export function planSync(userId, projectId, images, knownHashes) {
  const known = knownHashes || {};
  const hashes = {};
  const uploads = [];
  const currentPaths = new Set();
  for (const img of images || []) {
    const path = storagePath(userId, projectId, img);
    const hash = fnv1a(img.b64);
    const bytes = Math.floor(String(img.b64).length * 0.75); // base64 -> raw bytes
    currentPaths.add(path);
    hashes[path] = hash;
    if (known[path] !== hash) uploads.push({ ...img, path, hash, bytes });
  }
  const removed = Object.keys(known).filter(p => !currentPaths.has(p));
  return { uploads, hashes, removed };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/store.test.js`
Expected: PASS (12 tests total).

- [ ] **Step 5: Commit**

```bash
git add src/store/diff.js test/store.test.js
git commit -m "feat(store): planSync diff for incremental image upload"
```

---

## Task 11: State bridge in `LP-Factory-Studio.html`

**Files:**
- Modify: `LP-Factory-Studio.html`

The store modules need read/write access to the inline-script `let` vars (`CFG, ANGLES, UI, LPS, UGC`). Expose a bridge defined inside that scope.

- [ ] **Step 1: Add the bridge after the state declaration**

Find (line ~185):

```js
let CFG=null, ANGLES=[], UI={}, REF=[], LPS=[], curEdit=-1, UGC=[], ASSETMODE=false, KOC=[];
```

Immediately after it, add:

```js
window.__lpfState = () => ({ CFG, ANGLES, UI, LPS, UGC });
window.__lpfRestore = (s) => {
  CFG = s.CFG; ANGLES = s.ANGLES; UI = s.UI; LPS = s.LPS; UGC = s.UGC;
  try { renderLPgrid(); } catch (_) {}
  try { renderTplBar(); } catch (_) {}
  try { renderUgc(); } catch (_) {}
};
window.__lpfDirty = () => { try { window.LPFAccount && window.LPFAccount.scheduleSave && window.LPFAccount.scheduleSave(); } catch (_) {} };
```

- [ ] **Step 2: Call `__lpfDirty()` after each generation/edit mutation**

Add `window.__lpfDirty();` at the end of these functions (just before their final closing brace / in their success path):
- `genConfigs` — after `$('#st1').innerHTML=...Đã thiết kế...` (success, line ~348).
- `regen(i,k,btn)` — after `im.src=...` sets the regenerated image (success, line ~578).
- `downloadLP`/editor input handlers are read-only or already mutate `LPS[...]` via inline `oninput`; for those inline `oninput` handlers (lines ~566, ~548) append `;window.__lpfDirty()` to the handler string.

Example for the slot scene `oninput` (line ~566), change the handler to end with:

```js
... LPS[${i}].slots['${k}'].shot,${!!s.atmos});window.__lpfDirty()">
```

- [ ] **Step 3: Commit**

```bash
git add LP-Factory-Studio.html
git commit -m "feat(studio): state bridge + dirty hooks for autosave"
```

- [ ] **Step 4: Manual verification**

Open the deployed Studio, sign in, open DevTools console, run `window.__lpfState()`. Expected: an object with `CFG/ANGLES/UI/LPS/UGC`. Run `window.__lpfRestore(window.__lpfState())` — no error.

---

## Task 12: Auto-save engine (`lpf-account.js` part 2)

**Files:**
- Modify: `src/client/lpf-account.js`

- [ ] **Step 1: Add imports at the top of `src/client/lpf-account.js`**

```js
import { collectImages, toConfig } from '/src/store/serialize.js';
import { planSync } from '/src/store/diff.js';
```

(Browser ESM uses absolute paths served by Vercel.)

- [ ] **Step 2: Add the save engine functions (above the `window.LPFAccount = ...` line)**

```js
let saveTimer = null;
let saving = false;

function setStatus(text) {
  const el = document.getElementById('lpf-savestatus');
  if (el) el.textContent = text;
}

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

async function saveNow() {
  if (!State.user || saving) return;
  const state = window.__lpfState ? window.__lpfState() : null;
  if (!state) return;
  saving = true;
  setStatus('Đang lưu…');
  try {
    const projectId = await ensureProject(state);
    // 1) lightweight config
    const cfg = state.CFG || {};
    const config = toConfig(state);
    await State.sb.from('projects').update({
      title: cfg.product || 'Untitled', brand: cfg.brand || null, product: cfg.product || null,
      config, updated_at: new Date().toISOString(),
    }).eq('id', projectId);
    // 2) images: upload changed, delete removed
    const images = collectImages(state);
    const plan = planSync(State.user.id, projectId, images, State.knownHashes);
    for (const up of plan.uploads) {
      const bytes = Uint8Array.from(atob(up.b64), c => c.charCodeAt(0));
      const { error } = await State.sb.storage.from('lp-assets').upload(up.path, bytes, { contentType: 'image/jpeg', upsert: true });
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
    // thumbnail = first lp hero if present
    const hero = images.find(i => i.kind === 'lp' && i.slot_key === 'hero');
    if (hero) await State.sb.from('projects').update({ thumbnail_path: `${State.user.id}/${projectId}/${hero.lp_index}/hero.jpg` }).eq('id', projectId);
    State.knownHashes = plan.hashes;
    setStatus('Đã lưu • ' + new Date().toLocaleTimeString());
  } finally {
    saving = false;
  }
}
```

- [ ] **Step 3: Wire save-on-leave and expose functions**

Add before `window.LPFAccount = ...`:

```js
window.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveNow().catch(() => {}); });
window.addEventListener('beforeunload', () => { try { navigator.sendBeacon && saveNow(); } catch (_) {} });
```

Update the exposed object to include the save API:

```js
window.LPFAccount = { init, signInGoogle, signInEmail, signOut, saveKey, scheduleSave, saveNow, accessToken, _state: State };
```

- [ ] **Step 4: Add the save-status element to the header in `LP-Factory-Studio.html`**

Find the header area near the top of `<body>` (the same region as the `#key`/`#remember` controls). Add a small status span (place it next to existing header controls):

```html
<span id="lpf-savestatus" style="font-size:12px;color:#8b98a5;margin-left:8px"></span>
```

- [ ] **Step 5: Commit**

```bash
git add src/client/lpf-account.js LP-Factory-Studio.html
git commit -m "feat(autosave): debounced config+image save to Supabase with hash diff"
```

- [ ] **Step 6: Manual verification**

Sign in, run a generation (config + at least one image), wait ~4s. Expected: status shows "Đang lưu… → Đã lưu • HH:MM". In Supabase: `projects` has a row with non-empty `config`; `project_images` has rows; Storage `lp-assets/{user}/{project}/...` contains `.jpg` files. Edit a field → status returns to "Sắp lưu… → Đã lưu". Regenerate one image → only that image re-uploads (check `created_at`/network tab — one upload, not all).

---

## Task 13: History data API (`lpf-account.js` part 3)

**Files:**
- Modify: `src/client/lpf-account.js`

- [ ] **Step 1: Add history/data functions**

First, extend the top-of-file import from Task 12 to also pull in `fromConfig` and `applyImages`:

```js
import { collectImages, toConfig, fromConfig, applyImages } from '/src/store/serialize.js';
```

Then add these functions above the `window.LPFAccount = ...` line:

```js
const QUOTA_BYTES = 1024 * 1024 * 1024; // 1 GB free tier

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
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    await State.sb.storage.from('lp-assets').upload(newPath, bytes, { contentType: 'image/jpeg', upsert: true });
    await State.sb.from('project_images').insert({ project_id: created.id, user_id: State.user.id, lp_index: row.lp_index, slot_key: row.slot_key, kind: row.kind, storage_path: newPath, content_hash: row.content_hash, bytes: row.bytes });
  }
  return created.id;
}

function newProject() { State.projectId = null; State.knownHashes = {}; }
```

- [ ] **Step 2: Expose the new functions**

```js
window.LPFAccount = { init, signInGoogle, signInEmail, signOut, saveKey, scheduleSave, saveNow,
  listProjects, openProject, deleteProject, duplicateProject, storageUsage, newProject, accessToken, _state: State };
```

- [ ] **Step 3: Commit**

```bash
git add src/client/lpf-account.js
git commit -m "feat(history): list/open/delete/duplicate projects + storage usage"
```

---

## Task 14: History panel UI

**Files:**
- Modify: `LP-Factory-Studio.html`

- [ ] **Step 1: Add the History button + panel markup**

Add a History button near the header controls:

```html
<button id="lpf-historybtn" class="sec" style="margin-left:8px">🗂️ Lịch sử</button>
<button id="lpf-signout" class="sec">Đăng xuất (<span id="lpf-who"></span>)</button>
```

Before `</body>`, add the panel:

```html
<div id="lpf-history" style="display:none;position:fixed;inset:0;z-index:9998;background:rgba(5,8,12,.94);color:#e6edf3;overflow:auto;padding:24px;font-family:sans-serif">
  <div style="display:flex;justify-content:space-between;align-items:center;max-width:1100px;margin:0 auto 16px">
    <h2 style="margin:0">Lịch sử dự án</h2>
    <button id="lpf-history-close" class="sec">✕ Đóng</button>
  </div>
  <div id="lpf-usage" style="max-width:1100px;margin:0 auto 12px;font-size:13px;color:#8b98a5"></div>
  <div id="lpf-history-grid" style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px"></div>
</div>
```

- [ ] **Step 2: Add the panel controller script**

In the trailing non-module `<script>` (the one added in Task 6 Step 2), append:

```js
const histEl = document.getElementById('lpf-history');
document.getElementById('lpf-historybtn').onclick = async () => { await renderHistory(); histEl.style.display = 'block'; };
document.getElementById('lpf-history-close').onclick = () => { histEl.style.display = 'none'; };
document.getElementById('lpf-signout').onclick = () => window.LPFAccount.signOut();

function fmtMB(b) { return (b / 1048576).toFixed(0) + 'MB'; }

async function renderHistory() {
  const grid = document.getElementById('lpf-history-grid');
  const usage = document.getElementById('lpf-usage');
  grid.innerHTML = 'Đang tải…';
  try {
    const u = await window.LPFAccount.storageUsage();
    const pct = Math.min(100, Math.round(u.used / u.quota * 100));
    usage.innerHTML = `Dung lượng: <b>${fmtMB(u.used)} / ${fmtMB(u.quota)}</b> (${pct}%)` + (pct >= 85 ? ' — <span style="color:#f85149">gần đầy, hãy tải về &amp; xoá bớt</span>' : '');
    const list = await window.LPFAccount.listProjects();
    if (!list.length) { grid.innerHTML = '<p style="color:#8b98a5">Chưa có dự án nào.</p>'; return; }
    grid.innerHTML = '';
    for (const p of list) {
      const card = document.createElement('div');
      card.style.cssText = 'border:1px solid #2a313a;border-radius:10px;padding:10px;background:#0f141a';
      card.innerHTML = `<div style="font-weight:700;margin-bottom:4px">${(p.product || p.title || 'Untitled')}</div>
        <div style="font-size:12px;color:#8b98a5">${(p.brand || '')} · ${new Date(p.updated_at).toLocaleString()}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
          <button class="sec h-open">Mở</button>
          <button class="sec h-dup">Nhân bản</button>
          <button class="sec h-del" style="color:#f85149">Xoá</button>
        </div>`;
      card.querySelector('.h-open').onclick = async () => { await window.LPFAccount.openProject(p.id); histEl.style.display = 'none'; };
      card.querySelector('.h-dup').onclick = async () => { await window.LPFAccount.duplicateProject(p.id); await renderHistory(); };
      card.querySelector('.h-del').onclick = async () => { if (confirm('Xoá dự án này? Ảnh trên Storage cũng bị xoá.')) { await window.LPFAccount.deleteProject(p.id); await renderHistory(); } };
      grid.appendChild(card);
    }
  } catch (e) { grid.innerHTML = 'Lỗi: ' + e.message; }
}
```

- [ ] **Step 3: Commit**

```bash
git add LP-Factory-Studio.html
git commit -m "feat(history): in-page History panel (open/duplicate/delete) + usage bar"
```

- [ ] **Step 4: Manual verification**

Sign in, generate + save a project, click "🗂️ Lịch sử". Expected: the project appears as a card with usage bar. Click "Mở" → state restores into the Studio (LPs + images render). "Nhân bản" creates a copy. "Xoá" (confirm) removes it and frees usage (re-check the usage bar drops). Use the existing per-LP "Tải" / "Tải DEPLOY KIT" buttons to download before deleting (already present in the Studio).

---

## Task 15: Template migration from localStorage

**Files:**
- Modify: `src/client/lpf-account.js`
- Modify: `LP-Factory-Studio.html`

The Studio reads/writes templates via `userTpls()`/`saveUserTpls()` against `localStorage.lpf_templates` (lines ~307-308). Migrate them to the account on first sign-in, and keep localStorage as the working store (simplest; account copy is a backup that survives device loss).

- [ ] **Step 1: Add a migration function to `lpf-account.js`**

```js
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
```

- [ ] **Step 2: Call it from `onSignedIn()`**

In `onSignedIn`, after `await loadKey();` add:

```js
  try { await migrateTemplates(); } catch (_) {}
```

- [ ] **Step 3: Commit**

```bash
git add src/client/lpf-account.js
git commit -m "feat(templates): migrate localStorage templates to account on sign-in"
```

- [ ] **Step 4: Manual verification**

With at least one saved template in localStorage, sign in. Expected: rows appear in Supabase `templates` for your user. Signing in on a fresh browser does not duplicate them (name dedupe).

---

## Task 16: Full regression + final verification

**Files:** none (verification only)

- [ ] **Step 1: Run the whole test suite**

Run: `npm test`
Expected: PASS — all tests in `test/store.test.js` (12) and `test/keycipher.test.js` (3).

- [ ] **Step 2: End-to-end smoke test on the deployed app**

1. Open Studio (incognito) → gate blocks → sign in with Google → gate clears.
2. Gemini key field auto-fills from account (set it once first if empty; tick remember).
3. Generate configs + images → after ~4s status shows "Đã lưu".
4. Hard-refresh → open "🗂️ Lịch sử" → "Mở" the project → LPs and images render fully.
5. Download a LP ZIP (existing button) → opens correctly with assets.
6. Edit a headline → autosave fires → reopen confirms the edit persisted.
7. Delete the project → usage bar drops → card disappears.
8. Sign out → gate returns.

- [ ] **Step 3: Confirm RLS isolation**

Create a second test account; confirm it sees an empty History (cannot read the first account's projects). This validates RLS.

- [ ] **Step 4: Final commit / tag (optional)**

```bash
git commit --allow-empty -m "chore: user accounts + auto-save storage MVP complete"
```

---

## Notes for the implementer

- **No build step:** browser ESM imports use absolute paths (`/src/store/...`). Vercel serves the repo root statically, so these resolve. Do not introduce a bundler.
- **`atob`/`btoa`** are used to convert base64 ⇄ bytes in the browser; the stored b64 strings are raw base64 (no `data:` prefix), matching how the Studio already stores `lp.b64[k]`.
- **Hashing cost:** `planSync` hashes all current image b64 on each save. This only runs on a debounced dirty save and is pure CPU (~tens–hundreds of ms for a full project). Optimize later only if profiling shows it matters (YAGNI).
- **Quota:** 1 GB is shown as a constant; there is no auto-cleanup by design — users download then delete (spec §9). The usage bar warns at ≥85%.
- **Security:** all data access is client-direct to Supabase under RLS (`user_id = auth.uid()`); only the Gemini key round-trips through `/api/key` for at-rest encryption. The service-role key never leaves the server.
