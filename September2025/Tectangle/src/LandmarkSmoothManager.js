/* EARS_HEADER_START
TLDR: LandmarkSmoothManager — apply per-keypoint One Euro smoothing to canonical landmark:raw events and publish landmark:smoothed for downstream tracking.

Responsibilities:
- Subscribe (when instantiated) to `landmark:raw` envelopes from EventBus.
- Produce temporally-smoothed landmark sequences using One Euro per keypoint (configurable params).
- Emit canonical `landmark:smoothed` envelopes containing smoothed landmarks, frameId, timestamp, width, height, and meta (smoothing params).
- Expose runtime config (alpha, enableOneEuro, oneEuroParams, maxNumHands, maxLandmarks) and a setConfig API.
- Keep module pure (no top-level instantiation).

HEADER_META_START
{
  "name": "LandmarkSmoothManager",
  "tldr": "OneEuro-only smoothing manager — per-keypoint One Euro filters; publishes canonical `landmark:smoothed` for downstream managers.",
  "version": "0.1.0",
  "configDefaults": {
    "alpha": 0.4,
    "maxNumHands": 2,
    "maxLandmarks": 21,
    "enableOneEuro": true,
    "oneEuroParams": { "minCutoff": 0.01, "beta": 0.0, "dCutoff": 1.0 }
  },
  "notes": "This manager focuses solely on One Euro filtering. Kalman and kinematic clamps have been moved to dedicated managers. Use setConfig to tune oneEuro params."
}
HEADER_META_END
EARS_HEADER_END */

import defaultEventBus from "./EventBusManager.js";

/* Inlined OneEuroFilter (per-scalar) — self-contained in LandmarkSmoothManager */
class OneEuroFilter {
  constructor(opts = {}) {
    const { minCutoff = 1.0, beta = 0.007, dCutoff = 1.0 } = opts || {};
    this.minCutoff = Number(minCutoff);
    this.beta = Number(beta);
    this.dCutoff = Number(dCutoff);
    this._x = null; // previous filtered value
    this._dx = 0; // previous filtered derivative (filtered d)
    this._t = null; // last timestamp (ms)
    this._prevRaw = null; // previous raw measurement (for derivative)
  }

  static _alpha(cutoff, dt) {
    // dt in seconds, cutoff in Hz
    const tau = 1 / (2 * Math.PI * cutoff);
    return 1 / (1 + tau / dt);
  }

  filter(value, tMs) {
    const v = Number(value ?? 0);
    const t = Number(tMs ?? Date.now());
    if (this._t === null) {
      // warm-start both filtered value and previous raw sample to avoid first-frame transients
      this._x = v;
      this._dx = 0;
      this._t = t;
      this._prevRaw = v;
      return v;
    }

    let dt = (t - this._t) / 1000;
    if (!(isFinite(dt) && dt > 0)) dt = 1 / 60;

    // raw-derivative using previous raw measurement (helps avoid overshoot on initialization)
    const rawPrev = Number(this._prevRaw ?? this._x);
    const dx = (v - rawPrev) / dt;

    // low-pass derivative
    const aD = OneEuroFilter._alpha(Math.max(1e-6, this.dCutoff), dt);
    const dxHat = aD * dx + (1 - aD) * this._dx;

    // adaptive cutoff
    const cutoff = this.minCutoff + this.beta * Math.abs(dxHat);
    const a = OneEuroFilter._alpha(Math.max(1e-6, cutoff), dt);

    // low-pass value
    const xHat = a * v + (1 - a) * this._x;

    // stash state
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
  }
}

/**
 * LandmarkSmoothManager
 *
 * Purpose:
 *  - Provide a stable, smoothed canonical landmark stream for downstream tracking.
 *
 * Constructor options:
 *  - eventBus: EventBus instance (default imported EventBus)
 *  - alpha: legacy alpha (kept for compatibility)
 *  - maxNumHands: number
 *  - maxLandmarks: number
 *  - enableOneEuro: boolean
 *  - oneEuroParams: {minCutoff,beta,dCutoff}
 *
 * Public events:
 *  - Emits 'landmark:smoothed' via EventBus with canonical payload:
 *      { landmarks: [[x,y,z],...], frameId, timestamp, width, height, meta: { source:'smoothed', alpha, modes } }
 */

const ONE_EURO_PRESETS = {
  Responsive: { minCutoff: 5.0, beta: 0.1, dCutoff: 1.0 },
  Balanced: { minCutoff: 1.5, beta: 0.03, dCutoff: 1.0 },
  Smooth: { minCutoff: 0.3, beta: 0.005, dCutoff: 1.0 },
};

export default class LandmarkSmoothManager {
  constructor(options = {}) {
    const {
      eventBus,
      alpha = 0.4,
      maxNumHands = 2,
      maxLandmarks = 21,
      enableOneEuro = true,
      oneEuroParams = {},
    } = options || {};

    this._eventBus = eventBus || defaultEventBus;
    this._alpha = Number(alpha) || 0.4;
    this._maxNumHands = Math.min(Math.max(1, Number(maxNumHands) || 2), 4);
    this._maxLandmarks = Number(maxLandmarks) || 21;

    this._enableOneEuro = !!enableOneEuro;
    this._oneEuroParams = Object.assign(
      { minCutoff: 0.01, beta: 0.0, dCutoff: 1.0 },
      oneEuroParams || {}
    );

    // internal filter state (per-hand)
    this._filters = []; // [handIndex] => { landmarkFilters: [{x,y,z}], lastT }
    this._prevSmoothed = []; // per-hand previous smoothed landmarks
    this._listener = null;
    this._running = false;
  }

  /**
   * start() — begin listening to landmark:raw events
   * Returns: { ok: true }
   */
  static get PRESETS() {
    return ONE_EURO_PRESETS;
  }

  start() {
    if (this._running) return { ok: true };
    this._listener = this._eventBus.addEventListener("landmark:raw", (env) =>
      this.handleRaw(env && env.detail ? env.detail : env)
    );
    this._running = true;
    return { ok: true };
  }

  /**
   * stop() — stop listening
   */
  stop() {
    try {
      if (this._listener) this._listener();
    } catch (e) {
      // ignore
    }
    this._listener = null;
    this._running = false;
    this._prevSmoothed = [];
    this._filters = [];
  }

  /**
   * setConfig(cfg) — merge runtime config and apply
   */
  setConfig(cfg = {}) {
    if ("alpha" in cfg) this._alpha = Number(cfg.alpha) || this._alpha;
    if ("maxNumHands" in cfg)
      this._maxNumHands = Math.min(
        Math.max(1, Number(cfg.maxNumHands) || this._maxNumHands),
        4
      );
    if ("maxLandmarks" in cfg)
      this._maxLandmarks = Number(cfg.maxLandmarks) || this._maxLandmarks;

    // One Euro params (legacy shape: cfg.oneEuro)
    if (cfg.oneEuro && typeof cfg.oneEuro === "object") {
      const o = cfg.oneEuro;
      if ("minCutoff" in o)
        this._oneEuroParams.minCutoff =
          Number(o.minCutoff) || this._oneEuroParams.minCutoff;
      if ("beta" in o)
        this._oneEuroParams.beta = Number(o.beta) || this._oneEuroParams.beta;
      if ("dCutoff" in o)
        this._oneEuroParams.dCutoff =
          Number(o.dCutoff) || this._oneEuroParams.dCutoff;
    }

    // Support top-level oneEuroParams key
    if (cfg.oneEuroParams && typeof cfg.oneEuroParams === "object") {
      const p = cfg.oneEuroParams;
      if ("minCutoff" in p)
        this._oneEuroParams.minCutoff =
          Number(p.minCutoff) || this._oneEuroParams.minCutoff;
      if ("beta" in p)
        this._oneEuroParams.beta = Number(p.beta) || this._oneEuroParams.beta;
      if ("dCutoff" in p)
        this._oneEuroParams.dCutoff =
          Number(p.dCutoff) || this._oneEuroParams.dCutoff;
    }

    // no need to publish config echo here — upstream landmark manager handles echoes
  }

  /**
   * setPreset(presetName) — apply named One-Euro preset and reset filters so it takes effect immediately.
   * Validates presetName exists, copies values into this._oneEuroParams and clears internal filter state.
   */
  setPreset(presetName) {
    if (!presetName || !ONE_EURO_PRESETS[presetName]) {
      throw new Error("Unknown preset: " + String(presetName));
    }
    const p = ONE_EURO_PRESETS[presetName];
    this._oneEuroParams = {
      minCutoff: Number(p.minCutoff),
      beta: Number(p.beta),
      dCutoff: Number(p.dCutoff),
    };
    // Reset internal filters so new params apply immediately
    this._filters = [];
    this._prevSmoothed = [];
  }

  /**
   * handleRaw(rawPayload)
   *  - rawPayload: { landmarks: [[x,y,z],...], frameId, timestamp, width, height, config }
   *  - Performs OneEuro smoothing and publishes landmark:smoothed
   */
  handleRaw(raw) {
    if (!raw || !Array.isArray(raw.landmarks)) {
      // publish empty smoothed envelope to preserve contract
      this._eventBus.publish("landmark:smoothed", {
        landmarks: [],
        frameId: raw && raw.frameId ? raw.frameId : null,
        timestamp: Date.now(),
        width: raw && raw.width ? raw.width : null,
        height: raw && raw.height ? raw.height : null,
        meta: {
          source: "smoothed",
          alpha: this._alpha,
          modes: { oneEuro: this._enableOneEuro },
        },
      });
      return;
    }

    // For now handle single-hand canonical payloads (first hand)
    const rawLandmarks = raw.landmarks.slice(0, this._maxLandmarks);

    // previous smoothed for this hand (index 0)
    const prev = (this._prevSmoothed[0] && this._prevSmoothed[0]) || null;

    // compute smoothed using OneEuro; pass timestamp for filter dt
    const timestamp = raw.timestamp || Date.now();
    const smoothed = this.computeSmoothed(
      rawLandmarks,
      prev,
      this._alpha,
      timestamp
    );

    // store for next frame
    this._prevSmoothed[0] = smoothed;

    // publish canonical smoothed envelope
    const payload = {
      landmarks: smoothed.map((p) => [
        Number(p.x),
        Number(p.y),
        Number(p.z ?? 0),
      ]),
      frameId: raw.frameId || null,
      timestamp: raw.timestamp || Date.now(),
      width: raw.width || null,
      height: raw.height || null,
      meta: {
        source: "smoothed",
        alpha: this._alpha,
        modes: { oneEuro: this._enableOneEuro },
      },
    };

    try {
      this._eventBus.publish("landmark:smoothed", payload);
    } catch (e) {
      // swallow to avoid crashing consumers
      console.debug("LandmarkSmoothManager: publish error", e);
    }
  }

  /**
   * computeSmoothed(landmarks, prevSmoothed, alpha, timestampMs)
   *  - Pure function: returns a new array of point objects {x,y,z}
   *  - landmarks: array of {x,y,z} or arrays -> we'll accept objects or arrays
   */
  computeSmoothed(
    landmarks,
    prevSmoothed = null,
    alpha = this._alpha,
    timestampMs = Date.now()
  ) {
    const t = Number(timestampMs) || Date.now();
    const result = [];

    // initialize per-hand OneEuro filters if needed (single-hand index 0)
    if (
      !this._filters[0] ||
      !this._filters[0].landmarkFilters ||
      this._filters[0].landmarkFilters.length !== landmarks.length
    ) {
      const landmarkFilters = [];
      for (let i = 0; i < landmarks.length; i++) {
        landmarkFilters.push({
          x: new OneEuroFilter(this._oneEuroParams),
          y: new OneEuroFilter(this._oneEuroParams),
          z: new OneEuroFilter(this._oneEuroParams),
        });
      }
      this._filters[0] = { landmarkFilters, lastT: t };
    }

    const hand = this._filters[0];
    const prevT = hand.lastT || t;
    let dt = (t - prevT) / 1000;
    if (!(isFinite(dt) && dt > 0)) dt = 1 / 60;

    for (let i = 0; i < landmarks.length; i++) {
      const p = landmarks[i];
      const currX = Number(Array.isArray(p) ? p[0] : p.x ?? 0);
      const currY = Number(Array.isArray(p) ? p[1] : p.y ?? 0);
      const currZ = Number(Array.isArray(p) ? p[2] : p.z ?? 0);

      const filters = hand.landmarkFilters[i];

      const fx = this._enableOneEuro ? filters.x.filter(currX, t) : currX;
      const fy = this._enableOneEuro ? filters.y.filter(currY, t) : currY;
      const fz = this._enableOneEuro ? filters.z.filter(currZ, t) : currZ;

      result.push({ x: fx, y: fy, z: fz });
    }

    // stash last timestamp for dt computation
    hand.lastT = t;

    return result;
  }

  /**
   * computePalmWidth(landmarks)
   *  - Helper: compute distance between index_mcp(5) and pinky_mcp(17) as palm width (normalized coords)
   *  - Returns normalized distance (0..sqrt(2)) or 0 if not available
   */
  static computePalmWidth(landmarks) {
    if (!landmarks || landmarks.length <= 17) return 0;
    const a = landmarks[5];
    const b = landmarks[17];
    if (!a || !b) return 0;
    const dx = Number(a.x) - Number(b.x);
    const dy = Number(a.y) - Number(b.y);
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * destroy() — cleanup subscriptions and state
   */
  destroy() {
    this.stop();
    this._prevSmoothed = [];
    this._filters = [];
  }
}
