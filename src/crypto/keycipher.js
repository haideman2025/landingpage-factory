import crypto from 'node:crypto';

// AES-256-GCM. encKeyHex must be 64 hex chars (32 bytes).
// Returns "ivB64:tagB64:cipherB64".
export function encrypt(plain, encKeyHex) {
  const key = Buffer.from(encKeyHex, 'hex');
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([c.update(String(plain), 'utf8'), c.final()]);
  const tag = c.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join(':');
}

export function decrypt(blob, encKeyHex) {
  const key = Buffer.from(encKeyHex, 'hex');
  const [ivB, tagB, dataB] = String(blob).split(':');
  const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB, 'base64'));
  d.setAuthTag(Buffer.from(tagB, 'base64'));
  return Buffer.concat([d.update(Buffer.from(dataB, 'base64')), d.final()]).toString('utf8');
}
