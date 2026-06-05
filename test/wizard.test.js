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

test('default (Vercel-only) deploys without GitHub and returns the link', async () => {
  const { deps, steps } = makeDeps();
  const out = await runDeploy({
    brand: 'Brand',
    files: [{ path: 'index.html', content: '<h1>', encoding: 'utf-8' }],
    deps,
  });
  assert.equal(out.url, 'site.vercel.app');
  assert.equal(out.repo, null);
  assert.ok(!steps.some((s) => s[0] === 'github'));
  assert.ok(steps.some((s) => s[0] === 'vercel' && s[1] === 'done'));
});

test('withGitHub:true runs github -> vercel and returns repo', async () => {
  const { deps, steps } = makeDeps();
  const out = await runDeploy({
    brand: 'Brand',
    files: [{ path: 'index.html', content: '<h1>', encoding: 'utf-8' }],
    domain: 'x.com',
    withGitHub: true,
    deps,
  });
  assert.equal(out.repo, 'u/brand-lp');
  assert.equal(out.url, 'site.vercel.app');
  assert.equal(out.domain.aRecord, '76.76.21.21');
  assert.deepEqual(steps.map((s) => s[0] + ':' + s[1]).filter((x) => x.endsWith('done')),
    ['github:done', 'vercel:done', 'domain:done']);
});

test('attaches domain when given (Vercel-only)', async () => {
  const { deps, steps } = makeDeps();
  const out = await runDeploy({ brand: 'B', files: [], domain: 'x.com', deps });
  assert.equal(out.domain.aRecord, '76.76.21.21');
  assert.ok(steps.some((s) => s[0] === 'domain' && s[1] === 'done'));
  assert.ok(!steps.some((s) => s[0] === 'github'));
});

test('skips domain step when no domain given', async () => {
  const { deps, steps } = makeDeps();
  const out = await runDeploy({ brand: 'B', files: [], deps });
  assert.equal(out.domain, null);
  assert.ok(!steps.some((s) => s[0] === 'domain'));
});

test('marks step error and rethrows on failure', async () => {
  const { deps, steps } = makeDeps({
    vercel: {
      createDeployment: async () => { throw new Error('deploy fail'); },
      waitDeployment: async () => ({}), addDomain: async () => ({}),
    },
  });
  await assert.rejects(() => runDeploy({ brand: 'B', files: [], deps }), /deploy fail/);
  assert.ok(steps.some((s) => s[0] === 'vercel' && s[1] === 'error'));
});
