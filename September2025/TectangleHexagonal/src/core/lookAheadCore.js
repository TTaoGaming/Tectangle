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

// Pure look-ahead core: predicts fingertip positions along the pinch axis with a configurable lead window.
// Inputs: frames with timestamp `t` (ms) plus raw landmarks for indexTip and thumbTip.
// Outputs: smoothed landmarks, velocities/accelerations, predicted landmarks, and TOI estimates.

import { OneEuro, clamp } from './filters.js';

const identityPoint = [NaN, NaN, NaN];

function makeFilter(config){
  return {
    x: new OneEuro(config),
    y: new OneEuro(config),
    z: new OneEuro(config)
  };
}

function filterPoint(point, filters, t){
  if(!point || !Array.isArray(point)) return identityPoint;
  return [
    filters.x.filter(point[0] ?? 0, t),
    filters.y.filter(point[1] ?? 0, t),
    filters.z.filter(point[2] ?? 0, t)
  ];
}

function diffVec(a, b){ return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }
function addVec(a, b){ return [a[0]+b[0], a[1]+b[1], a[2]+b[2]]; }
function scaleVec(v, s){ return [v[0]*s, v[1]*s, v[2]*s]; }
function magnitude(v){ return Math.hypot(v[0], v[1], v[2]); }
function dot(a,b){ return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }

function solveToZero(distance, velAlong, accAlong){
  if(!isFinite(distance)) return { toiVel: Infinity, toiAccel: Infinity };
  if(!isFinite(velAlong)) velAlong = 0;
  if(!isFinite(accAlong)) accAlong = 0;
  let toiVel = Infinity;
  if(velAlong < -1e-6){ toiVel = distance / -velAlong; }
  let toiAccel = Infinity;
  if(Math.abs(accAlong) < 1e-9){
    if(velAlong < -1e-6){ toiAccel = distance / -velAlong; }
  } else {
    const a = 0.5 * accAlong;
    const b = velAlong;
    const c = distance;
    const disc = b*b - 2*accAlong*c; // derived from s + v*t + 0.5*a*t^2 = 0
    if(disc >= 0){
      const sqrt = Math.sqrt(disc);
      const t1 = (-b - sqrt) / accAlong;
      const t2 = (-b + sqrt) / accAlong;
      const positives = [t1, t2].filter(t => t > 0);
      if(positives.length){ toiAccel = Math.min(...positives); }
    }
  }
  return { toiVel, toiAccel };
}

export function createLookAheadCore(options = {}){
  const cfg = Object.assign({
    leadMs: 120,
    minLeadMs: 0,
    maxLeadMs: 400,
    oneEuro: { minCutoff: 2.0, beta: 0.03, dCutoff: 1.5 },
    accelAlpha: 0.35,
    maxAbsAcceleration: 150
  }, options || {});

  const filtIndex = makeFilter(cfg.oneEuro);
  const filtThumb = makeFilter(cfg.oneEuro);

  let lastT = null;
  let lastSmoothIndex = identityPoint;
  let lastSmoothThumb = identityPoint;
  let lastVelIndex = [0,0,0];
  let lastVelThumb = [0,0,0];
  let lastAccIndex = [0,0,0];
  let lastAccThumb = [0,0,0];
  let initialized = false;

  function projectPoint(smooth, vel, acc, leadSec){
    const vTerm = scaleVec(vel, leadSec);
    const accTermRaw = scaleVec(acc, 0.5 * leadSec * leadSec);
    let accTerm = accTermRaw;
    const accMag = magnitude(acc);
    const maxAcc = Math.max(1, cfg.maxAbsAcceleration || 150);
    if(accMag > maxAcc){
      const scale = maxAcc / accMag;
      accTerm = scaleVec(accTermRaw, scale);
    }
    return addVec(addVec(smooth, vTerm), accTerm);
  }

  function update(frame){
    const { t, indexTip, thumbTip } = frame || {};
    if(!Number.isFinite(t) || !Array.isArray(indexTip) || !Array.isArray(thumbTip)){
      return { ok:false, reason:'invalid-frame', t:null };
    }

    const leadMs = clamp(cfg.leadMs ?? 0, cfg.minLeadMs, cfg.maxLeadMs);
    const leadSec = leadMs / 1000;

    const smoothIndex = filterPoint(indexTip, filtIndex, t);
    const smoothThumb = filterPoint(thumbTip, filtThumb, t);

    if(!initialized){
      const relInit = diffVec(smoothThumb, smoothIndex);
      const distanceInit = magnitude(relInit);
      const directionInit = distanceInit > 1e-9 ? scaleVec(relInit, 1/distanceInit) : [0,0,0];
      lastT = t;
      lastSmoothIndex = smoothIndex;
      lastSmoothThumb = smoothThumb;
      lastVelIndex = [0,0,0];
      lastVelThumb = [0,0,0];
      lastAccIndex = [0,0,0];
      lastAccThumb = [0,0,0];
      initialized = true;
      return {
        ok: true,
        t,
        leadMs,
        raw: { indexTip: [...indexTip], thumbTip: [...thumbTip] },
        smooth: { indexTip: smoothIndex, thumbTip: smoothThumb },
        predicted: { indexTip: smoothIndex, thumbTip: smoothThumb },
        velocity: { indexTip: [0,0,0], thumbTip: [0,0,0], relative: [0,0,0], along: 0 },
        acceleration: { indexTip: [0,0,0], thumbTip: [0,0,0], relative: [0,0,0], along: 0 },
        gap: { now: distanceInit, predicted: distanceInit, delta: 0 },
        toi: { velocityMs: Infinity, accelMs: Infinity, leadSatisfied: false },
        direction: directionInit,
        debug: { predictedRel: relInit, predictedVelAlong: 0, rel: relInit, relVel: [0,0,0], relAcc: [0,0,0] }
      };
    }

    let dt = Math.max(1e-3, (t - lastT) / 1000);
    if(!isFinite(dt) || dt <= 0){ dt = 1/60; }

    const velIndex = scaleVec(diffVec(smoothIndex, lastSmoothIndex), 1/dt);
    const velThumb = scaleVec(diffVec(smoothThumb, lastSmoothThumb), 1/dt);

    const accIndexRaw = scaleVec(diffVec(velIndex, lastVelIndex), 1/dt);
    const accThumbRaw = scaleVec(diffVec(velThumb, lastVelThumb), 1/dt);

    const alpha = clamp(cfg.accelAlpha ?? 0.35, 0, 1);
    const accIndex = addVec(scaleVec(accIndexRaw, alpha), scaleVec(lastAccIndex, 1-alpha));
    const accThumb = addVec(scaleVec(accThumbRaw, alpha), scaleVec(lastAccThumb, 1-alpha));

    const rel = diffVec(smoothThumb, smoothIndex);
    const relVel = diffVec(velThumb, velIndex);
    const relAcc = diffVec(accThumb, accIndex);
    const distance = magnitude(rel);
    const direction = distance > 1e-9 ? scaleVec(rel, 1/distance) : [0,0,0];
    const velAlong = dot(relVel, direction);
    const accAlong = dot(relAcc, direction);

    const { toiVel, toiAccel } = solveToZero(distance, velAlong, accAlong);
    const leadClamped = clamp(leadSec, 0, cfg.maxLeadMs / 1000);

    const predictedIndex = projectPoint(smoothIndex, velIndex, accIndex, leadClamped);
    const predictedThumb = projectPoint(smoothThumb, velThumb, accThumb, leadClamped);
    const predictedRel = diffVec(predictedThumb, predictedIndex);
    const predictedDistanceRaw = magnitude(predictedRel);
    const predictedAlong = dot(predictedRel, direction);
    const predictedDistance = predictedAlong <= 0 ? 0 : predictedDistanceRaw;

    lastT = t;
    lastSmoothIndex = smoothIndex;
    lastSmoothThumb = smoothThumb;
    lastVelIndex = velIndex;
    lastVelThumb = velThumb;
    lastAccIndex = accIndex;
    lastAccThumb = accThumb;

    return {
      ok: true,
      t,
      leadMs,
      raw: { indexTip: [...indexTip], thumbTip: [...thumbTip] },
      smooth: { indexTip: smoothIndex, thumbTip: smoothThumb },
      predicted: { indexTip: predictedIndex, thumbTip: predictedThumb },
      velocity: { indexTip: velIndex, thumbTip: velThumb, relative: relVel, along: velAlong },
      acceleration: { indexTip: accIndex, thumbTip: accThumb, relative: relAcc, along: accAlong },
      gap: { now: distance, predicted: predictedDistance, delta: predictedDistance - distance },
      toi: {
        velocityMs: isFinite(toiVel) ? toiVel * 1000 : Infinity,
        accelMs: isFinite(toiAccel) ? toiAccel * 1000 : Infinity,
        leadSatisfied: leadSec > 0 ? toiVel <= leadSec : false
      },
      direction,
      debug: { predictedRel, predictedDistanceRaw, predictedAlong, predictedVelAlong: velAlong,
        rel,
        relVel,
        relAcc
      }
    };
  }

  function setConfig(part = {}){
    Object.assign(cfg, part);
    return cfg;
  }

  function getState(){
    return {
      t: lastT,
      leadMs: cfg.leadMs,
      lastSmoothIndex,
      lastSmoothThumb,
      lastVelIndex,
      lastVelThumb,
      lastAccIndex,
      lastAccThumb
    };
  }

  return { update, setConfig, getState };
}




