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
    { body: { name: 'x.com' } },                                         // POST domain
    { body: { misconfigured: false, recommendedIPv4: ['76.76.21.21'] } }, // GET config
  ]);
  const out = await addDomain('tok', 'prj_1', 'x.com', 'team_1');
  fx.restore();
  assert.equal(out.verified, true);
  assert.match(fx.calls[0].url, /\/v10\/projects\/prj_1\/domains\?teamId=team_1/);
});
