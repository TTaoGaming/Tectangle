// Updated: 2025-08-31T07:41:36.000Z
// Purpose: Emit telemetry-aware plausibility events for kinematic clamp checks (pass/fail).
// Exposed defaults: EVENT_PASS=plausibility:physics.pass, EVENT_FAIL=plausibility:physics.fail, SCHEMA_V=plausibility.physics.v1
// Consumes: landmark/pose inputs (local detection pipeline)
// Publishes: plausibility:physics.pass (success), plausibility:physics.fail (failure)
// Example fail payload (compact):
// { schemaVersion:"plausibility.physics.v1", ts:'2025-08-31T07:41:36.000Z', manager:'KinematicClampManager', sourceId:'camA', frameIndex:42, outcome:'fail', reason:'velocity-outlier', confidence:0.12 }
// Next action (minimal): in fail branch call eventBus.publishFrom(this, EVENT_FAIL, payload) (or publish) and increment telemetry.plausibility.physics.fail.count
// Tests to add:
// - tests/unit/KinematicClampManager.plausibility.red.test.mjs  (assert publish to plausibility:physics.fail with minimal schema fields)
// - tests/unit/KinematicClampManager.plausibility.green.test.mjs (assert telemetry counter increment)
// - tests/smoke/kinematic.plausibility.smoke.test.mjs           (end-to-end counters + sampled payload presence)
/* EARS_HEADER_START
TLDR: KinematicClampManager — Plausibility checks and clamping for landmark positions.

Purpose:
- Plausibility checks and clamping for landmark positions.
- Acceptance criteria (planning): exposes setConfig, start, stop, destroy; listens to landmark:smoothed and emits landmark:clamped when implemented.
- This is a planning/header-only file to record intent for tuning with golden-master data.

Stage: planning
File: `src/KinematicClampManager.js`
Author: automated-assistant
Updated: 2025-08-30T07:44:28Z

Notes:
- Created from template: August Tectangle Sprint/tectangle-gesture-keyboard-mobile/docs/header_template_2025-08-28T154621Z.md
- Keep runtime implementation minimal while planning and collecting golden-master telemetry.

HEADER_META_START
{
  "name": "KinematicClampManager",
  "file": "`src/KinematicClampManager.js`",
  "tldr": "Fingertip-focused physics-implausibility detector (publishes plausibility:physics.fail).",
  "purpose": "Detect conservative fingertip physics violations and emit defensive events.",
  "stage": "red",
  "author": "automated-assistant",
  "updated": "2025-08-31T07:41:36Z",
  "version": "0.1.1",
  "configDefaults": {
    "enablePhysicsImplausibility": true,
    "fingertipIndices": [4,8,12,16,20],
    "handScaleReference": "wrist-middle-mcp",
    "teleportNormalizedDistance": 0.5,
    "maxNormalizedSpeedPerSecond": 10.0,
    "minFingertipViolations": 2,
    "aggregationWindowMs": 200,
    "emitEventName": "plausibility:physics.fail",
    "emitOnly": true,
    "sampleRateFallbackMs": 16
  }
}
HEADER_META_END
EARS_HEADER_END */

import defaultEventBus from "./EventBusManager.js";

export default class KinematicClampManager {
  static DEFAULTS = {
    enablePhysicsImplausibility: true,
    fingertipIndices: [4, 8, 12, 16, 20],
    handScaleReference: "wrist-middle-mcp",
    teleportNormalizedDistance: 0.5,
    maxNormalizedSpeedPerSecond: 10.0,
    minFingertipViolations: 2,
    aggregationWindowMs: 200,
    emitEventName: "plausibility:physics.fail",
    emitOnly: true,
    sampleRateFallbackMs: 16,
  };

  constructor({ eventBus } = {}) {
    this._eventBus = eventBus || defaultEventBus;
    this._running = false;
    this._config = Object.assign({}, KinematicClampManager.DEFAULTS);
    this._prevHands = new Map(); // handIndex -> { ts, smooth: [...] }
    this._lastEmit = new Map(); // handIndex -> timestamp ms
    this._clampedListeners = new Set(); // fallback listeners when EventBus not present
    this._onSmoothed = this._onSmoothed.bind(this);
  }

  setConfig(cfg = {}) {
    // Support legacy alias teleportThreshold -> teleportNormalizedDistance
    const normalized = Object.assign({}, cfg);
    if (
      "teleportThreshold" in normalized &&
      !("teleportNormalizedDistance" in normalized)
    ) {
      normalized.teleportNormalizedDistance = normalized.teleportThreshold;
    }
    this._config = Object.assign({}, this._config, normalized);
    return { ok: true };
  }

  start() {
    if (this._running) return { ok: true };
    if (this._config.enablePhysicsImplausibility) {
      this._eventBus.on("landmark:smoothed", this._onSmoothed);
    }
    this._running = true;
    return { ok: true };
  }

  stop() {
    if (!this._running) return { ok: true };
    if (this._config.enablePhysicsImplausibility) {
      try {
        this._eventBus.off("landmark:smoothed", this._onSmoothed);
      } catch (e) {
        // EventEmitter compatibility: ignore if off not present
        if (typeof this._eventBus.removeListener === "function") {
          this._eventBus.removeListener("landmark:smoothed", this._onSmoothed);
        }
      }
    }
    this._running = false;
    return { ok: true };
  }

  destroy() {
    this.stop();
    this._config = Object.assign({}, KinematicClampManager.DEFAULTS);
    this._prevHands.clear();
    this._lastEmit.clear();
    return { ok: true };
  }

  _onSmoothed(envOrFrame) {
    // Accept EventBus envelopes and legacy shapes. Normalize into canonical frame:
    // { sampleIndex, timestamp, width, height, hands: [{ handIndex, handedness, smooth: [[x,y,z], ...] }, ...] }
    const env = envOrFrame || {};
    let frame = null;

    // EventBus envelope with hands array (preferred)
    if (env && env.detail && Array.isArray(env.detail.hands)) {
      frame = env.detail;
    } else if (env && env.detail && Array.isArray(env.detail.landmarks)) {
      // LandmarkSmoothManager publishes single-hand payload with top-level 'landmarks'
      const d = env.detail;
      frame = {
        sampleIndex: d.frameId ?? d.sampleIndex ?? null,
        timestamp: d.timestamp ?? Date.now(),
        width: d.width ?? null,
        height: d.height ?? null,
        hands: [
          {
            handIndex: 0,
            handedness: d.handedness ?? null,
            smooth: d.landmarks.map((p) =>
              Array.isArray(p)
                ? p.slice()
                : [Number(p.x ?? 0), Number(p.y ?? 0), Number(p.z ?? 0)]
            ),
          },
        ],
      };
    } else if (envOrFrame && Array.isArray(envOrFrame.hands)) {
      // Raw frame object already shaped with hands[]
      frame = envOrFrame;
    } else if (envOrFrame && Array.isArray(envOrFrame.landmarks)) {
      // Raw single-hand frame with top-level 'landmarks'
      const d = envOrFrame;
      frame = {
        sampleIndex: d.frameId ?? d.sampleIndex ?? null,
        timestamp: d.timestamp ?? Date.now(),
        width: d.width ?? null,
        height: d.height ?? null,
        hands: [
          {
            handIndex: 0,
            handedness: d.handedness ?? null,
            smooth: d.landmarks.map((p) =>
              Array.isArray(p)
                ? p.slice()
                : [Number(p.x ?? 0), Number(p.y ?? 0), Number(p.z ?? 0)]
            ),
          },
        ],
      };
    }

    if (!frame || !Array.isArray(frame.hands)) return;
    const now = Date.now();
    const cfg = this._config;

    for (const hand of frame.hands) {
      const handIndex = hand.handIndex ?? 0;
      if (!hand || !Array.isArray(hand.smooth) || hand.smooth.length === 0)
        continue;

      const prev = this._prevHands.get(handIndex);
      if (!prev) {
        // No previous frame; seed and continue
        this._prevHands.set(handIndex, {
          ts: frame.timestamp,
          smooth: hand.smooth.map((p) => (Array.isArray(p) ? p.slice() : p)),
        });
        continue;
      }

      // Compute handScale using wrist(0) -> middle_mcp(9) if available
      let handScale = 1;
      const w = hand.smooth[0];
      const m = hand.smooth[9];
      if (w && m) {
        handScale = Math.max(this._dist(w, m), 1e-6);
      }

      const dt = Math.max(
        (frame.timestamp - prev.ts) / 1000 || 0,
        cfg.sampleRateFallbackMs / 1000
      );
      const violations = [];

      for (const idx of cfg.fingertipIndices) {
        const prevPos = prev.smooth[idx];
        const currPos = hand.smooth[idx];
        if (!prevPos || !currPos) continue;
        const d = this._dist(currPos, prevPos);
        const normalizedDistance = d / handScale;
        const normalizedSpeed = normalizedDistance / dt;
        const isTeleport = normalizedDistance > cfg.teleportNormalizedDistance;
        const isSpeed = normalizedSpeed > cfg.maxNormalizedSpeedPerSecond;
        if (isTeleport || isSpeed) {
          violations.push({
            index: idx,
            prev: prevPos,
            curr: currPos,
            normalizedDistance,
            normalizedSpeed,
            reason: isTeleport ? "teleport" : "speed",
          });
        }
      }

      const last = this._lastEmit.get(handIndex) || 0;

      // helper: publish with EventBus compatibility (publishFrom -> publish -> emit)
      const publishFromBus = (eventName, pl, tags = {}) => {
        try {
          if (typeof this._eventBus.publishFrom === "function") {
            this._eventBus.publishFrom(
              "KinematicClampManager",
              eventName,
              pl,
              Object.assign({}, tags, {
                schemaVersion: "plausibility.physics.v1",
              }),
              frame.sampleIndex
            );
          } else if (typeof this._eventBus.publish === "function") {
            this._eventBus.publish(
              eventName,
              pl,
              Object.assign({}, tags, {
                source: "KinematicClampManager",
                schemaVersion: "plausibility.physics.v1",
              }),
              frame.sampleIndex
            );
          } else if (typeof this._eventBus.emit === "function") {
            this._eventBus.emit(eventName, pl);
          }
        } catch (err) {
          try {
            if (typeof this._eventBus.emit === "function")
              this._eventBus.emit(eventName, pl);
          } catch (err2) {
            // swallow
          }
        }
      };

      // Emit a lightweight 'landmark:clamped' envelope for this evaluation (per-hand).
      // Minimal shape (required): { frameId, timestamp, pass, clampedIndices: number[], reason? }
      try {
        const frameId = frame.sampleIndex ?? frame.frameId ?? null;
        const clampedIndices = violations.length
          ? violations.map((v) => v.index)
          : [];
        const passFlag = !(violations.length >= cfg.minFingertipViolations);
        const clampedPayload = {
          frameId,
          timestamp: frame.timestamp ?? Date.now(),
          pass: passFlag,
          clampedIndices,
        };
        // non-breaking additive: include handIndex for convenience when present
        if (typeof handIndex !== "undefined")
          clampedPayload.handIndex = handIndex;
        if (!passFlag && clampedIndices.length > 0) {
          const r = violations.some((v) => v.reason === "teleport")
            ? "teleport"
            : (violations[0] && violations[0].reason) || "implausible";
          clampedPayload.reason = r;
        }

        const hasBus =
          this._eventBus &&
          (typeof this._eventBus.publishFrom === "function" ||
            typeof this._eventBus.publish === "function" ||
            typeof this._eventBus.emit === "function");

        if (hasBus) {
          publishFromBus("landmark:clamped", clampedPayload, {
            severity: passFlag ? "info" : "warning",
          });
        } else {
          for (const cb of Array.from(this._clampedListeners || [])) {
            try {
              cb(clampedPayload);
            } catch (e) {
              /* swallow listener error */
            }
          }
        }
      } catch (errClamped) {
        // best-effort fallback: notify local listeners with a safe 'pass' envelope
        for (const cb of Array.from(this._clampedListeners || [])) {
          try {
            cb({
              frameId: frame.sampleIndex ?? frame.frameId ?? null,
              timestamp: frame.timestamp ?? Date.now(),
              pass: true,
              clampedIndices: [],
            });
          } catch (e2) {
            /* swallow */
          }
        }
      }

      // throttle emissions per hand using aggregation window
      if (now - last > cfg.aggregationWindowMs) {
        if (violations.length >= cfg.minFingertipViolations) {
          const reason = violations.some((v) => v.reason === "teleport")
            ? "teleport"
            : "speed";
          const payload = {
            sampleIndex: frame.sampleIndex,
            timestamp: frame.timestamp,
            handIndex,
            handedness: hand.handedness,
            handScale,
            violatingFingertips: violations,
            reason,
            configSnapshot: Object.assign({}, cfg),
          };

          // publish canonical fail event (telemetry-aware)
          publishFromBus("plausibility:physics.fail", payload, {
            reason,
            severity: "critical",
          });

          // legacy alias removed — publish canonical events only
          // (deprecated alias removed to standardize on plausibility:physics.fail)

          // increment telemetry counter (lightweight telemetry envelope)
          try {
            publishFromBus(
              "telemetry:counter",
              { metric: "telemetry.plausibility.physics.fail.count", value: 1 },
              { reason }
            );
          } catch (e) {
            // ignore
          }

          this._lastEmit.set(handIndex, now);
        } else {
          // no significant violations -> publish a pass event (throttled)
          const passPayload = {
            sampleIndex: frame.sampleIndex,
            timestamp: frame.timestamp,
            handIndex,
            handedness: hand.handedness,
            outcome: "pass",
            confidence: 1.0,
            configSnapshot: Object.assign({}, cfg),
          };

          publishFromBus("plausibility:physics.pass", passPayload, {
            severity: "info",
          });

          try {
            publishFromBus(
              "telemetry:counter",
              { metric: "telemetry.plausibility.physics.pass.count", value: 1 },
              {}
            );
          } catch (e) {
            // ignore
          }

          this._lastEmit.set(handIndex, now);
        }
      }

      // update prev
      this._prevHands.set(handIndex, {
        ts: frame.timestamp,
        smooth: hand.smooth.map((p) => (Array.isArray(p) ? p.slice() : p)),
      });
    }
  }

  // Register a local clamped listener for environments without a shared EventBus.
  onClamped(cb) {
    if (typeof cb !== "function") return () => {};
    this._clampedListeners.add(cb);
    return () => this._clampedListeners.delete(cb);
  }

  _dist(a, b) {
    const dx = a[0] - b[0] || 0;
    const dy = a[1] - b[1] || 0;
    const dz = a[2] - b[2] || 0;
    return Math.hypot(dx, dy, dz);
  }
}
