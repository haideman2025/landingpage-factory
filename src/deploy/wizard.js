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
