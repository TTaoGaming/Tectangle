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

import { computePalmAngle } from '../core/handGeometry.js';

// PhysicsLookahead port: predict thumb/index at t+Δ and apply a hysteresis tube
// Pure adapter: no DOM; inputs are per-hand detections { wrist, indexMCP, pinkyMCP, thumbTip, indexTip }
// Returns per-hand predictions and a ghostDown boolean driven by inner/outer thresholds

function hypot2(a,b){ const dx=a[0]-b[0], dy=a[1]-b[1]; return Math.hypot(dx,dy); }
function gateOk(hand, wrist, indexMCP, pinkyMCP, cone){ const ang = computePalmAngle(wrist, indexMCP, pinkyMCP, { hand }); return ang!=null && ang<=cone; }

export function createPhysicsLookahead(opts={}){
  const C = Object.assign({ lookaheadMs: 80, inner: 0.50, outer: 0.72, accelWeight: 0.3, palmConeDeg:30 }, opts);
  const S = { H1:init(), H2:init() };
  function init(){ return { last:null, v:{ thumb:[0,0,0], index:[0,0,0] }, a:{ thumb:[0,0,0], index:[0,0,0] }, ghostDown:false }; }

  function predictPoint(p, v, a, dt){
    const ax = (a?.[0]||0)*C.accelWeight, ay=(a?.[1]||0)*C.accelWeight, az=(a?.[2]||0)*C.accelWeight;
    return [ p[0] + v[0]*dt + 0.5*ax*dt*dt, p[1] + v[1]*dt + 0.5*ay*dt*dt, (p[2]||0) + v[2]*dt + 0.5*az*dt*dt ];
  }

  function step(hand, det, t){
    const prev = hand.last;
    const curr = {
      t,
      hand: det.hand || det.rawLabel || null,
      wrist: det.wrist||null,
      indexMCP: det.indexMCP||null,
      pinkyMCP: det.pinkyMCP||null,
      thumb: det.thumbTip||det.landmarks?.[4]||null,
      index: det.indexTip||det.landmarks?.[8]||null
    };
    hand.last = curr;
    if(!curr.thumb || !curr.index) return { ok:false };
    if(prev){
      const dt = Math.max(1, t - prev.t)/1000;
      const vThumb = [ (curr.thumb[0] - prev.thumb[0])/dt, (curr.thumb[1]-prev.thumb[1])/dt, ((curr.thumb[2]||0)-(prev.thumb[2]||0))/dt ];
      const vIndex = [ (curr.index[0] - prev.index[0])/dt, (curr.index[1]-prev.index[1])/dt, ((curr.index[2]||0)-(prev.index[2]||0))/dt ];
      const aThumb = [ (vThumb[0]-hand.v.thumb[0])/dt, (vThumb[1]-hand.v.thumb[1])/dt, (vThumb[2]-hand.v.thumb[2])/dt ];
      const aIndex = [ (vIndex[0]-hand.v.index[0])/dt, (vIndex[1]-hand.v.index[1])/dt, (vIndex[2]-hand.v.index[2])/dt ];
      hand.v.thumb = vThumb; hand.v.index = vIndex; hand.a.thumb = aThumb; hand.a.index = aIndex;
    }
    const kn = (curr.indexMCP && curr.pinkyMCP) ? hypot2(curr.indexMCP, curr.pinkyMCP) : null;
    const knOk = !!kn && kn>1e-6 && isFinite(kn);
    const gated = gateOk(curr.hand, curr.wrist, curr.indexMCP, curr.pinkyMCP, C.palmConeDeg);
    const dt = C.lookaheadMs/1000;
    const thumbPred = predictPoint(curr.thumb, hand.v.thumb, hand.a.thumb, dt);
    const indexPred = predictPoint(curr.index, hand.v.index, hand.a.index, dt);
    const normPred = knOk ? (hypot2(indexPred, thumbPred)/kn) : null;
    const normNow  = knOk ? (hypot2(curr.index, curr.thumb)/kn) : null;
    // Hysteresis tube on predicted gap
    if(gated && normPred!=null){
      if(!hand.ghostDown && normPred <= C.inner){ hand.ghostDown = true; }
      else if(hand.ghostDown && normPred >= C.outer){ hand.ghostDown = false; }
    } else {
      hand.ghostDown = false;
    }
    return { ok:true, gated, knOk, thumbPred, indexPred, normPred, normNow, ghostDown: hand.ghostDown };
  }

  function update(dets, t){
    const out = [];
    for(const d of dets||[]){
      const id = d.handId || d.id; const key = (id==='H1'||id==='H2')? id : (out.length===0? 'H1':'H2');
      const o = step(S[key], d, t);
      out.push({ id:key, ...o });
    }
    return out;
  }

  function setConfig(part){ Object.assign(C, part||{}); }
  function getConfig(){ return { ...C }; }
  function reset(){ S.H1=init(); S.H2=init(); }

  return { update, setConfig, getConfig, reset };
}




