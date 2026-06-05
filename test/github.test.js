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

test('pushFiles walks ref->commit->blobs->tree->commit->patch', async () => {
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
