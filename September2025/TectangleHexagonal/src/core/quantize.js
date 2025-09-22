/*
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
 - [ ] Re-evaluate this artifact against current Hexagonal goals
 - [ ] Verify dependent modules and update factorization notes
 - [ ] Log decisions in TODO_2025-09-16.md
*/

// Quantization helpers for scheduling/visualization

function rnd(seed){ // simple LCG for deterministic humanize if needed
  const a=1664525, c=1013904223, m=2**32; seed = (a*seed + c) % m; return [seed, seed/m];
}

export function quantizeTime(tMs, { gridMs=100, strength=1.0, swingPct=0, humanizeMs=0, seed=0 }={}){
  if(!Number.isFinite(tMs) || gridMs<=0) return tMs;
  // swing: offset every other grid by swingPct of grid
  const n = Math.round(tMs / gridMs);
  const base = n * gridMs;
  const isOdd = (n % 2) !== 0;
  const swing = (isOdd ? swingPct : 0) * gridMs;
  let q = base + swing;
  // strength blend
  const out = tMs + (q - tMs) * Math.max(0, Math.min(1, strength));
  // humanize random jitter
  if(humanizeMs>0){ const r = (Math.random()*2-1) * humanizeMs; return out + r; }
  return out;
}

export function quantizeNow(nowMs, params){ return quantizeTime(nowMs, params); }
