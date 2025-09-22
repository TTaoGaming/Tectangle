// OneEuro filter (Kalousis, Casiez et al.) implemented for deterministic frame-timestamped inputs
// Reference parameters: minCutoff (Hz), beta, dCutoff (Hz)

export class OneEuroFilter {
  constructor(opts = {}) {
    const { minCutoff = 1.0, beta = 0.0, dCutoff = 1.0 } = opts || {};
    this.minCutoff = Number(minCutoff);
    this.beta = Number(beta);
    this.dCutoff = Number(dCutoff);
    this._x = null; // last filtered value
    this._dx = 0; // last filtered derivative
    this._t = null; // last timestamp (ms)
    this._prevRaw = null; // last raw value (for derivative)
  }

  static _alpha(cutoff, dt) {
    const c = Math.max(1e-6, Number(cutoff));
    const tau = 1 / (2 * Math.PI * c);
    return 1 / (1 + tau / dt);
  }

  filter(value, tMs) {
    const v = Number(value ?? 0);
    const t = Number(tMs);
    if (!Number.isFinite(t)) throw new Error('OneEuroFilter.filter requires numeric timestampMs');

    if (this._t === null) {
      this._x = v;
      this._dx = 0;
      this._t = t;
      this._prevRaw = v;
      return v; // initialize with first sample
    }

    let dt = (t - this._t) / 1000; // seconds
    if (!(isFinite(dt) && dt > 0)) dt = 1 / 60; // fallback

    const rawPrev = Number(this._prevRaw ?? this._x);
    const dx = (v - rawPrev) / dt;

    const aD = OneEuroFilter._alpha(this.dCutoff, dt);
    const dxHat = aD * dx + (1 - aD) * this._dx;

    const cutoff = this.minCutoff + this.beta * Math.abs(dxHat);
    const a = OneEuroFilter._alpha(cutoff, dt);
    const xHat = a * v + (1 - a) * this._x;

    // commit state
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
}

export const OneEuroPresets = {
  Responsive: { minCutoff: 5.0, beta: 0.1, dCutoff: 1.0 },
  Balanced: { minCutoff: 1.5, beta: 0.03, dCutoff: 1.0 },
  Smooth: { minCutoff: 0.3, beta: 0.005, dCutoff: 1.0 },
};
