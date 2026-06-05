# OAuth Deploy (GitHub + Vercel) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add in-app one-click deploy so users connect their own GitHub + Vercel via OAuth and ship generated landing pages to their own domain.

**Architecture:** Static tool + 4 Vercel serverless OAuth endpoints (hold client secrets, do code→token exchange). The browser orchestrates everything else: push the `/site` folder to the user's GitHub repo via the Git Data API, then direct-deploy to Vercel and attach a custom domain. Tokens live in browser `sessionStorage` (MVP).

**Tech Stack:** Vanilla ESM JavaScript (runs in browser AND Node), Vercel Serverless Functions (Node ≥18, ESM), Node built-in test runner (`node --test`) — zero npm dependencies. Reference: spec at `docs/superpowers/specs/2026-06-05-oauth-deploy-design.md`.

**Repo location:** Work in `C:\lpf-repo` (short path — the session `outputs/repo_lpf` path exceeds Windows MAX_PATH and breaks git). Remote: `haideman2025/landingpage-factory`.

---

## File Structure

```
landingpage-factory/
├─ package.json                 # NEW — type:module, test script, no deps
├─ vercel.json                  # NEW — functions + clean URLs
├─ .env.example                 # NEW — 5 env var names (no values)
├─ index.html                   # MODIFY — add Deploy button + module bootstrap + window.__LPF_collectSiteFiles
├─ api/
│   ├─ _lib/oauth.js            # NEW — state, cookie, popup-result HTML (Node-only)
│   ├─ auth/github.js           # NEW — redirect to GitHub authorize
│   ├─ auth/github/callback.js  # NEW — code → token
│   ├─ auth/vercel.js           # NEW — redirect to Vercel authorize
│   └─ auth/vercel/callback.js  # NEW — code → token
├─ src/deploy/
│   ├─ util.js                  # NEW — slugify (browser+node)
│   ├─ github.js                # NEW — ensureRepo + pushFiles
│   ├─ vercel.js                # NEW — createDeployment + waitDeployment + addDomain
│   ├─ oauth-client.js          # NEW — popup connect() + parseOAuthMessage()
│   ├─ wizard.js                # NEW — runDeploy() orchestration (pure, testable)
│   └─ wizard-init.js           # NEW — DOM binding (thin, manual-tested)
└─ test/
    ├─ helpers.js               # NEW — fake fetch + mock res
    ├─ oauth.test.js
    ├─ auth-endpoints.test.js
    ├─ github.test.js
    ├─ vercel.test.js
    ├─ oauth-client.test.js
    └─ wizard.test.js
```

**Module boundaries:** `github.js`/`vercel.js`/`util.js` are browser-safe (only use global `fetch`), so they import cleanly in Node tests and in the browser. `api/_lib/oauth.js` is Node-only (uses `node:crypto`) and never imported by frontend code. `wizard.js` is pure orchestration with injected deps (no DOM); `wizard-init.js` owns the DOM.

---

## Task 1: Project scaffold

**Files:**
- Create: `package.json`, `vercel.json`, `.env.example`, `test/helpers.js`, `test/scaffold.test.js`
- Modify: `.gitignore`

- [ ] **Step 1: Write a smoke test**

Create `test/scaffold.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('test runner works', () => {
  assert.equal(1 + 1, 2);
});
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "landingpage-factory",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  },
  "engines": { "node": ">=18" }
}
```

- [ ] **Step 3: Run the test to verify it passes**

Run: `npm test`
Expected: `# pass 1` (the scaffold test passes).

- [ ] **Step 4: Create vercel.json**

```json
{
  "cleanUrls": true,
  "trailingSlash": false
}
```
(API functions under `/api/**.js` are auto-detected as Node ESM functions because of `"type":"module"`; no extra config needed.)

- [ ] **Step 5: Create .env.example**

```
# Owner-only secrets — set these in Vercel → Project → Environment Variables.
# NEVER commit real values.
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
VERCEL_CLIENT_ID=
VERCEL_CLIENT_SECRET=
OAUTH_REDIRECT_BASE=https://yourtool.vercel.app
```

- [ ] **Step 6: Append to .gitignore**

Add these lines to `.gitignore`:
```
.env
.env.local
.vercel/
node_modules/
```

- [ ] **Step 7: Create test/helpers.js**

```js
// Fake global fetch: give it a list of [matcher, response] and it returns them in order,
// asserting each request. response = { ok, status, body } ; body is auto JSON-stringified.
export function installFetch(handlers) {
  const calls = [];
  const prev = globalThis.fetch;
  let i = 0;
  globalThis.fetch = async (url, opts = {}) => {
    calls.push({ url: String(url), opts });
    const h = handlers[i++];
    if (!h) throw new Error('Unexpected fetch call to ' + url);
    const body = typeof h.body === 'string' ? h.body : JSON.stringify(h.body ?? {});
    return {
      ok: h.ok ?? true,
      status: h.status ?? 200,
      async text() { return body; },
      async json() { return JSON.parse(body); },
    };
  };
  return { calls, restore() { globalThis.fetch = prev; } };
}

// Minimal mock of a Vercel Node res object.
export function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    end(s = '') { this.body = s; this.ended = true; },
  };
}
```

- [ ] **Step 8: Commit**

```bash
cd /c/lpf-repo
git add package.json vercel.json .env.example .gitignore test/helpers.js test/scaffold.test.js
git commit -m "chore: scaffold OAuth deploy (package.json, vercel.json, test harness)"
```

---

## Task 2: OAuth shared lib (`api/_lib/oauth.js`)

**Files:**
- Create: `api/_lib/oauth.js`, `test/oauth.test.js`

- [ ] **Step 1: Write the failing test**

Create `test/oauth.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeState, stateCookie, readCookie, popupResultHTML } from '../api/_lib/oauth.js';

test('makeState returns a long random hex string', () => {
  const a = makeState(), b = makeState();
  assert.match(a, /^[0-9a-f]{32}$/);
  assert.notEqual(a, b);
});

test('stateCookie is httpOnly + Secure + has the value', () => {
  const c = stateCookie('abc123');
  assert.match(c, /lpf_oauth_state=abc123/);
  assert.match(c, /HttpOnly/);
  assert.match(c, /Secure/);
});

test('readCookie extracts a named cookie', () => {
  assert.equal(readCookie('x=1; lpf_oauth_state=abc; y=2', 'lpf_oauth_state'), 'abc');
  assert.equal(readCookie('', 'lpf_oauth_state'), null);
  assert.equal(readCookie(undefined, 'lpf_oauth_state'), null);
});

test('popupResultHTML embeds token + origin and posts to opener', () => {
  const html = popupResultHTML('github', { token: 'gho_X' }, 'https://app.example');
  assert.match(html, /gho_X/);
  assert.match(html, /https:\/\/app\.example/);
  assert.match(html, /postMessage/);
  assert.match(html, /lpf-oauth/);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test test/oauth.test.js`
Expected: FAIL — `Cannot find module '../api/_lib/oauth.js'`.

- [ ] **Step 3: Implement `api/_lib/oauth.js`**

```js
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test test/oauth.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add api/_lib/oauth.js test/oauth.test.js
git commit -m "feat(api): OAuth state/cookie/popup helpers"
```

---

## Task 3: OAuth authorize + callback endpoints

**Files:**
- Create: `api/auth/github.js`, `api/auth/github/callback.js`, `api/auth/vercel.js`, `api/auth/vercel/callback.js`, `test/auth-endpoints.test.js`

- [ ] **Step 1: Write the failing test**

Create `test/auth-endpoints.test.js`:
```js
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockRes, installFetch } from './helpers.js';

beforeEach(() => {
  process.env.OAUTH_REDIRECT_BASE = 'https://app.example';
  process.env.GITHUB_CLIENT_ID = 'gh_id';
  process.env.GITHUB_CLIENT_SECRET = 'gh_secret';
  process.env.VERCEL_CLIENT_ID = 'vc_id';
  process.env.VERCEL_CLIENT_SECRET = 'vc_secret';
});

test('github authorize redirects with client_id + scope=repo + state cookie', async () => {
  const { default: handler } = await import('../api/auth/github.js');
  const res = mockRes();
  handler({}, res);
  assert.equal(res.statusCode, 302);
  const loc = res.headers['location'];
  assert.match(loc, /^https:\/\/github\.com\/login\/oauth\/authorize\?/);
  assert.match(loc, /client_id=gh_id/);
  assert.match(loc, /scope=repo/);
  assert.match(res.headers['set-cookie'], /lpf_oauth_state=/);
});

test('vercel authorize redirects with client_id + state cookie', async () => {
  const { default: handler } = await import('../api/auth/vercel.js');
  const res = mockRes();
  handler({}, res);
  assert.equal(res.statusCode, 302);
  assert.match(res.headers['location'], /^https:\/\/vercel\.com\/oauth\/authorize\?/);
  assert.match(res.headers['location'], /client_id=vc_id/);
});

test('github callback rejects mismatched state', async () => {
  const { default: handler } = await import('../api/auth/github/callback.js');
  const res = mockRes();
  await handler({ url: '/api/auth/github/callback?code=c&state=WRONG', headers: { cookie: 'lpf_oauth_state=RIGHT' } }, res);
  assert.equal(res.statusCode, 400);
});

test('github callback exchanges code and returns token in popup HTML', async () => {
  const fx = installFetch([{ body: { access_token: 'gho_TOKEN' } }]);
  const { default: handler } = await import('../api/auth/github/callback.js');
  const res = mockRes();
  await handler({ url: '/api/auth/github/callback?code=c&state=S', headers: { cookie: 'lpf_oauth_state=S' } }, res);
  fx.restore();
  assert.match(res.headers['content-type'], /text\/html/);
  assert.match(res.body, /gho_TOKEN/);
  assert.equal(fx.calls[0].url, 'https://github.com/login/oauth/access_token');
});

test('vercel callback exchanges code and returns token + teamId', async () => {
  const fx = installFetch([{ body: { access_token: 'vc_TOKEN', team_id: 'team_1' } }]);
  const { default: handler } = await import('../api/auth/vercel/callback.js');
  const res = mockRes();
  await handler({ url: '/api/auth/vercel/callback?code=c&state=S', headers: { cookie: 'lpf_oauth_state=S' } }, res);
  fx.restore();
  assert.match(res.body, /vc_TOKEN/);
  assert.match(res.body, /team_1/);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test test/auth-endpoints.test.js`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `api/auth/github.js`**

```js
import { makeState, stateCookie } from '../_lib/oauth.js';

export default function handler(req, res) {
  const base = process.env.OAUTH_REDIRECT_BASE;
  const state = makeState();
  const redirectUri = `${base}/api/auth/github/callback`;
  const url = 'https://github.com/login/oauth/authorize'
    + `?client_id=${encodeURIComponent(process.env.GITHUB_CLIENT_ID)}`
    + `&redirect_uri=${encodeURIComponent(redirectUri)}`
    + '&scope=repo'
    + `&state=${state}`;
  res.setHeader('Set-Cookie', stateCookie(state));
  res.statusCode = 302;
  res.setHeader('Location', url);
  res.end();
}
```

- [ ] **Step 4: Implement `api/auth/vercel.js`**

```js
import { makeState, stateCookie } from '../_lib/oauth.js';

export default function handler(req, res) {
  const base = process.env.OAUTH_REDIRECT_BASE;
  const state = makeState();
  const redirectUri = `${base}/api/auth/vercel/callback`;
  const url = 'https://vercel.com/oauth/authorize'
    + `?client_id=${encodeURIComponent(process.env.VERCEL_CLIENT_ID)}`
    + `&redirect_uri=${encodeURIComponent(redirectUri)}`
    + `&state=${state}`;
  res.setHeader('Set-Cookie', stateCookie(state));
  res.statusCode = 302;
  res.setHeader('Location', url);
  res.end();
}
```

- [ ] **Step 5: Implement `api/auth/github/callback.js`**

```js
import { readCookie, clearStateCookie, popupResultHTML } from '../../_lib/oauth.js';

export default async function handler(req, res) {
  const base = process.env.OAUTH_REDIRECT_BASE;
  const u = new URL(req.url, base);
  const code = u.searchParams.get('code');
  const state = u.searchParams.get('state');
  const cookieState = readCookie(req.headers && req.headers.cookie, 'lpf_oauth_state');

  if (!code || !state || state !== cookieState) {
    res.statusCode = 400;
    res.end('Invalid OAuth state');
    return;
  }
  const r = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${base}/api/auth/github/callback`,
    }),
  });
  const data = await r.json();
  if (!data.access_token) {
    res.statusCode = 400;
    res.end('Token exchange failed');
    return;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Set-Cookie', clearStateCookie());
  res.end(popupResultHTML('github', { token: data.access_token }, base));
}
```

- [ ] **Step 6: Implement `api/auth/vercel/callback.js`**

```js
import { readCookie, clearStateCookie, popupResultHTML } from '../../_lib/oauth.js';

export default async function handler(req, res) {
  const base = process.env.OAUTH_REDIRECT_BASE;
  const u = new URL(req.url, base);
  const code = u.searchParams.get('code');
  const state = u.searchParams.get('state');
  const cookieState = readCookie(req.headers && req.headers.cookie, 'lpf_oauth_state');

  if (!code || !state || state !== cookieState) {
    res.statusCode = 400;
    res.end('Invalid OAuth state');
    return;
  }
  const r = await fetch('https://api.vercel.com/v2/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.VERCEL_CLIENT_ID,
      client_secret: process.env.VERCEL_CLIENT_SECRET,
      code,
      redirect_uri: `${base}/api/auth/vercel/callback`,
    }).toString(),
  });
  const data = await r.json();
  if (!data.access_token) {
    res.statusCode = 400;
    res.end('Token exchange failed');
    return;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Set-Cookie', clearStateCookie());
  res.end(popupResultHTML('vercel', { token: data.access_token, teamId: data.team_id || null }, base));
}
```

- [ ] **Step 7: Run to verify it passes**

Run: `node --test test/auth-endpoints.test.js`
Expected: PASS (5 tests).

- [ ] **Step 8: Commit**

```bash
git add api/auth test/auth-endpoints.test.js
git commit -m "feat(api): GitHub + Vercel OAuth authorize/callback endpoints"
```

---

## Task 4: `src/deploy/util.js` (slugify)

**Files:**
- Create: `src/deploy/util.js`, `test/util.test.js`

- [ ] **Step 1: Write the failing test**

Create `test/util.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from '../src/deploy/util.js';

test('slugify strips diacritics, lowercases, hyphenates', () => {
  assert.equal(slugify('Oniiz Sữa Tắm'), 'oniiz-sua-tam');
  assert.equal(slugify('  Hello, World!  '), 'hello-world');
  assert.equal(slugify(''), 'lp');
  assert.equal(slugify('A'.repeat(60)).length, 40);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test test/util.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/deploy/util.js`**

```js
export function slugify(s) {
  const out = String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return (out || 'lp').slice(0, 40).replace(/-+$/g, '');
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test test/util.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/deploy/util.js test/util.test.js
git commit -m "feat(deploy): slugify util"
```

---

## Task 5: `src/deploy/github.js` (ensureRepo + pushFiles)

**Files:**
- Create: `src/deploy/github.js`, `test/github.test.js`

- [ ] **Step 1: Write the failing test**

Create `test/github.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installFetch } from './helpers.js';
import { ensureRepo, pushFiles } from '../src/deploy/github.js';

test('ensureRepo creates repo and returns owner/repo', async () => {
  const fx = installFetch([{ body: { name: 'brand-lp', owner: { login: 'haideman2025' } } }]);
  const out = await ensureRepo('tok', 'brand-lp');
  fx.restore();
  assert.deepEqual(out, { owner: 'haideman2025', repo: 'brand-lp' });
  assert.equal(fx.calls[0].url, 'https://api.github.com/user/repos');
  assert.match(fx.calls[0].opts.headers.Authorization, /Bearer tok/);
});

test('ensureRepo retries with suffix on 422 name-taken', async () => {
  const fx = installFetch([
    { ok: false, status: 422, body: { message: 'name already exists' } },
    { body: { name: 'brand-lp-2', owner: { login: 'u' } } },
  ]);
  const out = await ensureRepo('tok', 'brand-lp');
  fx.restore();
  assert.equal(out.repo, 'brand-lp-2');
});

test('pushFiles walks ref→commit→blobs→tree→commit→patch', async () => {
  const fx = installFetch([
    { body: { object: { sha: 'BASE' } } },                 // get ref
    { body: { tree: { sha: 'BASETREE' } } },               // get base commit
    { body: { sha: 'BLOB1' } },                            // blob for file 1
    { body: { sha: 'TREE' } },                             // create tree
    { body: { sha: 'NEWCOMMIT' } },                        // create commit
    { body: {} },                                          // patch ref
  ]);
  const out = await pushFiles('tok', 'u', 'r', [{ path: 'index.html', content: '<h1>', encoding: 'utf-8' }]);
  fx.restore();
  assert.equal(out.commitSha, 'NEWCOMMIT');
  assert.match(fx.calls[2].url, /\/git\/blobs$/);
  assert.match(fx.calls[5].url, /\/git\/refs\/heads\/main$/);
  assert.equal(fx.calls[5].opts.method, 'PATCH');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test test/github.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/deploy/github.js`**

```js
const GH = 'https://api.github.com';

async function gh(token, path, opts = {}) {
  const r = await fetch(GH + path, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      ...(opts.headers || {}),
    },
  });
  const text = await r.text();
  const data = text ? JSON.parse(text) : {};
  if (!r.ok) {
    const err = new Error(data.message || `GitHub ${r.status}`);
    err.status = r.status; err.data = data;
    throw err;
  }
  return data;
}

export async function getUser(token) {
  return gh(token, '/user');
}

export async function ensureRepo(token, name) {
  for (let i = 0; i < 5; i++) {
    const tryName = i === 0 ? name : `${name}-${i + 1}`;
    try {
      const repo = await gh(token, '/user/repos', {
        method: 'POST',
        body: JSON.stringify({ name: tryName, private: true, auto_init: true }),
      });
      return { owner: repo.owner.login, repo: repo.name };
    } catch (e) {
      if (e.status === 422) continue;
      throw e;
    }
  }
  throw new Error('Không tạo được repo: tên đã tồn tại, hãy đổi tên brand.');
}

export async function pushFiles(token, owner, repo, files, message = 'Deploy from Landing Page Factory') {
  const ref = await gh(token, `/repos/${owner}/${repo}/git/ref/heads/main`);
  const baseSha = ref.object.sha;
  const baseCommit = await gh(token, `/repos/${owner}/${repo}/git/commits/${baseSha}`);
  const baseTree = baseCommit.tree.sha;

  const tree = [];
  for (const f of files) {
    const blob = await gh(token, `/repos/${owner}/${repo}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({ content: f.content, encoding: f.encoding || 'utf-8' }),
    });
    tree.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha });
  }
  const newTree = await gh(token, `/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: baseTree, tree }),
  });
  const commit = await gh(token, `/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message, tree: newTree.sha, parents: [baseSha] }),
  });
  await gh(token, `/repos/${owner}/${repo}/git/refs/heads/main`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha, force: true }),
  });
  return { owner, repo, commitSha: commit.sha };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test test/github.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/deploy/github.js test/github.test.js
git commit -m "feat(deploy): GitHub create-repo + push-files via Git Data API"
```

---

## Task 6: `src/deploy/vercel.js` (deploy + domain)

**Files:**
- Create: `src/deploy/vercel.js`, `test/vercel.test.js`

- [ ] **Step 1: Write the failing test**

Create `test/vercel.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installFetch } from './helpers.js';
import { createDeployment, waitDeployment, addDomain } from '../src/deploy/vercel.js';

test('createDeployment posts inline files and returns ids', async () => {
  const fx = installFetch([{ body: { id: 'dpl_1', projectId: 'prj_1', url: 'site.vercel.app', readyState: 'QUEUED' } }]);
  const out = await createDeployment('tok', {
    name: 'brand',
    files: [{ path: 'index.html', content: '<h1>', encoding: 'utf-8' }],
    teamId: 'team_1',
  });
  fx.restore();
  assert.equal(out.projectId, 'prj_1');
  assert.match(fx.calls[0].url, /\/v13\/deployments\?teamId=team_1/);
  const sent = JSON.parse(fx.calls[0].opts.body);
  assert.equal(sent.files[0].file, 'index.html');
  assert.equal(sent.files[0].data, '<h1>');
});

test('waitDeployment resolves when READY', async () => {
  const fx = installFetch([{ body: { readyState: 'READY', url: 'site.vercel.app' } }]);
  const out = await waitDeployment('tok', 'dpl_1', 'team_1', { intervalMs: 1 });
  fx.restore();
  assert.equal(out.url, 'site.vercel.app');
});

test('waitDeployment throws on ERROR', async () => {
  const fx = installFetch([{ body: { readyState: 'ERROR', errorMessage: 'boom' } }]);
  await assert.rejects(() => waitDeployment('tok', 'dpl_1', 'team_1', { intervalMs: 1 }), /boom/);
  fx.restore();
});

test('addDomain posts domain then reads config', async () => {
  const fx = installFetch([
    { body: { name: 'x.com' } },                                 // POST domain
    { body: { misconfigured: false, recommendedIPv4: ['76.76.21.21'] } }, // GET config
  ]);
  const out = await addDomain('tok', 'prj_1', 'x.com', 'team_1');
  fx.restore();
  assert.equal(out.verified, true);
  assert.match(fx.calls[0].url, /\/v10\/projects\/prj_1\/domains\?teamId=team_1/);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test test/vercel.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/deploy/vercel.js`**

```js
const API = 'https://api.vercel.com';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function vc(token, path, opts = {}, teamId) {
  const sep = path.includes('?') ? '&' : '?';
  const url = API + path + (teamId ? `${sep}teamId=${teamId}` : '');
  const r = await fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      ...(opts.headers || {}),
    },
  });
  const text = await r.text();
  const data = text ? JSON.parse(text) : {};
  if (!r.ok) {
    const err = new Error((data.error && data.error.message) || `Vercel ${r.status}`);
    err.status = r.status; err.data = data;
    throw err;
  }
  return data;
}

export async function createDeployment(token, { name, files, teamId }) {
  const vfiles = files.map((f) => ({
    file: f.path,
    data: f.content,
    ...(f.encoding === 'base64' ? { encoding: 'base64' } : {}),
  }));
  const dep = await vc(token, '/v13/deployments', {
    method: 'POST',
    body: JSON.stringify({
      name,
      files: vfiles,
      target: 'production',
      projectSettings: { framework: null },
    }),
  }, teamId);
  return { id: dep.id, projectId: dep.projectId, url: dep.url, readyState: dep.readyState };
}

export async function waitDeployment(token, id, teamId, opts = {}) {
  const { onTick, maxMs = 180000, intervalMs = 3000 } = opts;
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const d = await vc(token, `/v13/deployments/${id}`, {}, teamId);
    if (onTick) onTick(d.readyState);
    if (d.readyState === 'READY') return { url: d.url, alias: d.alias };
    if (d.readyState === 'ERROR' || d.readyState === 'CANCELED') {
      throw new Error('Vercel build lỗi: ' + (d.errorMessage || d.readyState));
    }
    await sleep(intervalMs);
  }
  throw new Error('Deploy quá thời gian chờ.');
}

export async function addDomain(token, projectId, domain, teamId) {
  await vc(token, `/v10/projects/${projectId}/domains`, {
    method: 'POST',
    body: JSON.stringify({ name: domain }),
  }, teamId);
  return getDomainConfig(token, projectId, domain, teamId);
}

export async function getDomainConfig(token, projectId, domain, teamId) {
  const cfg = await vc(token, `/v9/projects/${projectId}/domains/${domain}/config`, {}, teamId);
  return {
    verified: cfg.misconfigured === false,
    aRecord: (cfg.recommendedIPv4 && cfg.recommendedIPv4[0]) || '76.76.21.21',
    cname: (cfg.recommendedCNAME && cfg.recommendedCNAME[0]) || 'cname.vercel-dns.com',
    raw: cfg,
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test test/vercel.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/deploy/vercel.js test/vercel.test.js
git commit -m "feat(deploy): Vercel direct deploy + poll + add-domain"
```

---

## Task 7: `src/deploy/oauth-client.js` (browser popup connect)

**Files:**
- Create: `src/deploy/oauth-client.js`, `test/oauth-client.test.js`

- [ ] **Step 1: Write the failing test**

Create `test/oauth-client.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseOAuthMessage } from '../src/deploy/oauth-client.js';

const ORIGIN = 'https://app.example';

test('parseOAuthMessage accepts a matching github message', () => {
  const ev = { origin: ORIGIN, data: { source: 'lpf-oauth', provider: 'github', token: 'gho_X' } };
  assert.deepEqual(parseOAuthMessage(ev, 'github', ORIGIN), { token: 'gho_X', teamId: null });
});

test('parseOAuthMessage returns teamId for vercel', () => {
  const ev = { origin: ORIGIN, data: { source: 'lpf-oauth', provider: 'vercel', token: 'v', teamId: 't1' } };
  assert.deepEqual(parseOAuthMessage(ev, 'vercel', ORIGIN), { token: 'v', teamId: 't1' });
});

test('parseOAuthMessage rejects wrong origin/provider/source', () => {
  assert.equal(parseOAuthMessage({ origin: 'https://evil', data: { source: 'lpf-oauth', provider: 'github', token: 'x' } }, 'github', ORIGIN), null);
  assert.equal(parseOAuthMessage({ origin: ORIGIN, data: { source: 'x', provider: 'github', token: 'x' } }, 'github', ORIGIN), null);
  assert.equal(parseOAuthMessage({ origin: ORIGIN, data: { source: 'lpf-oauth', provider: 'vercel', token: 'x' } }, 'github', ORIGIN), null);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test test/oauth-client.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/deploy/oauth-client.js`**

```js
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test test/oauth-client.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/deploy/oauth-client.js test/oauth-client.test.js
git commit -m "feat(deploy): OAuth popup client + message parser"
```

---

## Task 8: `src/deploy/wizard.js` (runDeploy orchestration)

**Files:**
- Create: `src/deploy/wizard.js`, `test/wizard.test.js`

- [ ] **Step 1: Write the failing test**

Create `test/wizard.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runDeploy } from '../src/deploy/wizard.js';

function makeDeps(overrides = {}) {
  const steps = [];
  const tokens = { github: { token: 'g', teamId: null }, vercel: { token: 'v', teamId: 't1' } };
  const deps = {
    connect: async (p) => tokens[p],
    github: {
      ensureRepo: async () => ({ owner: 'u', repo: 'brand-lp' }),
      pushFiles: async () => ({ commitSha: 'C' }),
    },
    vercel: {
      createDeployment: async () => ({ id: 'd1', projectId: 'p1', url: 'site.vercel.app' }),
      waitDeployment: async () => ({ url: 'site.vercel.app' }),
      addDomain: async () => ({ verified: false, aRecord: '76.76.21.21', cname: 'cname.vercel-dns.com' }),
    },
    onStep: (k, s, info) => steps.push([k, s, info]),
    ...overrides,
  };
  return { deps, steps };
}

test('runDeploy runs github → vercel → domain and returns summary', async () => {
  const { deps, steps } = makeDeps();
  const out = await runDeploy({
    brand: 'Brand',
    files: [{ path: 'index.html', content: '<h1>', encoding: 'utf-8' }],
    domain: 'x.com',
    deps,
  });
  assert.equal(out.repo, 'u/brand-lp');
  assert.equal(out.url, 'site.vercel.app');
  assert.equal(out.domain.aRecord, '76.76.21.21');
  assert.deepEqual(steps.map((s) => s[0] + ':' + s[1]).filter((x) => x.endsWith('done')),
    ['github:done', 'vercel:done', 'domain:done']);
});

test('runDeploy skips domain step when no domain given', async () => {
  const { deps, steps } = makeDeps();
  const out = await runDeploy({ brand: 'B', files: [], deps });
  assert.equal(out.domain, null);
  assert.ok(!steps.some((s) => s[0] === 'domain'));
});

test('runDeploy marks step error and rethrows on failure', async () => {
  const { deps, steps } = makeDeps({
    github: { ensureRepo: async () => { throw new Error('repo fail'); }, pushFiles: async () => ({}) },
  });
  await assert.rejects(() => runDeploy({ brand: 'B', files: [], deps }), /repo fail/);
  assert.ok(steps.some((s) => s[0] === 'github' && s[1] === 'error'));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test test/wizard.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/deploy/wizard.js`**

```js
import { slugify } from './util.js';

// Pure orchestration. `deps` injects connect, github, vercel, onStep.
export async function runDeploy({ brand, files, domain, deps }) {
  const onStep = deps.onStep || (() => {});
  const slug = slugify(brand);

  // 1. GitHub
  let owner, repo;
  try {
    onStep('github', 'running');
    const g = await deps.connect('github');
    ({ owner, repo } = await deps.github.ensureRepo(g.token, `${slug}-lp`));
    await deps.github.pushFiles(g.token, owner, repo, files);
    onStep('github', 'done', { repo: `${owner}/${repo}` });
  } catch (e) {
    onStep('github', 'error', { message: e.message });
    throw e;
  }

  // 2. Vercel deploy
  let dep, ready, vtok;
  try {
    onStep('vercel', 'running');
    vtok = await deps.connect('vercel');
    dep = await deps.vercel.createDeployment(vtok.token, { name: slug, files, teamId: vtok.teamId });
    ready = await deps.vercel.waitDeployment(vtok.token, dep.id, vtok.teamId, {
      onTick: (s) => onStep('vercel', 'running', { state: s }),
    });
    onStep('vercel', 'done', { url: ready.url });
  } catch (e) {
    onStep('vercel', 'error', { message: e.message });
    throw e;
  }

  // 3. Domain (optional)
  let domainInfo = null;
  if (domain) {
    try {
      onStep('domain', 'running');
      domainInfo = await deps.vercel.addDomain(vtok.token, dep.projectId, domain, vtok.teamId);
      onStep('domain', 'done', domainInfo);
    } catch (e) {
      onStep('domain', 'error', { message: e.message });
      throw e;
    }
  }

  return { repo: `${owner}/${repo}`, url: ready.url, domain: domainInfo };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test test/wizard.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/deploy/wizard.js test/wizard.test.js
git commit -m "feat(deploy): runDeploy orchestration (github → vercel → domain)"
```

---

## Task 9: DOM binding `src/deploy/wizard-init.js` + index.html integration

**Files:**
- Create: `src/deploy/wizard-init.js`
- Modify: `index.html` (add Deploy button, expose `window.__LPF_collectSiteFiles`, load module)

This task is DOM/manual-tested (no unit test — keep this file thin; all logic is in the tested modules).

- [ ] **Step 1: Implement `src/deploy/wizard-init.js`**

```js
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
  const brand = (window.CFG && window.CFG.brand) || 'lp';
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
    box.appendChild(done);
  } catch (e) {
    // step already marked error by runDeploy; show a toast too
    const err = document.createElement('div');
    err.style.cssText = 'margin-top:10px;color:#c00';
    err.textContent = 'Deploy dừng lại: ' + e.message;
    box.appendChild(err);
  } finally {
    btn.disabled = false;
  }
}

export function initWizard() {
  const btn = el('lpf-deploy-btn');
  if (btn) btn.addEventListener('click', onDeployClick);
}

initWizard();
```

- [ ] **Step 2: Add the Deploy UI to index.html**

In `index.html`, immediately AFTER the existing line with `id="dlAll"` (the Cloudflare ZIP button), insert:
```html
<div id="lpf-deploy-panel" style="margin-top:14px;padding:14px;border:1px solid #2a2a2a;border-radius:10px">
  <div style="font-weight:600;margin-bottom:8px">🚀 Deploy lên domain của bạn (GitHub + Vercel)</div>
  <input id="lpf-domain" placeholder="domain của bạn, ví dụ: shop.example.com (để trống nếu chỉ cần *.vercel.app)"
         style="width:100%;padding:8px;margin-bottom:8px">
  <button class="big sec" id="lpf-deploy-btn">🚀 Connect &amp; Deploy</button>
  <div id="lpf-deploy-steps" style="margin-top:10px;font-size:14px"></div>
</div>
<script type="module" src="src/deploy/wizard-init.js"></script>
```

- [ ] **Step 3: Expose site files from the existing inline script**

In `index.html`, find the existing `downloadAll()` function (it builds `site.folder(slug)` with `index.html` + `assets`). Immediately AFTER that function, add a bridge that reuses the same `renderLP`/`srcAsset`/`LPS`/`CFG` already in scope:
```html
<script>
window.__LPF_collectSiteFiles = function () {
  if (!window.LPS || !LPS.length) return [];
  var files = [];
  var links = [];
  LPS.forEach(function (lp, i) {
    var slug = (lp.a && lp.a.slug) || ('lp' + i);
    files.push({ path: slug + '/index.html', content: renderLP(lp, srcAsset(lp)), encoding: 'utf-8' });
    Object.keys(lp.slots).forEach(function (k) {
      if (lp.b64[k]) {
        // lp.slots[k].name already looks like "assets/xxx.png"
        files.push({ path: slug + '/' + lp.slots[k].name, content: lp.b64[k], encoding: 'base64' });
      }
    });
    links.push('<li><a href="./' + slug + '/">' + slug + '</a></li>');
  });
  // root index linking all LPs (so the bare domain shows something)
  files.push({ path: 'index.html',
    content: '<!doctype html><meta charset="utf-8"><title>Landing Pages</title>' +
             '<ul style="font-family:sans-serif;font-size:18px">' + links.join('') + '</ul>',
    encoding: 'utf-8' });
  return files;
};
window.CFG = window.CFG || {};
</script>
```
Note: `CFG`, `LPS`, `renderLP`, `srcAsset` already exist in the inline script. Confirm `CFG.brand` is set during generation; if it lives in a local `CFG` not on `window`, add `window.CFG = CFG;` where `CFG` is assigned in the existing `run()`/generate flow.

- [ ] **Step 4: Manual smoke test locally with Vercel dev**

```bash
cd /c/lpf-repo
npx vercel dev    # serves index.html + /api functions on http://localhost:3000
```
Open `http://localhost:3000`, generate at least one LP, click **🚀 Connect & Deploy**.
Expected: GitHub popup opens (will fail token exchange without real env vars locally — that's fine for this step; verify the popup opens and the step shows ⏳ then ❌ with a readable message). Confirm no console errors in module loading and that `window.__LPF_collectSiteFiles()` returns files in the console.

- [ ] **Step 5: Commit**

```bash
git add src/deploy/wizard-init.js index.html
git commit -m "feat(ui): in-app Deploy wizard wired into index.html"
```

---

## Task 10: Full suite green + README/setup docs

**Files:**
- Modify: `README.md`
- Create: `references/deploy-oauth-setup.md`

- [ ] **Step 1: Run the entire test suite**

Run: `npm test`
Expected: all tests pass across `test/*.test.js` (`# pass` count = sum of all tests; `# fail 0`).

- [ ] **Step 2: Write `references/deploy-oauth-setup.md` (owner setup guide)**

````markdown
# Bật tính năng Deploy 1-chạm (GitHub + Vercel)

Tính năng này cho người dùng OAuth-connect tài khoản GitHub + Vercel **của họ** và
deploy landing page lên domain của họ. Bạn (chủ tool) cần đăng ký 2 OAuth app một lần.

## 1) GitHub OAuth App
1. Vào https://github.com/settings/developers → **New OAuth App**
2. Homepage URL: `https://YOURTOOL.vercel.app`
3. Authorization callback URL: `https://YOURTOOL.vercel.app/api/auth/github/callback`
4. Tạo xong → copy **Client ID**, bấm **Generate a new client secret** → copy secret
5. Scope mặc định khi user authorize: `repo`

## 2) Vercel Integration
1. Vào https://vercel.com/dashboard → **Integrations → Create**
2. Redirect URL: `https://YOURTOOL.vercel.app/api/auth/vercel/callback`
3. Scopes: project (create/read), deployment (create), domain (add)
4. Copy **Client ID** + **Client Secret**

## 3) Vercel Environment Variables (Project → Settings → Environment Variables)
```
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
VERCEL_CLIENT_ID=...
VERCEL_CLIENT_SECRET=...
OAUTH_REDIRECT_BASE=https://YOURTOOL.vercel.app
```
Redeploy sau khi thêm env var.

## Bảo mật
- Secret **chỉ** sống ở Vercel env var — không bao giờ commit, không bao giờ gửi ra browser.
- Nếu một secret từng bị lộ (paste nhầm chỗ công khai), bấm **Generate a new client secret** để xoay.
````

- [ ] **Step 3: Update README.md "Deploy" section**

In `README.md`, replace the `## Deploy LP lên Cloudflare` section body with an additional paragraph above it:
```markdown
## Deploy 1-chạm lên domain của bạn (GitHub + Vercel)
Trong app, sau khi tạo LP, bấm **🚀 Connect & Deploy** → đăng nhập GitHub + Vercel (popup) →
nhập domain → làm theo hướng dẫn DNS hiện ra. Source được đẩy vào repo GitHub của bạn,
site chạy trên Vercel. Chủ tool cấu hình một lần theo `references/deploy-oauth-setup.md`.

## Deploy LP lên Cloudflare (cách cũ, vẫn dùng được)
```
(keep the existing Cloudflare instructions below as the fallback.)

- [ ] **Step 4: Commit**

```bash
git add README.md references/deploy-oauth-setup.md
git commit -m "docs: OAuth deploy setup guide + README update"
```

- [ ] **Step 5: Push everything**

```bash
git push origin main
```
Expected: all commits land on `haideman2025/landingpage-factory`.

---

## Task 11: Deploy to Vercel + live verification

This task requires the owner's Vercel account and the 2 OAuth apps from Task 10's guide.

- [ ] **Step 1:** Import `haideman2025/landingpage-factory` into Vercel (or `npx vercel --prod`). Framework preset: **Other** (static + functions). No build command.

- [ ] **Step 2:** Set the 5 env vars (Task 10 guide) in Vercel → redeploy.

- [ ] **Step 3:** Set both OAuth apps' callback URLs to the real `https://<project>.vercel.app/...` values.

- [ ] **Step 4: End-to-end live test.** Open the live URL → generate an LP → Connect & Deploy → authorize GitHub + Vercel → enter a test domain you control → verify: (a) a new private repo appears in GitHub with `/site` content, (b) a Vercel project deploys and the `*.vercel.app` URL serves the LP, (c) the domain step prints DNS records. Add the DNS record at your registrar and confirm the domain goes live.

- [ ] **Step 5:** ⚠️ Regenerate the GitHub client secret that was exposed in chat during design, update the Vercel env var, redeploy.

---

## Self-Review Notes (for the implementer)

- **Vercel API surface** (`/v13/deployments`, `/v2/oauth/access_token`, `/v10/projects/.../domains`, `/v9/.../config`) — endpoints are current as of this plan; if Vercel returns a 4xx with a "use vN" hint, bump the version in `src/deploy/vercel.js`/`api/auth/vercel/callback.js` and adjust the matching test's expected URL.
- **Large images:** the inline-`data` deploy path (`createDeployment`) and GitHub blob push both send base64 in JSON. If a deploy fails on payload size, switch images to Vercel's `POST /v2/files` SHA-upload path — isolate this in `src/deploy/vercel.js` so only that file + its test change.
- **`CFG.brand` exposure:** the only fragile integration point — verify in Task 9 Step 3 that `window.CFG.brand` is populated after generation; if the inline script keeps `CFG` local, add `window.CFG = CFG;` at its assignment site.
