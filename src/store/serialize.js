// Runtime Studio state <-> persisted shape.
// Persisted = { config (lightweight JSON, no image bytes), images[] (bytes, stored separately) }.

export function collectImages(state) {
  const out = [];
  (state.LPS || []).forEach((lp, i) => {
    const b64 = lp.b64 || {};
    Object.keys(b64).forEach(k => { if (b64[k]) out.push({ lp_index: i, slot_key: k, kind: 'lp', b64: b64[k] }); });
    const ad = lp.adB64 || {};
    Object.keys(ad).forEach(k => { if (ad[k]) out.push({ lp_index: i, slot_key: k, kind: 'ad', b64: ad[k] }); });
  });
  (state.UGC || []).forEach((u, i) => {
    if (u && u.b64) out.push({ lp_index: -1, slot_key: 'ugc' + i, kind: 'ugc', b64: u.b64 });
  });
  return out;
}

export function toConfig(state) {
  const cfg = { ...(state.CFG || {}) };
  delete cfg.key; // never persist the API key in project config
  return {
    version: 1,
    CFG: cfg,
    ANGLES: state.ANGLES || [],
    UI: state.UI || {},
    LPS: (state.LPS || []).map(lp => ({ a: lp.a || {}, slots: lp.slots || {}, videos: lp.videos || '' })),
    UGC: (state.UGC || []).map(u => ({ tag: u && u.tag })),
  };
}

export function fromConfig(config) {
  const c = config || {};
  return {
    CFG: c.CFG || {},
    ANGLES: c.ANGLES || [],
    UI: c.UI || {},
    LPS: (c.LPS || []).map(lp => ({ a: lp.a || {}, slots: lp.slots || {}, videos: lp.videos || '', b64: {}, adB64: {} })),
    UGC: (c.UGC || []).map(u => ({ tag: u && u.tag })),
  };
}

export function applyImages(state, images) {
  (images || []).forEach(img => {
    if (img.kind === 'ugc') {
      const idx = parseInt(String(img.slot_key).slice(3), 10) || 0;
      state.UGC[idx] = state.UGC[idx] || {};
      state.UGC[idx].b64 = img.b64;
    } else {
      const lp = state.LPS[img.lp_index];
      if (!lp) return;
      if (img.kind === 'ad') { lp.adB64 = lp.adB64 || {}; lp.adB64[img.slot_key] = img.b64; }
      else { lp.b64 = lp.b64 || {}; lp.b64[img.slot_key] = img.b64; }
    }
  });
  return state;
}
