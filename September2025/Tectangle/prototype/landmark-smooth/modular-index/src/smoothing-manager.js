// smoothing-manager.js
// OneEuroFilter + SmoothingManager
// Minimal, browser-native port of the One-Euro smoothing used in the reference prototype.

export class OneEuroFilter {
  constructor(opts = {}) {
    const { minCutoff = 1.0, beta = 0.007, dCutoff = 1.0 } = opts || {};
    this.minCutoff = Number(minCutoff);
    this.beta = Number(beta);
    this.dCutoff = Number(dCutoff);
    this._x = null;
    this._dx = 0;
    this._t = null;
    this._prevRaw = null;
  }
  static _alpha(cutoff, dt) {
    const tau = 1 / (2 * Math.PI * cutoff);
    return 1 / (1 + tau / dt);
  }
  filter(value, tMs) {
    const v = Number(value ?? 0);
    const t = Number(tMs ?? Date.now());
    if (this._t === null) {
      this._x = v;
      this._dx = 0;
      this._t = t;
      this._prevRaw = v;
      return v;
    }
    let dt = (t - this._t) / 1000;
    if (!(isFinite(dt) && dt > 0)) dt = 1 / 60;
    const rawPrev = Number(this._prevRaw ?? this._x);
    const dx = (v - rawPrev) / dt;
    const aD = OneEuroFilter._alpha(Math.max(1e-6, this.dCutoff), dt);
    const dxHat = aD * dx + (1 - aD) * this._dx;
    const cutoff = this.minCutoff + this.beta * Math.abs(dxHat);
    const a = OneEuroFilter._alpha(Math.max(1e-6, cutoff), dt);
    const xHat = a * v + (1 - a) * this._x;
    this._x = xHat;
    this._dx = dxHat;
    this._prevRaw = v;
    this._t = t;
    return xHat;
  }
  reset() {
    this._x = null;
    this._dx = 0;
    this._t = null;
    this._prevRaw = null;
  }
  setParams({ minCutoff, beta, dCutoff } = {}) {
    if (minCutoff !== undefined) this.minCutoff = Number(minCutoff);
    if (beta !== undefined) this.beta = Number(beta);
    if (dCutoff !== undefined) this.dCutoff = Number(dCutoff);
  }
}

export class SmoothingManager {
  constructor(params = {}) {
    this.params = {
      minCutoff: params.minCutoff ?? 1.0,
      beta: params.beta ?? 0.007,
      dCutoff: params.dCutoff ?? 1.0,
    };
    // filters[handIndex][landmarkIndex] = {x:OneEuroFilter,y:...,z:...}
    this.filters = [];
  }
  setParams(p = {}) {
    this.params = { ...this.params, ...p };
    // Reset so new filters pick up new params
    this.reset();
  }
  reset() {
    this.filters = [];
  }
  // rawMulti: array of hands -> array of landmarks {x,y,z}
  apply(rawMulti = [], tMs = Date.now()) {
    const out = [];
    const numHands = Array.isArray(rawMulti) ? rawMulti.length : 0;
    for (let h = 0; h < numHands; h++) {
      const pts = rawMulti[h] || [];
      // ensure filters exist for this hand
      if (!this.filters[h] || this.filters[h].length !== pts.length) {
        this.filters[h] = [];
        for (let i = 0; i < pts.length; i++) {
          const p = this.params;
          this.filters[h].push({
            x: new OneEuroFilter(p),
            y: new OneEuroFilter(p),
            z: new OneEuroFilter(p),
          });
        }
      }
      const sm = [];
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i] || { x: 0, y: 0, z: 0 };
        const f = this.filters[h][i];
        const sx = f.x.filter(p.x, tMs);
        const sy = f.y.filter(p.y, tMs);
        const sz = f.z.filter(p.z, tMs);
        sm.push({ x: sx, y: sy, z: sz });
      }
      out.push(sm);
    }
    // trim filters if fewer hands than before
    if (this.filters.length > numHands) this.filters.length = numHands;
    return out;
  }
}

// TODO: Replace with KaIman / velocity-aware multi-hand predictor later.