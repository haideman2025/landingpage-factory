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
