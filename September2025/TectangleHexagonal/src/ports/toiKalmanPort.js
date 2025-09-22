/*
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-18T00:00-06:00
Expires: 2025-10-09T00:00-06:00 (auto-expire after 21 days)

Checklist:
 - [ ] Re-evaluate this artifact against current Hexagonal goals
 - [ ] Verify dependent modules and update factorization notes
 - [ ] Document tuning defaults (q,r,dt) in SRL/ADR
*/

// WEBWAY:ww-2025-006: 1D CV Kalman TOI predictor (flagged integration follows)
// Port: createToiKalmanCV — stateful predictor using Kalman1D over normalized pinch distance.
// Contract:
// - createToiKalmanCV(opts?): { reset(), setParams({q,r}):void, step({t,norm,enterThresh}): { x, v, toiPredAbsK|null } }
// - Deterministic for fixed dt and inputs (for golden replays)

import { Kalman1D } from "../core/kalman1d.js";

export function createToiKalmanCV(opts={}){
  const P = Object.assign({ q: 5e-4, r: 5e-3 }, opts);
  let kf = new Kalman1D({ q:P.q, r:P.r, x0:0, v0:0 });
  function reset(){ kf = new Kalman1D({ q:P.q, r:P.r, x0:0, v0:0 }); }
  function setParams({q, r}){ if(typeof q==='number') P.q=q; if(typeof r==='number') P.r=r; reset(); }
  function step({ t, norm, enterThresh }){
    const { x, v } = kf.step(norm, t);
    let toiPredAbsK = null;
    const s = x - enterThresh;
    if(v < 0 && s > 0){
      const ms = (s/Math.abs(v))*1000;
      if(Number.isFinite(ms)) toiPredAbsK = t + ms;
    }
    return { x, v, toiPredAbsK };
  }
  return { reset, setParams, step };
}
