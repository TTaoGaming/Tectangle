// fingertip-filter.js
// Helpers to compute fingertip distances, velocities and a naive predictive TTI
// using linear extrapolation along fingertip velocity. Also provides a small
// hysteresis helper for stabilizing press/release thresholds.
//
// Exports:
//   - FINGERTIP_INDICES: named indices for fingertips
//   - FingertipFilter: class that maintains temporal history and computes kinematics
//   - Hysteresis: small helper class for <on/off> hysteresis (less-than trigger)
//
// Notes:
// - Landmark coordinates are expected in MediaPipe normalized space {x,y,z}.
// - Predicted TTI is computed as distanceAlongVelocity / speed_projected (ms).
//   If the fingertip isn't moving toward the palm, predictedTtiMs = Infinity.

import { palmCentroid } from './palm-gating.js';

export const FINGERTIP_INDICES = {
  thumb: 4,
  index: 8,
  middle: 12,
  ring: 16,
  pinky: 20,
};

export class Hysteresis {
  // onThreshold (<=) will turn state true, offThreshold (>=) will turn state false.
  // Intended for metrics where "smaller = pressed" (e.g., distance).
  constructor(onThreshold = 0.05, offThreshold = 0.08, initial = false) {
    this.on = onThreshold;
    this.off = offThreshold;
    this.state = Boolean(initial);
  }
  update(value) {
    if (!this.state && value <= this.on) this.state = true;
    else if (this.state && value >= this.off) this.state = false;
    return this.state;
  }
  setState(v) {
    this.state = Boolean(v);
  }
}

export class FingertipFilter {
  constructor({ indices = Object.values(FINGERTIP_INDICES), maxHistoryMs = 500 } = {}) {
    this.indices = Array.isArray(indices) ? indices.slice() : Object.values(FINGERTIP_INDICES);
    // history: Map<controllerId, { tMs, positions: { idx: {x,y,z} } }>
    this.history = new Map();
    this.maxHistoryMs = maxHistoryMs;
  }

  reset() {
    this.history.clear();
  }

  // assignedHands: array of { controllerId, landmarks, handedness } (landmarks = array of {x,y,z})
  // tMs: timestamp in ms
  // returns: array of { controllerId, fingertips: [ { index, pos, vel, speed, distanceToPalm, predictedTtiMs } ], palmCentroid }
  compute(assignedHands = [], tMs = Date.now()) {
    const results = [];

    for (const h of assignedHands) {
      const id = h.controllerId;
      const landmarks = h.landmarks || [];
      const prev = this.history.get(id);
      const out = {
        controllerId: id,
        palm: palmCentroid(landmarks),
        fingertips: [],
      };

      for (const idx of this.indices) {
        const pt = landmarks[idx] || { x: 0, y: 0, z: 0 };
        const pos = { x: Number(pt.x || 0), y: Number(pt.y || 0), z: Number(pt.z || 0) };

        let vel = { x: 0, y: 0, z: 0 };
        let speed = 0;
        let predictedTtiMs = Infinity;

        if (prev && prev.positions && prev.positions[idx] && typeof prev.tMs === 'number') {
          const dt = (tMs - prev.tMs) / 1000;
          if (dt > 1e-4) {
            const prevPos = prev.positions[idx];
            vel = {
              x: (pos.x - prevPos.x) / dt,
              y: (pos.y - prevPos.y) / dt,
              z: (pos.z - prevPos.z) / dt,
            };
            speed = Math.hypot(vel.x, vel.y, vel.z);
            // vector from fingertip to palm (centroid)
            const pc = out.palm;
            const vecToPalm = { x: pc.x - pos.x, y: pc.y - pos.y, z: pc.z - pos.z };
            const distToPalm = Math.hypot(vecToPalm.x, vecToPalm.y, vecToPalm.z);

            // project velocity onto vectorToPalm direction
            // projection = dot(vel, unit(vecToPalm))
            if (distToPalm > 1e-9 && speed > 1e-9) {
              const projSpeed = (vel.x * vecToPalm.x + vel.y * vecToPalm.y + vel.z * vecToPalm.z) / distToPalm;
              // projSpeed > 0 means moving toward palm
              if (projSpeed > 1e-6) {
                predictedTtiMs = (distToPalm / projSpeed) * 1000;
              } else {
                predictedTtiMs = Infinity;
              }
            } else {
              predictedTtiMs = Infinity;
            }
          }
        }

        // compute distance to palm (fresh)
        const pc = out.palm;
        const dx = pc.x - pos.x;
        const dy = pc.y - pos.y;
        const dz = pc.z - pos.z;
        const distanceToPalm = Math.hypot(dx, dy, dz);

        out.fingertips.push({
          index: idx,
          pos,
          vel,
          speed,
          distanceToPalm,
          predictedTtiMs,
        });
      }

      // store history
      const store = {
        tMs,
        positions: {},
      };
      for (const idx of this.indices) {
        const p = landmarks[idx] || { x: 0, y: 0, z: 0 };
        store.positions[idx] = { x: Number(p.x || 0), y: Number(p.y || 0), z: Number(p.z || 0) };
      }
      this.history.set(id, store);

      // purge old entries
      for (const [k, v] of Array.from(this.history.entries())) {
        if (typeof v.tMs === 'number' && tMs - v.tMs > this.maxHistoryMs) {
          this.history.delete(k);
        }
      }

      results.push(out);
    }

    return results;
  }
}