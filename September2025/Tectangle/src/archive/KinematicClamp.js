/* EARS_HEADER_START
TLDR: KinematicClamp — evaluate smoothed landmarks against simple kinematic constraints (bone-length ratios, teleport detection, implausible shrink/stretch) and flag impossible physics conditions for downstream consumers.

Responsibilities:
- Provide pure utility functions to compute bone lengths and palm width.
- Evaluate a smoothed landmark frame against the previous frame and return structured flags when physics constraints are violated.
- Minimal, mobile-friendly heuristics: teleport detection, bone stretch/shrink detection, excessive per-point displacement.
- Expose a KinematicClamp manager that can subscribe to `landmark:smoothed` and publish `landmark:kinematics` envelopes with flags.

HEADER_META_START
{
  "name": "KinematicClamp",
  "tldr": "Flag impossible kinematic events (teleports, extreme stretch/shrink) from landmark:smoothed.",
  "version": "0.1.0",
  "configDefaults": {
    "maxDisplacementRatio": 0.35,
    "maxStretchRatio": 1.5,
    "minShrinkRatio": 0.6,
    "teleportThresholdPalmRatio": 0.6,
    "publishEvent": "landmark:kinematics"
  }
}
HEADER_META_END
EARS_HEADER_END */

import defaultEventBus from "../EventBusManager.js";

/**
 * KinematicClamp.js
 *
 * Pure functions + a small manager to flag impossible physics on hand landmarks.
 *
 * Note: landmarks may be arrays [x,y,z] or objects {x,y,z}; utilities normalize either form.
 */

const DEFAULT_OPTIONS = {
  maxDisplacementRatio: 0.35, // normalized units per-frame relative to palm width
  maxStretchRatio: 1.5, // max allowed bone length ratio (current/previous)
  minShrinkRatio: 0.6, // min allowed bone length ratio (current/previous)
  teleportThresholdPalmRatio: 0.6, // displacement > this * palmWidth => teleport flag
  publishEvent: "landmark:kinematics",
  bonePairs: [
    // thumb
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    // index
    [0, 5],
    [5, 6],
    [6, 7],
    [7, 8],
    // middle
    [0, 9],
    [9, 10],
    [10, 11],
    [11, 12],
    // ring
    [0, 13],
    [13, 14],
    [14, 15],
    [15, 16],
    // pinky
    [0, 17],
    [17, 18],
    [18, 19],
    [19, 20],
    // palm
    [5, 17],
  ],
};

// Helpers
function toPoint(p) {
  if (!p) return { x: 0, y: 0, z: 0 };
  if (Array.isArray(p)) {
    return { x: Number(p[0] ?? 0), y: Number(p[1] ?? 0), z: Number(p[2] ?? 0) };
  }
  return { x: Number(p.x ?? 0), y: Number(p.y ?? 0), z: Number(p.z ?? 0) };
}

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function computePalmWidth(landmarks) {
  if (!Array.isArray(landmarks) || landmarks.length <= 17) return 0;
  const a = toPoint(landmarks[5]);
  const b = toPoint(landmarks[17]);
  return dist(a, b);
}

function computeBoneLengths(landmarks, bonePairs = DEFAULT_OPTIONS.bonePairs) {
  const lengths = [];
  if (!Array.isArray(landmarks)) return lengths;
  for (let i = 0; i < bonePairs.length; i++) {
    const [aIdx, bIdx] = bonePairs[i];
    const a = toPoint(landmarks[aIdx]);
    const b = toPoint(landmarks[bIdx]);
    lengths.push({ pair: [aIdx, bIdx], length: dist(a, b) });
  }
  return lengths;
}

/**
 * evaluateKinematics(currLandmarks, prevLandmarks, opts)
 *
 * Returns:
 * {
 *   ok: boolean,
 *   flags: [{ type: 'teleport'|'stretch'|'shrink'|'excessive_displacement', index?, info }],
 *   summary: { maxDisplacement, maxStretchRatio, maxShrinkRatio },
 * }
 */
function evaluateKinematics(currLandmarks, prevLandmarks = null, opts = {}) {
  const options = Object.assign({}, DEFAULT_OPTIONS, opts || {});
  const flags = [];
  if (!Array.isArray(currLandmarks) || currLandmarks.length === 0) {
    return { ok: true, flags, summary: {} };
  }

  const palmWidth = computePalmWidth(currLandmarks) || 0.001;
  const prevPalmWidth = prevLandmarks
    ? computePalmWidth(prevLandmarks) || 0.001
    : palmWidth;

  // 1) per-point displacement (max)
  let maxDisp = 0;
  for (let i = 0; i < currLandmarks.length; i++) {
    const curr = toPoint(currLandmarks[i]);
    const prev =
      prevLandmarks && prevLandmarks[i] ? toPoint(prevLandmarks[i]) : curr;
    const d = dist(curr, prev);
    if (d > maxDisp) maxDisp = d;
  }

  // Teleport detection: displacement > teleportThresholdPalmRatio * palmWidth
  if (maxDisp > options.teleportThresholdPalmRatio * palmWidth) {
    flags.push({
      type: "teleport",
      info: {
        maxDisp,
        palmWidth,
        threshold: options.teleportThresholdPalmRatio * palmWidth,
      },
    });
  }

  // 2) Bone-length stretch/shrink detection
  const currBones = computeBoneLengths(currLandmarks, options.bonePairs);
  const prevBones = prevLandmarks
    ? computeBoneLengths(prevLandmarks, options.bonePairs)
    : [];
  let maxStretch = 1;
  let maxShrink = 1;

  for (let i = 0; i < currBones.length; i++) {
    const curr = currBones[i];
    const prev = prevBones[i];
    if (!prev || prev.length <= 1e-6) continue; // can't compare reliably
    const ratio = curr.length / prev.length;
    if (ratio > maxStretch) maxStretch = ratio;
    if (ratio < maxShrink) maxShrink = ratio;
    if (ratio > options.maxStretchRatio) {
      flags.push({
        type: "stretch",
        info: {
          pair: curr.pair,
          ratio,
          lengthNow: curr.length,
          lengthPrev: prev.length,
        },
      });
    } else if (ratio < options.minShrinkRatio) {
      flags.push({
        type: "shrink",
        info: {
          pair: curr.pair,
          ratio,
          lengthNow: curr.length,
          lengthPrev: prev.length,
        },
      });
    }
  }

  // 3) Excessive per-point displacement relative to palm width
  if (maxDisp > options.maxDisplacementRatio * palmWidth) {
    flags.push({
      type: "excessive_displacement",
      info: {
        maxDisp,
        palmWidth,
        threshold: options.maxDisplacementRatio * palmWidth,
      },
    });
  }

  const ok = flags.length === 0;

  return {
    ok,
    flags,
    summary: {
      maxDisplacement: maxDisp,
      maxStretchRatio: maxStretch,
      maxShrinkRatio: maxShrink,
    },
  };
}

/**
 * KinematicClamp manager
 *  - subscribes to `landmark:smoothed`
 *  - evaluates kinematics against previous frame
 *  - publishes an envelope to `publishEvent` when flags are present (or always if configured)
 */
export default class KinematicClamp {
  constructor(options = {}) {
    const { eventBus, publishEvent } = options;
    this._eventBus = eventBus || defaultEventBus;
    this._opts = Object.assign({}, DEFAULT_OPTIONS, options || {});
    this._prev = null;
    this._listener = null;
    this._running = false;
    this._publishEvent = publishEvent || this._opts.publishEvent;
  }

  start() {
    if (this._running || !this._eventBus) return { ok: true };
    this._listener = this._eventBus.addEventListener(
      "landmark:smoothed",
      (env) => this._onSmoothed(env && env.detail ? env.detail : env)
    );
    this._running = true;
    return { ok: true };
  }

  stop() {
    try {
      if (this._listener) this._listener();
    } catch (e) {
      // ignore
    }
    this._listener = null;
    this._running = false;
    this._prev = null;
  }

  _onSmoothed(payload) {
    if (!payload) return;
    const curr = payload.landmarks || [];
    const prev = this._prev;
    const result = evaluateKinematics(curr, prev, this._opts);

    const envelope = {
      frameId: payload.frameId || null,
      timestamp: payload.timestamp || Date.now(),
      flags: result.flags,
      ok: result.ok,
      summary: result.summary,
      meta: { source: "kinematic-clamp", options: this._opts },
    };

    // Publish regardless so consumers can observe kinematic health; consumers can ignore empty flags.
    if (this._eventBus && this._publishEvent) {
      try {
        this._eventBus.publish(this._publishEvent, envelope);
      } catch (e) {
        console.debug("KinematicClamp: publish error", e);
      }
    }

    // store for next frame comparison (use raw arrays to keep memory shape)
    this._prev = curr.map((p) =>
      Array.isArray(p)
        ? [Number(p[0] || 0), Number(p[1] || 0), Number(p[2] || 0)]
        : [Number(p.x || 0), Number(p.y || 0), Number(p.z || 0)]
    );
  }

  setOptions(opts = {}) {
    this._opts = Object.assign({}, this._opts, opts || {});
  }

  destroy() {
    this.stop();
    this._opts = null;
    this._prev = null;
    this._eventBus = null;
  }
}

// Named exports for unit testing and re-use
export {
  computeBoneLengths,
  computePalmWidth,
  evaluateKinematics as flagImpossiblePhysics,
};
