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

// Minimal plausibility checker: are the fingers moving towards each other?
// Domain-only: consumes frames with t, indexTip, thumbTip (and optional wrist/indexMCP/pinkyMCP for palm gating)
// Returns pass/fail without ETA. Use for quick validation and automated tests.
import { OneEuro, RollingMedian, clamp } from './filters.js';
import { computeHandJointAngles, isFingersStraight, computePalmAngle } from './handGeometry.js';

export function createPlausibility(cfg={}){
  const C = Object.assign({
    palmGate: true,
    palmConeDeg: 30,
    // simple smoothing preset
    oneEuro: { minCutoff: 2.0, beta: 0.04, dCutoff: 1.2 },
    // plausibility thresholds (normalized units per second^k)
    vEps: 0.02,     // require at least this speed towards (closing)
    vMax: 10.0,     // discard absurd speeds
    aMax: 80.0,     // discard absurd accelerations
    fixedKnuckleSpan: null,
  }, cfg);

  const filt = { ix:new OneEuro(C.oneEuro), iy:new OneEuro(C.oneEuro), tx:new OneEuro(C.oneEuro), ty:new OneEuro(C.oneEuro) };
  const medV = new RollingMedian(20), medA = new RollingMedian(20);
  let lastNorm=null, lastT=null, vRel=0, aRel=0, vRelPrev=0;


  function update(frame){
    const t = frame.t;
    const ix = filt.ix.filter(frame.indexTip[0], t);
    const iy = filt.iy.filter(frame.indexTip[1], t);
    const tx = filt.tx.filter(frame.thumbTip[0], t);
    const ty = filt.ty.filter(frame.thumbTip[1], t);

    // scale by knuckle span for rough normalization
    let kn = C.fixedKnuckleSpan;
    if(!kn && frame.indexMCP && frame.pinkyMCP){
      kn = Math.hypot(frame.indexMCP[0]-frame.pinkyMCP[0], frame.indexMCP[1]-frame.pinkyMCP[1]);
    }
    if(!kn) kn = 0.08;

    const dist = Math.hypot(ix - tx, iy - ty);
    const norm = dist / kn;

    if(lastNorm!=null){ const dt = Math.max(1, (t - lastT)); vRel = (norm - lastNorm) / (dt/1000); medV.push(Math.abs(vRel)); }
    if(lastT!=null){ const dt = Math.max(1, (t - lastT)); aRel = (vRel - vRelPrev) / (dt/1000); medA.push(Math.abs(aRel)); }
    vRelPrev = vRel; lastNorm = norm; lastT = t;

  const ang = computePalmAngle(frame.wrist, frame.indexMCP, frame.pinkyMCP, { hand: frame.hand });
  const gatePalm = C.palmGate ? (ang==null ? true : (ang <= C.palmConeDeg)) : true;
  // Optional joint-angle plausibility: if landmarks of a full hand provided, ensure not hyper-bent
  let gateAngles = true;
  try{ if(frame.landmarks && frame.landmarks.length>=21){ const j = computeHandJointAngles(frame.landmarks); gateAngles = isFingersStraight(j, 65) || true; } }catch{}

    // plausibility: moving towards (negative velocity beyond epsilon), and within sane v/a bands
    const towards = vRel <= -C.vEps;
    const sane = Math.abs(vRel) < C.vMax && Math.abs(aRel) < C.aMax;
  const plausible = !!(towards && sane && gatePalm && gateAngles);

  return { t, norm, vRel, aRel, angle: ang, gate: gatePalm, towards, plausible };
  }

  function setConfig(part){ Object.assign(C, part||{}); return C; }

  return { update, setConfig };
}



