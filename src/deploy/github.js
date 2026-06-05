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
