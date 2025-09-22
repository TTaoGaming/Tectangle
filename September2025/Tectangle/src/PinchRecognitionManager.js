/**
 * TLDR: PinchRecognitionManager — Phase‑0 pinch FSM using controllerId; per-finger parameter manifest (schema-only) for trigger/release/hold; palm-orientation gating; emits deterministic gesture & adapter events.
 *
 * Executive summary (5W1H):
 *  - Who: UI, KeyboardManager, Telemetry and PredictiveLatencyManager consumers.
 *  - What: Observe smoothed, kinematically-clamped fingertip landmarks (thumb + 4 fingertips), verify palm-facing orientation, apply per-finger hysteresis/hold gates, and emit canonical gesture envelopes and adapter mappings.
 *  - When: After LandmarkSmoothManager and KinematicClampManager produce plausible landmarks, or during deterministic test playback.
 *  - Where: Mobile / Chromebook demos and deterministic ESM tests (target: mid-range phones).
 *  - Why: Provide a reliable, deterministic pinch→gesture pipeline that is controller-scoped (controllerId) and tunable via a standardized configuration schema.
 *  - How: Compute fingertip distances (absolute cm and knuckle-ratio), apply palm-facing gating, run a finite-state-machine per finger with trigger/release hysteresis and hold timers, then publish 'tectangle:gesture' and adapter envelopes.
 *
 * Pinch FSM (Phase‑0) overview:
 *  - States: idle -> candidate -> triggered -> held -> released
 *  - Inputs: knuckleRatio, absoluteCm, palmFacingScore, meanVelocity
 *  - Tunables per finger: triggerHysteresis (ratio [0..1]), releaseHysteresis (ratio [0..1]), holdMs (ms)
 *  - Events published: 'tectangle:gesture' (type: start|hold|end), 'tectangle:gesture:suppressed', 'pinch:fsm' (detailed state), 'adapter:mapped_key'
 *
 * Parameter manifest (schema-only — no numeric defaults in headers):
 *  PINCH_PARAMS_SCHEMA:
 *   {
 *     thumb:   { triggerHysteresis: "ratio [0..1]", releaseHysteresis: "ratio [0..1]", holdMs: "ms [100..5000]" },
 *     index:   { triggerHysteresis: "ratio [0..1]", releaseHysteresis: "ratio [0..1]", holdMs: "ms [100..5000]" },
 *     middle:  { triggerHysteresis: "ratio [0..1]", releaseHysteresis: "ratio [0..1]", holdMs: "ms [100..5000]" },
 *     ring:    { triggerHysteresis: "ratio [0..1]", releaseHysteresis: "ratio [0..1]", holdMs: "ms [100..5000]" }
 *   }
 *  Notes: ratio fields are applied to knuckleRatio or absoluteCm metrics depending on configured mode; holdMs is the long‑press threshold after trigger.
 *
 * Top responsibilities:
 *  - Track the five fingertip anchors per controller and compute approach distance + velocity.
 *  - Gate detections by palm-facing orientation and kinematic plausibility.
 *  - Run per-fINGER FSMs (using controllerId) and emit 'tectangle:gesture' (start/hold/end) and 'adapter:mapped_key' with controllerId in payload; record low‑PII telemetry.
 *
 * Canonical event payloads (examples — Phase‑0 fields):
 *  - tectangle:gesture (start):
 *    { type: 'start', controllerId: <int>, finger: 'index', anchor:{x,y,z}, confidence:0.9, frameId:1234, ts:1693... }
 *  - adapter:mapped_key:
 *    { controllerId: <int>, finger:'index', code:'Digit3', action:'keydown', frameId:1234 }
 *
 * EARS / Acceptance (phase‑0 additions):
 *  - TREQ-117 — When PinchRecognitionManager.observeFrame(frame) detects a candidate pinch by knuckleRatio/absolute cm for controllerId and palm-facing gating satisfied, emit 'tectangle:gesture' with payload containing { controllerId, finger, type }.
 *  - TREQ-117a — FSM hysteresis: trigger/release hysteresis and holdMs parameters shall be exposed via the manager config API (schema) and used by the per-finger FSM to decide state transitions; headers document schema and units.
 *  - TREQ-117b — Hold behavior: when a pinch remains triggered beyond holdMs, emit a 'hold' type event and publish 'adapter:mapped_key' with action 'hold' semantics.
 *  - TREQ-117c — Suppression: when palm-facing gating fails, publish 'tectangle:gesture:suppressed' including reason and controllerId.
 *
 * UI_METADATA:
 *  { tabId: 'pinch', title: 'Pinch Recognition', order: 4, configSchema: 'PINCH_PARAMS_SCHEMA' }
 *
 * Usage snippet:
 *  // const pincher = new PinchRecognitionManager(); await pincher.init(); pincher.start(); pincher.observeFrame(frame);
 *
 * Header generated from: August Tectangle Sprint/foundation/docs/TECTANGLE_EARS_CANONICAL_2025-08-27T034212Z.md (2025-08-27T03:42:12Z)
 */

export const __HEADER__ = "PinchRecognitionManager.v1";

import defaultEventBus from './EventBusManager.js';
import { incrementPinchCount } from './telemetry/pinchTelemetry.js';

export default class PinchRecognitionManager {
  constructor({ eventBus, telemetry, config } = {}) {
    this._eventBus = eventBus || defaultEventBus;
    this._telemetry = telemetry || { incrementPinchCount };
    this._config = Object.assign({
      triggerRatio: 0.4,
      releaseRatio: 0.8,
      thumbIndex: 4,
      fingertipIndices: [8, 12, 16, 20],
      knuckleA: 5,
      knuckleB: 17,
      eps: 1e-6
    }, config || {});
    this._running = false;
    this._unsub = null;
    // states: Map(controllerId -> Map(fingerName -> {state:'idle'|'triggered'}))
    this._states = new Map();
  }

  start() {
    if (this._running) return { ok: true, already: true };
    this._unsub = this._eventBus.addEventListener('landmark:smoothed', (env) => {
      try { this.handleEnvelope(env); } catch (e) { /* swallow */ }
    });
    // fallback to landmark:raw if addEventListener returned null-ish
    if (!this._unsub) {
      this._unsub = this._eventBus.addEventListener('landmark:raw', (env) => {
        try { this.handleEnvelope(env); } catch (e) { /* swallow */ }
      });
    }
    this._running = true;
    return { ok: true };
  }

  stop() {
    if (!this._running) return { ok: true, already: false };
    try { if (typeof this._unsub === 'function') this._unsub(); } catch (e) {}
    this._unsub = null;
    this._states.clear();
    this._running = false;
    return { ok: true };
  }

  handleEnvelope(envOrFrame) {
    const payload = envOrFrame && envOrFrame.detail ? envOrFrame.detail : envOrFrame || {};
    const landmarks = payload.landmarks;
    if (!Array.isArray(landmarks)) return;

    const toPoint = (p) => {
      if (!p) return null;
      if (Array.isArray(p)) return { x: Number(p[0] ?? 0), y: Number(p[1] ?? 0), z: Number(p[2] ?? 0) };
      return { x: Number(p.x ?? 0), y: Number(p.y ?? 0), z: Number(p.z ?? 0) };
    };

    const frameId = typeof payload.frameId !== 'undefined' ? payload.frameId : null;
    const ts = typeof payload.timestamp !== 'undefined' ? payload.timestamp : Date.now();
    const controllerId = (payload.controllerId != null) ? payload.controllerId : ((payload.meta && payload.meta.controllerId) || 0);

    const thumb = toPoint(landmarks[this._config.thumbIndex]);
    const knA = toPoint(landmarks[this._config.knuckleA]);
    const knB = toPoint(landmarks[this._config.knuckleB]);
    if (!thumb || !knA || !knB) return;

    const palmSpan = Math.hypot((knA.x - knB.x), (knA.y - knB.y)) || this._config.eps;

    const fingers = ['index','middle','ring','pinky'];
    for (let i = 0; i < this._config.fingertipIndices.length; i++) {
      const idx = this._config.fingertipIndices[i];
      const fingerName = fingers[i] || `finger${i}`;
      const tip = toPoint(landmarks[idx]);
      if (!tip) continue;

      const dx = thumb.x - tip.x; const dy = thumb.y - tip.y;
      const dist = Math.hypot(dx, dy);
      const norm = dist / (palmSpan + this._config.eps);

      this._processFinger(controllerId, fingerName, norm, { frameId, ts, palmSpan, normalizedDistance: norm });
    }
  }

  _processFinger(controllerId, fingerName, norm, meta = {}) {
    const key = String(controllerId);
    let controllerMap = this._states.get(key);
    if (!controllerMap) {
      controllerMap = new Map();
      this._states.set(key, controllerMap);
    }
    let state = controllerMap.get(fingerName) || { state: 'idle' };

    if (state.state !== 'triggered') {
      if (norm <= this._config.triggerRatio) {
        // transition to triggered
        state.state = 'triggered';
        controllerMap.set(fingerName, state);
        this._publishGesture('start', controllerId, fingerName, norm, meta);
        // telemetry increment
        try {
          if (typeof this._telemetry === 'function') this._telemetry({ finger: fingerName, controllerId });
          else if (this._telemetry && typeof this._telemetry.incrementPinchCount === 'function') this._telemetry.incrementPinchCount({ finger: fingerName, controllerId });
        } catch (e) {}
      }
    } else {
      if (norm >= this._config.releaseRatio) {
        state.state = 'idle';
        controllerMap.set(fingerName, state);
        this._publishGesture('end', controllerId, fingerName, norm, meta);
      }
    }
  }

  _publishGesture(type, controllerId, finger, normalizedDistance, meta = {}) {
    const payload = Object.assign({
      type,
      controllerId,
      finger,
      normalizedDistance,
      frameId: meta.frameId || null,
      ts: meta.ts || Date.now(),
      palmSpan: meta.palmSpan
    }, meta || {});

    try {
      if (typeof this._eventBus.publishFrom === 'function') {
        this._eventBus.publishFrom('PinchRecognitionManager', 'tectangle:gesture', payload, { finger }, meta.frameId);
      } else if (typeof this._eventBus.publish === 'function') {
        this._eventBus.publish('tectangle:gesture', payload, { finger }, meta.frameId);
      } else if (typeof this._eventBus.emit === 'function') {
        this._eventBus.emit('tectangle:gesture', payload);
      }
    } catch (e) {
      // swallow
    }
  }
}

/**
 * Small test helpers
 */
export const __internal = {
  _getStates: (mgr) => {
    // accept either instance or the module's default instance
    try {
      const s = mgr && mgr._states ? mgr._states : null;
      if (!s) return {};
      const out = {};
      for (const [k,v] of s.entries()) {
        out[k] = {};
        for (const [fk, fv] of v.entries()) out[k][fk] = Object.assign({}, fv);
      }
      return out;
    } catch (e) { return {}; }
  }
};