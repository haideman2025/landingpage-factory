import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fnv1a } from '../src/store/hash.js';
import { storagePath } from '../src/store/imagepaths.js';
import { collectImages, toConfig, fromConfig, applyImages } from '../src/store/serialize.js';
import { planSync } from '../src/store/diff.js';

test('fnv1a is deterministic and 8 hex chars', () => {
  const h = fnv1a('hello');
  assert.match(h, /^[0-9a-f]{8}$/);
  assert.equal(fnv1a('hello'), h);
});

test('fnv1a differs for different input', () => {
  assert.notEqual(fnv1a('a'), fnv1a('b'));
});

test('storagePath builds {user}/{project}/{lp}/{slot}.jpg', () => {
  const p = storagePath('U1', 'P1', { lp_index: 0, slot_key: 'hero' });
  assert.equal(p, 'U1/P1/0/hero.jpg');
});

test('storagePath handles ugc with lp_index -1', () => {
  const p = storagePath('U1', 'P1', { lp_index: -1, slot_key: 'ugc2' });
  assert.equal(p, 'U1/P1/-1/ugc2.jpg');
});

const sampleState = () => ({
  CFG: { brand: 'ONIIZ', product: 'Foam', key: 'SECRET' },
  ANGLES: [{ slug: 'a1' }],
  UI: { cta: 'Mua' },
  LPS: [{ a: { slug: 'a1' }, slots: { hero: { ratio: '4/5' } }, b64: { hero: 'AAA' }, adB64: { ad0: 'BBB' } }],
  UGC: [{ b64: 'CCC', tag: 'u' }],
});

test('collectImages flattens lp/ad/ugc images', () => {
  const imgs = collectImages(sampleState());
  assert.deepEqual(imgs.sort((a, b) => a.slot_key.localeCompare(b.slot_key)), [
    { lp_index: 0, slot_key: 'ad0', kind: 'ad', b64: 'BBB' },
    { lp_index: 0, slot_key: 'hero', kind: 'lp', b64: 'AAA' },
    { lp_index: -1, slot_key: 'ugc0', kind: 'ugc', b64: 'CCC' },
  ]);
});

test('toConfig strips the API key and all image bytes', () => {
  const c = toConfig(sampleState());
  assert.equal(c.CFG.key, undefined);
  assert.equal(c.CFG.brand, 'ONIIZ');
  assert.equal(c.LPS[0].b64, undefined);
  assert.equal(c.LPS[0].adB64, undefined);
  assert.equal(c.LPS[0].slots.hero.ratio, '4/5');
  assert.equal(c.version, 1);
});

test('fromConfig rebuilds state with empty image maps', () => {
  const s = fromConfig(toConfig(sampleState()));
  assert.equal(s.LPS[0].a.slug, 'a1');
  assert.deepEqual(s.LPS[0].b64, {});
  assert.deepEqual(s.LPS[0].adB64, {});
  assert.equal(s.UGC.length, 1);
});

test('applyImages restores bytes into the rebuilt state', () => {
  const s = fromConfig(toConfig(sampleState()));
  applyImages(s, [
    { lp_index: 0, slot_key: 'hero', kind: 'lp', b64: 'AAA' },
    { lp_index: 0, slot_key: 'ad0', kind: 'ad', b64: 'BBB' },
    { lp_index: -1, slot_key: 'ugc0', kind: 'ugc', b64: 'CCC' },
  ]);
  assert.equal(s.LPS[0].b64.hero, 'AAA');
  assert.equal(s.LPS[0].adB64.ad0, 'BBB');
  assert.equal(s.UGC[0].b64, 'CCC');
});

test('planSync uploads everything when no known hashes', () => {
  const imgs = [{ lp_index: 0, slot_key: 'hero', kind: 'lp', b64: 'AAAA' }];
  const r = planSync('U1', 'P1', imgs, {});
  assert.equal(r.uploads.length, 1);
  assert.equal(r.uploads[0].path, 'U1/P1/0/hero.jpg');
  assert.equal(r.uploads[0].hash, fnv1a('AAAA'));
  assert.equal(r.uploads[0].bytes, 3); // floor(4 * 0.75)
  assert.deepEqual(r.removed, []);
  assert.equal(r.hashes['U1/P1/0/hero.jpg'], fnv1a('AAAA'));
});

test('planSync skips unchanged images', () => {
  const imgs = [{ lp_index: 0, slot_key: 'hero', kind: 'lp', b64: 'AAAA' }];
  const known = { 'U1/P1/0/hero.jpg': fnv1a('AAAA') };
  const r = planSync('U1', 'P1', imgs, known);
  assert.equal(r.uploads.length, 0);
  assert.deepEqual(r.removed, []);
});

test('planSync re-uploads changed images', () => {
  const imgs = [{ lp_index: 0, slot_key: 'hero', kind: 'lp', b64: 'ZZZZ' }];
  const known = { 'U1/P1/0/hero.jpg': fnv1a('AAAA') };
  const r = planSync('U1', 'P1', imgs, known);
  assert.equal(r.uploads.length, 1);
  assert.equal(r.uploads[0].hash, fnv1a('ZZZZ'));
});

test('planSync marks removed images', () => {
  const known = { 'U1/P1/0/hero.jpg': 'x', 'U1/P1/0/old.jpg': 'y' };
  const imgs = [{ lp_index: 0, slot_key: 'hero', kind: 'lp', b64: 'AAAA' }];
  const r = planSync('U1', 'P1', imgs, known);
  assert.deepEqual(r.removed, ['U1/P1/0/old.jpg']);
});
