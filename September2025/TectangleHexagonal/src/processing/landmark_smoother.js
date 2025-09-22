// Landmark smoothing using OneEuro per keypoint axis
// Contract:
// - createLandmarkSmoother({ numHands=2, oneEuro:{minCutoff,beta,dCutoff} })
// - push({ t:number, hands:[ [{x,y,z},...21], ... ], width:number, height:number }) => returns smoothed hands

import { OneEuro } from '../core/filters.js';

export function createLandmarkSmoother(config) {
  const cfg = Object.assign({ numHands: 2, oneEuro: { minCutoff: 1.6, beta: 0.03, dCutoff: 1.0 } }, config || {});
  // State: filters[key:string][pointIndex] = { x:OneEuro, y:OneEuro, z:OneEuro }
  const filters = new Map();

  function ensure(key, pointIdx) {
    if (!filters.has(key)) filters.set(key, new Map());
    const map = filters.get(key);
    if (!map.has(pointIdx)) map.set(pointIdx, {
      x: new OneEuro(cfg.oneEuro), y: new OneEuro(cfg.oneEuro), z: new OneEuro(cfg.oneEuro)
    });
    return map.get(pointIdx);
  }

  // sample.keys optional: array of stable keys for each hand; if absent, falls back to index-based keys
  function push(sample) {
    const t = sample.t || performance.now();
    const out = [];
    const hands = sample.hands || [];
    const keys = Array.isArray(sample.keys) ? sample.keys : null;
    for (let hi = 0; hi < hands.length; hi++) {
      const key = keys && keys[hi] ? String(keys[hi]) : `idx:${hi}`;
      const hand = hands[hi] || [];
      const arr = new Array(hand.length);
      for (let pi = 0; pi < hand.length; pi++) {
        const p = hand[pi];
        if (!p) { arr[pi] = null; continue; }
        const f = ensure(key, pi);
        arr[pi] = {
          x: f.x.filter(p.x, t),
          y: f.y.filter(p.y, t),
          z: f.z.filter(p.z ?? 0, t)
        };
      }
      out.push(arr);
    }
    return out;
  }

  return { push };
}
