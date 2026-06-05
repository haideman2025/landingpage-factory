import { skinCSS, skinIds } from './skins.js';

// Expose skins to the classic renderLP script (which can't import ESM).
window.__LPF_skins = { skinCSS, skinIds };
