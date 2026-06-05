import { buildPrivacy, buildTerms } from './policies.js';

// Expose policy builders to the classic collectSiteFiles bridge (which can't import ESM).
window.__LPF_policies = { buildPrivacy, buildTerms };
