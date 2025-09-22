/* EARS_HEADER_START
TLDR: OnboardingManager captures per-user palm calibration snapshots and computes knuckle/bone-ratio fingerprints for controller pairing.

Executive summary:
Provide a lightweight onboarding scaffold that collects per-controller palm/knuckle measurements,
computes compact fingerprints (knuckle spans + bone ratios), and exposes a minimal API for pairing.

HEADER_META_START
{
  "name": "OnboardingManager",
  "tldr": "Capture per-user palm calibration snapshots and compute knuckle/bone-ratio fingerprints for controller pairing.",
  "version": "0.1.0",
  "configDefaults": {
    "knuckleSpanDefaultCm": 8.0,
    "knuckleSpanToleranceCm": 1.5,
    "snapshotDurationMs": 1500,
    "persistKey": "onboarding.controller.mappings"
  },
  "responsibilities": [
    "capture calibration snapshots",
    "compute compact fingerprints",
    "persist mappings (best-effort)",
    "publish onboarding events"
  ],
  "api": {
    "constructor": "constructor({ eventBus, storage, knuckleSpanDefaultCm, knuckleSpanToleranceCm, snapshotDurationMs, persistKey })",
    "start": "start()",
    "stop": "stop()",
    "captureSnapshot": "async captureSnapshot(videoOrFrame)",
    "computeFingerprint": "computeFingerprint(landmarks) [named export]",
    "setKnuckleSpan": "setKnuckleSpan(cm)",
    "getKnuckleSpan": "getKnuckleSpan()",
    "persistControllerId": "persistControllerId(controllerId)",
    "assignController": "assignController(controllerId, fingerprint)",
    "getControllerMappings": "getControllerMappings()",
    "destroy": "destroy()"
  }
}
HEADER_META_END
EARS_HEADER_END */

import defaultEventBus from "./EventBusManager.js";

/**
 * computeFingerprint - named export
 *
 * Minimal, pure utility that derives a compact fingerprint from landmarks.
 * - Uses index_mcp (5) and pinky_mcp (17) for knuckleSpan (palm width)
 * - Computes simple bone ratios (neighbor pair distances normalized by knuckleSpan)
 *
 * Accepts landmarks as arrays ([x,y,z]) or objects ({x,y,z}).
 */
export function computeFingerprint(landmarks = []) {
  const toPoint = (v) => {
    if (!v) return null;
    if (Array.isArray(v))
      return {
        x: Number(v[0] || 0),
        y: Number(v[1] || 0),
        z: Number(v[2] || 0),
      };
    if (typeof v === "object")
      return { x: Number(v.x || 0), y: Number(v.y || 0), z: Number(v.z || 0) };
    return null;
  };
  const a = toPoint(landmarks[5]);
  const b = toPoint(landmarks[17]);
  const dist = (p, q) => {
    if (!p || !q) return 0;
    const dx = p.x - q.x;
    const dy = p.y - q.y;
    const dz = (p.z || 0) - (q.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };
  const knuckleSpan = dist(a, b);
  // small set of neighbor pairs along fingers (index, middle, ring, pinky)
  const pairs = [
    [5, 6],
    [6, 7],
    [7, 8],
    [9, 10],
    [10, 11],
    [11, 12],
    [13, 14],
    [14, 15],
    [15, 16],
    [17, 18],
    [18, 19],
    [19, 20],
  ];
  const boneDistances = pairs.map(([i, j]) =>
    dist(toPoint(landmarks[i]), toPoint(landmarks[j]))
  );
  const boneRatios = boneDistances.map((d) =>
    knuckleSpan > 0 ? d / knuckleSpan : 0
  );
  const summary = {
    landmarkCount: Array.isArray(landmarks) ? landmarks.length : 0,
    knuckleSpan,
  };
  return { knuckleSpan, boneRatios, summary };
}

/**
 * OnboardingManager
 *
 * Lightweight scaffolding only: no heavy implementations or side-effects.
 */
export default class OnboardingManager {
  constructor(options = {}) {
    const {
      eventBus,
      storage,
      knuckleSpanDefaultCm,
      knuckleSpanToleranceCm,
      snapshotDurationMs,
      persistKey,
    } = options || {};

    this._eventBus = eventBus || defaultEventBus;
    this._storage = storage || null;

    this._knuckleSpanDefaultsCm =
      typeof knuckleSpanDefaultCm === "number" ? knuckleSpanDefaultCm : 8.0;
    this._knuckleSpanToleranceCm =
      typeof knuckleSpanToleranceCm === "number" ? knuckleSpanToleranceCm : 1.5;
    this._snapshotDurationMs =
      typeof snapshotDurationMs === "number" ? snapshotDurationMs : 1500;
    this._persistKey =
      typeof persistKey === "string"
        ? persistKey
        : "onboarding.controller.mappings";

    // manager-level knuckle span (simple scalar) per spec; may be overridden per-controller where needed
    this._knuckleSpanCm = this._knuckleSpanDefaultsCm;

    // lightweight in-memory controller mappings
    this._controllerMappings = {};

    // running state
    this._started = false;
    this._boundListener = null;
  }

  // start() / stop() lifecycle: subscribe/unsubscribe placeholders (no external side-effects)
  start() {
    if (this._started) return { ok: true };
    this._started = true;
    // placeholder subscription: keep reference to allow stop() to remove it if EventBus supports removal
    try {
      if (
        this._eventBus &&
        typeof this._eventBus.addEventListener === "function"
      ) {
        // store a noop handler by default; real implementation will replace this during integration
        this._boundListener = () => {};
        this._eventBus.addEventListener("landmark:raw", this._boundListener);
      }
    } catch (e) {
      // swallow to keep this scaffold deterministic
    }
    return { ok: true };
  }

  stop() {
    if (!this._started) return { ok: true };
    this._started = false;
    try {
      if (
        this._eventBus &&
        typeof this._eventBus.removeEventListener === "function" &&
        this._boundListener
      ) {
        this._eventBus.removeEventListener("landmark:raw", this._boundListener);
      }
    } catch (e) {
      // swallow
    } finally {
      this._boundListener = null;
    }
    return { ok: true };
  }

  /**
   * captureSnapshot(videoOrFrame)
   *
   * Safe minimal implementation: accepts a video element, frame envelope, or landmark array.
   * Returns a Promise resolving to { timestamp, landmarks } where landmarks may be null or placeholder.
   */
  async captureSnapshot(videoOrFrame) {
    let landmarks = null;
    try {
      if (videoOrFrame && Array.isArray(videoOrFrame.landmarks)) {
        landmarks = videoOrFrame.landmarks;
      } else if (Array.isArray(videoOrFrame)) {
        landmarks = videoOrFrame;
      } else if (videoOrFrame && videoOrFrame.getImageData) {
        // video element-like; placeholder: no extraction in scaffold
        landmarks = null;
      } else {
        landmarks = null;
      }
    } catch (e) {
      landmarks = null;
    }
    const snapshot = { timestamp: Date.now(), landmarks };
    return snapshot;
  }

  /**
   * setKnuckleSpan(cm) — manager-level setter
   */
  setKnuckleSpan(cm) {
    this._knuckleSpanCm =
      typeof cm === "number" ? Number(cm) : this._knuckleSpanCm;
    return this._knuckleSpanCm;
  }

  /**
   * getKnuckleSpan() — manager-level getter
   */
  getKnuckleSpan() {
    return this._knuckleSpanCm;
  }

  /**
   * persistControllerId(controllerId) — scaffolded stub returning success
   */
  persistControllerId(controllerId) {
    // Intentionally no-op for scaffold; real impl may persist to storage
    return { ok: true };
  }

  /**
   * assignController(controllerId, fingerprint) — lightweight placeholder that stores mapping in-memory
   */
  assignController(controllerId, fingerprint) {
    const id = String(controllerId);
    this._controllerMappings[id] = fingerprint || null;
    // best-effort persist using provided storage if available
    try {
      if (this._storage && typeof this._storage.set === "function") {
        this._storage.set(
          `${this._persistKey}:${id}`,
          this._controllerMappings[id]
        );
      }
    } catch (e) {
      // swallow
    }
    return { ok: true };
  }

  /**
   * getControllerMappings() — return shallow clone of mappings
   */
  getControllerMappings() {
    return Object.assign({}, this._controllerMappings);
  }

  /**
   * destroy() — cleanup stubs
   */
  destroy() {
    this.stop();
    this._controllerMappings = {};
    this._boundListener = null;
    this._started = false;
    try {
      if (this._eventBus && typeof this._eventBus.publish === "function") {
        this._eventBus.publish("onboarding:destroyed", {
          timestamp: Date.now(),
        });
      }
    } catch (e) {
      // swallow
    }
  }
}
