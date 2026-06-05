// Template "skins" — CSS overrides applied AFTER the base LP stylesheet. Each skin mainly
// re-declares the :root design tokens, so the whole page reskins via CSS variables.
// Browser + Node safe (pure data).

const SKINS = {
  default: '',
  light:
    ':root{--bg:#ffffff;--s1:#f6f7f9;--s2:#eef0f3;--ink:#16181d;--mut:#6b7280;--line:#e4e7ec}'
    + 'body{background:#fff}.nav,.sticky{background:rgba(255,255,255,.92)}',
  shopee:
    ':root{--acc:#ee4d2d;--acc2:#ff6633;--bg:#ffffff;--s1:#fff7f4;--s2:#fdeee8;--ink:#1d1d1d;--mut:#757575;--line:#f0e3dd;--ok:#26aa99}'
    + 'body{background:#fff}.nav,.sticky{background:rgba(255,255,255,.95)}.btn{border-radius:6px}',
  tiktok:
    ':root{--acc:#fe2c55;--acc2:#25f4ee;--bg:#000000;--s1:#121212;--s2:#1c1c1c;--ink:#ffffff;--mut:#a1a1a1;--line:#262626;--ok:#25f4ee}'
    + '.btn{border-radius:8px}',
  hasaki:
    ':root{--acc:#1aa055;--acc2:#ff6600;--bg:#ffffff;--s1:#f4faf6;--s2:#eaf5ee;--ink:#1d1d1d;--mut:#6b7280;--line:#dfeee5;--ok:#1aa055}'
    + 'body{background:#fff}.nav,.sticky{background:rgba(255,255,255,.95)}',
};

export function skinIds() {
  return Object.keys(SKINS);
}

export function skinCSS(id) {
  return SKINS[id] || '';
}
