import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPrivacy, buildTerms, declaredProcessors } from '../src/policy/policies.js';

test('declaredProcessors lists only enabled trackers', () => {
  const none = declaredProcessors({});
  assert.ok(none.some((p) => /Cloudflare\/Vercel/.test(p)));
  assert.ok(!none.some((p) => /Meta/.test(p)));
  const all = declaredProcessors({ pixel: '1', tiktokPixel: '2', ga4: 'G-1', clarity: 'c', sheet: 's' });
  assert.ok(all.some((p) => /Meta/.test(p)));
  assert.ok(all.some((p) => /TikTok/.test(p)));
  assert.ok(all.some((p) => /Google Analytics/.test(p)));
  assert.ok(all.some((p) => /Clarity/.test(p)));
});

test('buildPrivacy includes business info, Decree 13, and declared processors', () => {
  const html = buildPrivacy({ company: 'ONIIZ', email: 'a@b.com', phone: '0909', pixel: 'PIX', tiktokPixel: 'TT' });
  assert.match(html, /Chính sách bảo mật/);
  assert.match(html, /Nghị định 13\/2023/);
  assert.match(html, /ONIIZ/);
  assert.match(html, /a@b\.com/);
  assert.match(html, /Meta Platforms/);
  assert.match(html, /TikTok/);
  assert.match(html, /<!doctype html>/);
});

test('buildTerms references the privacy page and business name', () => {
  const html = buildTerms({ brand: 'Brand', email: 'x@y.com' });
  assert.match(html, /Điều khoản sử dụng/);
  assert.match(html, /Brand/);
  assert.match(html, /href="\.\/privacy\.html"/);
});
