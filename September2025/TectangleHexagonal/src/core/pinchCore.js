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

// NOTE (Hexagonal): This core stays domain-only (no DOM/network). TOI prediction currently lives here
// for simplicity; consider injecting predictors via src/ports/toiPort.js to isolate strategy/calibration.
import { RollingMedian, OneEuro, clamp } from './filters.js';
import { computePalmAngle } from './handGeometry.js';

export class Emitter { constructor(){ this.s=new Set(); } on(h){ this.s.add(h); return ()=>this.s.delete(h); } emit(e){ this.s.forEach(h=>h(e)); } }

// Pure pinch core: no DOM access. Takes frames with t and landmarks; emits pinch events.
export function createPinchCore(cfg={}){
  // EMBER:FS-2025-021:WARM: Speculative down may fire when toiV in [-40,120]ms; check cancel rate
  const C = Object.assign({
    palmConeDeg: 30,
    palmGate: true,
  enterThresh: 0.50,
  exitThresh:  0.72,
  enterDebounceMs: 0,
  exitDebounceMs: 40,
    holdTickMs: 200,
    autoReleaseMs: 5000,
    enableSpeculative: true,
    holdDeadzoneEnabled: false,
    holdDeadzoneNorm: 0.0,
  // Low-latency OneEuro defaults (tunable via UI):
  // Balanced: minCutoff 1.4, beta 0.02, dCutoff 1.0
  oneEuro: { minCutoff:1.6, beta:0.03, dCutoff:1.0 },
  fixedKnuckleSpan: null,
  minKnuckleSpan: 0.08,
  // WEBWAY:ww-2025-005: span EMA + clamp configuration
  spanEmaEnabled: true,
  spanEmaTauMs: 300,            // time-constant for EMA (proven pattern: alpha = 1 - exp(-dt/tau))
  knuckleSpanFloorRatio: 0.75,  // clamp floor relative to median
  knuckleSpanCeilRatio: 1.25,   // clamp ceil relative to median
  // Optional anatomical scale assumption for absolute distance estimation (adult palm width approx.)
  anatomicalKnuckleSpanCm: 8.0,   // assumed indexMCP???pinkyMCP span in centimeters
  anatomicalToleranceCm: 1.5      // tolerance around the assumed span
  }, cfg);

  const emitter = new Emitter();
  let state='Idle', lastDown=0, speculative=false, holdTimer=0;
  let holdAnchorNorm=null; // WEBWAY:ww-2025-003: anchor norm captured on down/confirm
  let enterDebounceStart=0, exitDebounceStart=0;
  let releaseConfirmDeadline=0; // confirm window deadline after arming
  const filt = { ix:new OneEuro(C.oneEuro), iy:new OneEuro(C.oneEuro), iz:new OneEuro(C.oneEuro), tx:new OneEuro(C.oneEuro), ty:new OneEuro(C.oneEuro), tz:new OneEuro(C.oneEuro) };
  const velocityMedian = new RollingMedian(30), accelMedian = new RollingMedian(30);
  let lastNorm=null, lastT=null, vRel=0, vRelPrev=0, aRel=0;
  let toiActualStopAbs=null; // actual TOI when approach stops (v crosses 0 or reverses)
  let lastNormForCross=null, lastTForCross=null; // for crossing interpolation
  // WEBWAY:ww-2025-005: EMA + median clamp buffers
  let knEma = null; let lastKnT = null;
  const knMedianWin = new RollingMedian(90);
  let knStable = C.fixedKnuckleSpan != null ? C.fixedKnuckleSpan : C.minKnuckleSpan;

  function palmOk(hand, wrist, indexMCP, pinkyMCP){
    if(!C.palmGate) return true;
    const ang = computePalmAngle(wrist, indexMCP, pinkyMCP, { hand });
    // Require measurable palm angle; if joints missing, gate is false
    return ang!=null && (ang <= C.palmConeDeg);
  }
  // EMBER:FS-2025-022:COLD: Palm gate cone default 30?? seems adequate per unit + e2e

  function update(frame){
    const t=frame.t;
    const ixRaw=frame.indexTip[0], iyRaw=frame.indexTip[1], izRaw=frame.indexTip[2]||0;
    const txRaw=frame.thumbTip[0], tyRaw=frame.thumbTip[1], tzRaw=frame.thumbTip[2]||0;
  const ix=filt.ix.filter(ixRaw,t), iy=filt.iy.filter(iyRaw,t), iz=filt.iz.filter(izRaw,t);
    const tx=filt.tx.filter(txRaw,t), ty=filt.ty.filter(tyRaw,t), tz=filt.tz.filter(tzRaw,t);

    // Require knuckle span: fixed override OR MCP distance → EMA → median clamp
    let kn = C.fixedKnuckleSpan;
    let knRaw = null;
    if(!kn && frame.indexMCP && frame.pinkyMCP){
      knRaw = Math.hypot(frame.indexMCP[0]-frame.pinkyMCP[0], frame.indexMCP[1]-frame.pinkyMCP[1]);
      if(isFinite(knRaw) && knRaw > 1e-6){ knMedianWin.push(knRaw); }
      if(C.spanEmaEnabled){
        const dt = (lastKnT!=null)? Math.max(1, t - lastKnT) : 16;
        const tau = Math.max(1, C.spanEmaTauMs||300);
        const alpha = 1 - Math.exp(-dt / tau);
        knEma = (knEma==null || !isFinite(knEma)) ? knRaw : (knEma + alpha * ((knRaw ?? knEma) - knEma));
        lastKnT = t;
        // Clamp EMA using rolling median bounds when available
        const med = knMedianWin.med;
        const floorRatio = (typeof C.knuckleSpanFloorRatio==='number' && C.knuckleSpanFloorRatio>0 && C.knuckleSpanFloorRatio<1) ? C.knuckleSpanFloorRatio : 0.75;
        const ceilRatio  = (typeof C.knuckleSpanCeilRatio==='number'  && C.knuckleSpanCeilRatio>1) ? C.knuckleSpanCeilRatio : 1.25;
        const floor = Math.max(C.minKnuckleSpan, isFinite(med)? med*floorRatio : C.minKnuckleSpan);
        const ceil  = isFinite(med)? (med*ceilRatio) : Infinity;
        const knClamped = clamp(knEma ?? knRaw ?? C.minKnuckleSpan, floor, ceil);
        kn = knClamped;
        // Keep a conservative stable reference for debug
        if(!isFinite(knStable) || knStable == null) knStable = C.minKnuckleSpan;
        knStable = Math.max(knStable, isFinite(knRaw)? knRaw : kn);
      } else {
        // Legacy smoothing: fallback to raw
        kn = knRaw;
      }
    }
    const knOk = !!kn && isFinite(kn) && kn > 1e-6;
    // If knuckle span missing, do not progress state; return diagnostics only
    if(!knOk){
      const palmAngleDeg = computePalmAngle(frame.wrist, frame.indexMCP, frame.pinkyMCP, { hand: frame.hand });
      const landmarksRaw = {
        index: { mcp: frame.indexMCP||null, pip: frame.indexPIP||null, dip: frame.indexDIP||null, tip: frame.indexTip||null },
        thumb: { cmc: frame.thumbCMC||null, mcp: frame.thumbMCP||null, ip: frame.thumbIP||null, tip: frame.thumbTip||null }
      };
      return {
        state,
        norm: null, rawNorm: null,
        gate: false, isGated: false, palmAngleDeg,
        vRel: 0, aRel: 0,
        ang: palmAngleDeg,
        toi: null, toiA: null, toiPredAbsV: null, toiPredAbsA: null, toiActualStopAbs: null,
        normalizedGap: null, rawNormalizedGap: null,
        pinchVelocity: 0, pinchAcceleration: 0,
        msToTouchVel: null, msToTouchAccel: null,
        predictedEnterTimeMsVel: null, predictedEnterTimeMsAccel: null,
        approachStopTimeMs: null,
        thresholds: { enter: C.enterThresh, exit: C.exitThresh },
        abs: { distCm: null, distRangeCm: { min: null, max: null }, knuckleSpanCm: C.anatomicalKnuckleSpanCm, toleranceCm: C.anatomicalToleranceCm },
        landmarksRaw,
        debug: { knMissing: true, knStable, knEma, knMedian: knMedianWin.med }
      };
    }

  const rawDist = Math.hypot(ixRaw-txRaw, iyRaw-tyRaw); const rawNorm = rawDist/kn;
  const smDist = Math.hypot(ix-tx, iy-ty); const norm = smDist/kn;
  // Keep previous velocity/time to detect zero-crossings
  const prevV = vRel; const prevVT = lastT;
  if(lastNorm!=null){ const dt=Math.max(1,(t-lastT)); vRel=(norm-lastNorm)/(dt/1000); velocityMedian.push(Math.abs(vRel)); }
  if(lastT!=null){ const dt=Math.max(1,(t-lastT)); aRel=(vRel - vRelPrev)/(dt/1000); accelMedian.push(Math.abs(aRel)); }
    vRelPrev=vRel; lastNorm=norm; lastT=t;
  // retain previous sample for crossing interpolation
  const prevNormForCross = lastNormForCross;
  const prevTForCross = lastTForCross;
  lastNormForCross = norm;
  lastTForCross = t;

  const kinOk = Math.abs(vRel) < 3*(velocityMedian.med||1)+3 && Math.abs(aRel) < 5*(accelMedian.med||1)+5;
  const palmAngleDeg = computePalmAngle(frame.wrist, frame.indexMCP, frame.pinkyMCP, { hand: frame.hand });
  const isGated = palmOk(frame.hand, frame.wrist, frame.indexMCP, frame.pinkyMCP) && kinOk;
  // Legacy names kept for compatibility with existing UI/telemetry
  const ang = palmAngleDeg;
  const gate = isGated;

    // Actual TOI (stop): detect v crossing from negative (approach) to >= 0; interpolate zero time
    if(prevV!=null && prevVT!=null && toiActualStopAbs==null){
      if(prevV < 0 && vRel >= 0){
        const dt = Math.max(1, t - prevVT);
        const dv = vRel - prevV;
        const frac = (Math.abs(dv) < 1e-9) ? 1 : (-prevV) / dv; // when v = 0 between prevVT..t
        const tz = Math.round(prevVT + Math.max(0, Math.min(1, frac)) * dt);
        toiActualStopAbs = tz;
        emitter.emit({ type:'pinch:toiActualStop', t: tz });
      }
    }

  // TOI estimates
  // To zero (touch) ??? physics-based; reported as absolute time later
  const toiV = (vRel < 0 && Math.abs(vRel) > 1e-6) ? (norm/Math.abs(vRel))*1000 : Infinity; // ms to zero
  const s = norm; // distance to zero (normalized)
  let toiA = Infinity;
  if(vRel < 0 && isFinite(aRel)){
    const a = aRel; const v = vRel; const disc = v*v - 2*a*s; // solving 0.5*a*t^2 + v*t + s = 0
    if(Math.abs(a) < 1e-6){ if(Math.abs(v)>1e-6) toiA = (s/Math.abs(v))*1000; }
    else if(disc >= 0){
      const t1 = (-v - Math.sqrt(disc)) / a; const t2 = (-v + Math.sqrt(disc)) / a;
      const cand = [t1, t2].filter(t=> t>0);
      if(cand.length) toiA = Math.min(...cand)*1000;
    }
  }
  // Predicted time to ENTER threshold (absolute)
    const sEnter = Math.max(0, norm - C.enterThresh);
    const etaEnterV = (vRel < 0 && Math.abs(vRel) > 1e-6) ? (sEnter/Math.abs(vRel))*1000 : Infinity;
    let etaEnterA = Infinity;
    if(vRel < 0 && isFinite(aRel)){
      const a = aRel; const v = vRel; const discE = v*v - 2*a*sEnter; // 0.5*a*t^2 + v*t - sEnter = 0
      if(Math.abs(a) < 1e-6){ if(Math.abs(v)>1e-6) etaEnterA = (sEnter/Math.abs(v))*1000; }
      else if(discE >= 0){ const t1 = (-v - Math.sqrt(discE)) / a; const t2 = (-v + Math.sqrt(discE)) / a; const cand = [t1,t2].filter(t=> t>0); if(cand.length) etaEnterA = Math.min(...cand)*1000; }
    }
  const toiPredAbsV = isFinite(etaEnterV) ? (t + etaEnterV) : null;
  const toiPredAbsA = isFinite(etaEnterA) ? (t + etaEnterA) : null;
    const allowSpec = C.enableSpeculative && isGated && toiV<120 && toiV>-40;

    // Crossing interpolation helper (previous sample -> current sample)
    function interpolateCross(prevT, prevN, currT, currN, target){
      const dn = currN - prevN; const dt = currT - prevT; if(Math.abs(dn) < 1e-9 || Math.abs(dt) < 1e-6) return t;
      const alpha = (target - prevN) / dn; const a = Math.max(0, Math.min(1, alpha)); return Math.round(prevT + a*dt);
    }

  switch(state){
    case 'Idle':
  if(isGated && norm < C.enterThresh){
      if(C.enterDebounceMs>0){ if(enterDebounceStart===0) enterDebounceStart=t; if(t - enterDebounceStart < C.enterDebounceMs) break; }
          if(C.enableSpeculative && allowSpec){
            // Speculative: emit down with predicted absolute TOI to ENTER
            speculative=true; emitter.emit({type:'pinch:down', t, speculative:true, toiPredAbsV: toiPredAbsV, toiPredAbsA: toiPredAbsA, toiZeroAbsV: isFinite(toiV)? (t+toiV): null, toiZeroAbsA: isFinite(toiA)? (t+toiA): null, norm, rawNorm, normalizedGap: norm, rawNormalizedGap: rawNorm, vRel, aRel, ang, palmAngleDeg: ang });
            state='PrePinch';
          } else {
            // Non-speculative down (crossed without pre-arm). Include actual ENTER crossing via interpolation.
            const tCross = (prevTForCross!=null && prevNormForCross!=null)
              ? interpolateCross(prevTForCross, prevNormForCross, t, norm, C.enterThresh)
              : t;
            speculative=false; emitter.emit({type:'pinch:down', t, speculative:false, toiActualEnterAbs: tCross, toiPredAbsV, toiPredAbsA, norm, rawNorm, normalizedGap: norm, rawNormalizedGap: rawNorm, vRel, aRel, ang, palmAngleDeg: ang });
            state='Pinched';
          }
          lastDown=t; holdTimer=t; enterDebounceStart=0; toiActualStopAbs=null; holdAnchorNorm = norm;
        } else { enterDebounceStart=0; }
        break;
      case 'PrePinch':
  if(!isGated){ if(speculative){ emitter.emit({type:'pinch:cancel', t, norm, rawNorm, normalizedGap: norm, rawNormalizedGap: rawNorm, vRel, aRel, ang, palmAngleDeg: ang }); } speculative=false; state='Idle'; break; }
  if(norm < C.enterThresh){
          const tCross = (prevTForCross!=null && prevNormForCross!=null)
            ? interpolateCross(prevTForCross, prevNormForCross, t, norm, C.enterThresh)
            : t;
          if(speculative){ emitter.emit({ type:'pinch:confirm', t, toiActualEnterAbs: tCross, norm, rawNorm, normalizedGap: norm, rawNormalizedGap: rawNorm, vRel, aRel, ang, palmAngleDeg: ang }); }
          if(!speculative){ emitter.emit({type:'pinch:down', t, speculative:false, toiActualEnterAbs: tCross, toiPredAbsV, toiPredAbsA, norm, rawNorm, normalizedGap: norm, rawNormalizedGap: rawNorm, vRel, aRel, ang, palmAngleDeg: ang }); }
          speculative=false; state='Pinched'; holdAnchorNorm = norm;
        }
        else if(t - lastDown > 120){ if(speculative){ emitter.emit({type:'pinch:cancel', t}); } speculative=false; state='Idle'; }
        break;
  case 'Pinched':
  if (C.holdTickMs>0 && t - holdTimer > C.holdTickMs){ emitter.emit({ type:'pinch:hold', t, dur: t - lastDown, norm, rawNorm, normalizedGap: norm, rawNormalizedGap: rawNorm, vRel, aRel, ang, palmAngleDeg: ang }); holdTimer = t; }
    // Deadzone-aware exit: require norm > max(exitThresh, holdAnchorNorm + holdDeadzone) if enabled.
    const dz = (C.holdDeadzoneEnabled && isFinite(C.holdDeadzoneNorm) && C.holdDeadzoneNorm>0) ? C.holdDeadzoneNorm : 0;
    const exitReq = (holdAnchorNorm!=null) ? Math.max(C.exitThresh, holdAnchorNorm + dz) : C.exitThresh;
    if(norm > exitReq){
      if(C.exitDebounceMs>0){
    if(exitDebounceStart===0) exitDebounceStart=t; if(t - exitDebounceStart >= C.exitDebounceMs){ state='ReleasePending'; exitDebounceStart=0; releaseConfirmDeadline = t + 60; }
          } else {
  emitter.emit({type:'pinch:up', t, norm, rawNorm, normalizedGap: norm, rawNormalizedGap: rawNorm, vRel, aRel, ang, palmAngleDeg: ang }); state='Idle'; holdAnchorNorm=null;
          }
        }
  if(t - lastDown > C.autoReleaseMs){ emitter.emit({type:'pinch:up', t, norm, rawNorm, normalizedGap: norm, rawNormalizedGap: rawNorm, vRel, aRel, ang, palmAngleDeg: ang }); state='Idle'; holdAnchorNorm=null; }
        break;
  case 'ReleasePending':
  if(norm > C.exitThresh){ emitter.emit({type:'pinch:up', t, norm, rawNorm, normalizedGap: norm, rawNormalizedGap: rawNorm, vRel, aRel, ang, palmAngleDeg: ang }); state='Idle'; holdAnchorNorm=null; }
    else if(t <= releaseConfirmDeadline){ /* stay pending during confirm window */ }
    else { state='Pinched'; }
        break;
    }

  // NOTE: Hexagonal reminder: This core is domain-only. Do not import DOM or network here. Keep ports in ../ports.

  // Expose additional raw landmarks for joint-angle calculations (if provided by frame)
  const landmarksRaw = {
      index: {
        mcp: frame.indexMCP || null,
        pip: frame.indexPIP || null,
        dip: frame.indexDIP || null,
        tip: frame.indexTip || null,
      },
      thumb: {
        cmc: frame.thumbCMC || null,
        mcp: frame.thumbMCP || null,
        ip:  frame.thumbIP  || null,
        tip: frame.thumbTip || null,
      }
  };

  // Absolute distance estimates (in cm) assuming average adult knuckle span ~8 ?? 1.5 cm.
  // This does NOT change any thresholds; it is informational for telemetry/UX.
  const absDistCm = norm * C.anatomicalKnuckleSpanCm;
  const absDistCmMin = Math.max(0, norm * (C.anatomicalKnuckleSpanCm - C.anatomicalToleranceCm));
  const absDistCmMax = Math.max(absDistCmMin, norm * (C.anatomicalKnuckleSpanCm + C.anatomicalToleranceCm));

  return {
  // Original fields (kept for compatibility)
  state, norm, rawNorm, gate, vRel, aRel, ang,
      toi: toiV, toiA, toiPredAbsV, toiPredAbsA, toiActualStopAbs,

      // Human-friendly aliases (preferred for new code)
      normalizedGap: norm,
      rawNormalizedGap: rawNorm,
  isGated: gate,
  palmAngleDeg: ang,
      pinchVelocity: vRel,
      pinchAcceleration: aRel,
      msToTouchVel: toiV,
      msToTouchAccel: toiA,
      predictedEnterTimeMsVel: toiPredAbsV,
      predictedEnterTimeMsAccel: toiPredAbsA,
      approachStopTimeMs: toiActualStopAbs,
      thresholds: { enter: C.enterThresh, exit: C.exitThresh },

      abs: { distCm: absDistCm, distRangeCm: { min: absDistCmMin, max: absDistCmMax }, knuckleSpanCm: C.anatomicalKnuckleSpanCm, toleranceCm: C.anatomicalToleranceCm },
      landmarksRaw,
      debug: { ixRaw, iyRaw, izRaw, txRaw, tyRaw, tzRaw, ixSm:ix, iySm:iy, izSm:iz, txSm:tx, tySm:ty, tzSm:tz, landmarksRaw, absDistCm, absDistCmMin, absDistCmMax, knStable }
  };
  }

  function setConfig(part){ Object.assign(C, part||{}); return C; }
  function getState(){ return { state, lastDown, speculative, enterThresh: C.enterThresh, exitThresh: C.exitThresh, palmGate: C.palmGate }; }

  return { update, on: h=>emitter.on(h), setConfig, getState };
}









