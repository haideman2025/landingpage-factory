import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from '../src/deploy/util.js';

test('slugify strips diacritics, lowercases, hyphenates', () => {
  assert.equal(slugify('Oniiz Sữa Tắm'), 'oniiz-sua-tam');
  assert.equal(slugify('  Hello, World!  '), 'hello-world');
  assert.equal(slugify(''), 'lp');
  assert.equal(slugify('A'.repeat(60)).length, 40);
});
