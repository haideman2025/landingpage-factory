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

test('runDeploy runs github -> vercel -> domain and returns summary', async () => {
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
