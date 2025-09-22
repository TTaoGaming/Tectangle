/*
WEBWAY:ww-2025-043: Seat-scoped config store (expires 2025-09-25)
Purpose: Manage per-seat configuration with presets; persist to localStorage.
*/

const DEFAULT_PRESETS = {
  responsive: {
    label: 'Responsive',
    lookaheadMs: 60,
    enterThresh: 0.45,
    exitThresh: 0.75,
    filterPreset: 'responsive',
    anchorDelayMs: 40,
    knuckleSpanCm: 8.0,
    knuckleTolCm: 1.5
  },
  balanced: {
    label: 'Balanced',
    lookaheadMs: 100,
    enterThresh: 0.50,
    exitThresh: 0.80,
    filterPreset: 'balanced',
    anchorDelayMs: 75,
    knuckleSpanCm: 8.0,
    knuckleTolCm: 1.5
  },
  smooth: {
    label: 'Smooth',
    lookaheadMs: 140,
    enterThresh: 0.55,
    exitThresh: 0.85,
    filterPreset: 'smooth',
    anchorDelayMs: 110,
    knuckleSpanCm: 8.0,
    knuckleTolCm: 1.5
  }
};

export function createSeatConfigStore({ seats = ['P1','P2','P3','P4'], storageKeyPrefix = 'hex:seat' } = {}){
  const presets = DEFAULT_PRESETS;
  const mem = new Map();

  function storageKey(seat){ return `${storageKeyPrefix}:${seat}:cfg`; }
  function load(seat){
    try{
      const raw = (typeof localStorage !== 'undefined') ? localStorage.getItem(storageKey(seat)) : null;
      if(raw){ return JSON.parse(raw); }
    }catch{}
    return null;
  }
  function save(seat, cfg){
    try{ if(typeof localStorage !== 'undefined'){ localStorage.setItem(storageKey(seat), JSON.stringify(cfg)); } }catch{}
  }

  function ensure(seat){
    let cfg = mem.get(seat);
    if(!cfg){
      cfg = load(seat) || { preset: 'balanced', ...presets.balanced };
      mem.set(seat, cfg);
    }
    return cfg;
  }

  function get(seat){ return { ...ensure(seat) }; }
  function set(seat, partial){
    const base = ensure(seat);
    const next = { ...base, ...partial };
    mem.set(seat, next); save(seat, next);
    return { ...next };
  }
  function setPreset(seat, presetId){
    const p = presets[presetId]; if(!p) return { ok:false, reason:'unknown-preset' };
    const next = { preset: presetId, ...p };
    mem.set(seat, next); save(seat, next);
    return { ok:true, cfg: { ...next } };
  }
  function getAll(){ const out={}; for(const s of seats){ out[s] = get(s); } return out; }

  return { get, set, setPreset, getAll, presets };
}

export default { createSeatConfigStore };
