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

// TOIPort: Hex port for predicted/actual Time-of-Impact computation tied to hysteresis thresholds.
// Note: Keep this adapter-free; implement adapters beside this port.
// Contract:
// - input: { t, norm, vRel, aRel, enterThresh }
// - output: { toiPredAbsV|null, toiPredAbsA|null }
// - helpers: interpolateEnter(prevT, prevNorm, currT, currNorm, enterThresh)

export function interpolateEnter(prevT, prevNorm, currT, currNorm, enterThresh){
  const dn = currNorm - prevNorm; const dt = currT - prevT; if(Math.abs(dn) < 1e-9 || dt <= 0) return currT;
  const alpha = (enterThresh - prevNorm) / dn; const a = Math.max(0, Math.min(1, alpha)); return Math.round(prevT + a*dt);
}

export function toiPredictorVelocity({ t, norm, vRel, enterThresh }){
  const s = Math.max(0, norm - enterThresh);
  if(!(vRel < 0) || Math.abs(vRel) < 1e-6) return { toiPredAbsV: null };
  const ms = (s/Math.abs(vRel))*1000; return { toiPredAbsV: isFinite(ms) ? (t + ms) : null };
}

export function toiPredictorAccel({ t, norm, vRel, aRel, enterThresh }){
  const s = Math.max(0, norm - enterThresh);
  if(!(vRel < 0)) return { toiPredAbsA: null };
  if(Math.abs(aRel) < 1e-6){ if(Math.abs(vRel) < 1e-6) return { toiPredAbsA: null }; const ms = (s/Math.abs(vRel))*1000; return { toiPredAbsA: isFinite(ms) ? (t + ms) : null }; }
  const a = aRel, v = vRel; const disc = v*v - 2*a*s; if(disc < 0) return { toiPredAbsA: null };
  const t1 = (-v - Math.sqrt(disc)) / a; const t2 = (-v + Math.sqrt(disc)) / a; const cand = [t1,t2].filter(x=> x>0); if(!cand.length) return { toiPredAbsA: null };
  const ms = Math.min(...cand)*1000; return { toiPredAbsA: isFinite(ms) ? (t + ms) : null };
}
