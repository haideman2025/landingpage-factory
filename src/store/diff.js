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
