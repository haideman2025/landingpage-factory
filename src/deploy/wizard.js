import { slugify } from './util.js';

// Pure orchestration. Vercel-only by default (fastest path to a live ad link).
// Pass withGitHub:true to also push source to the user's GitHub repo.
// `deps` injects connect, vercel, (optional) github, onStep.
export async function runDeploy({ brand, files, domain, deps, withGitHub = false }) {
  const onStep = deps.onStep || (() => {});
  const slug = slugify(brand);

  // 1. GitHub (optional)
  let repo = null;
  if (withGitHub) {
    try {
      onStep('github', 'running');
      const g = await deps.connect('github');
      const r = await deps.github.ensureRepo(g.token, `${slug}-lp`);
      await deps.github.pushFiles(g.token, r.owner, r.repo, files);
      repo = `${r.owner}/${r.repo}`;
      onStep('github', 'done', { repo });
    } catch (e) {
      onStep('github', 'error', { message: e.message });
      throw e;
    }
  }

  // 2. Vercel deploy (always) -> instant *.vercel.app link
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

  // 3. Custom domain (optional)
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

  return { repo, url: ready.url, domain: domainInfo };
}
