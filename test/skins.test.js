import { test } from 'node:test';
import assert from 'node:assert/strict';
import { skinIds, skinCSS } from '../src/templates/skins.js';

test('skinIds includes default and the VN platform skins', () => {
  const ids = skinIds();
  for (const id of ['default', 'light', 'shopee', 'tiktok', 'hasaki']) {
    assert.ok(ids.includes(id), 'missing skin ' + id);
  }
});

test('default skin is empty (no override); shopee/tiktok set brand accents', () => {
  assert.equal(skinCSS('default'), '');
  assert.match(skinCSS('shopee'), /--acc:#ee4d2d/);
  assert.match(skinCSS('tiktok'), /--acc:#fe2c55/);
  assert.match(skinCSS('tiktok'), /--bg:#000000/);
});

test('unknown skin id falls back to empty', () => {
  assert.equal(skinCSS('nope'), '');
  assert.equal(skinCSS(''), '');
  assert.equal(skinCSS(undefined), '');
});
