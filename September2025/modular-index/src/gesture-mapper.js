// gesture-mapper.js
// GestureMapper: consumes fingertip/palm data and emits keydown/keyup callbacks
// for a simple index-finger "press" gesture gated by palm-facing.
//
// API:
//   import { GestureMapper } from './gesture-mapper.js';
//   const gm = new GestureMapper({ onKeyDown, onKeyUp, key: 'A', params: {...} });
//   gm.processFrame(assignedHands, fingertipResults, tMs);
//
// Notes:
// - assignedHands: [{ controllerId, landmarks, handedness, palmFacing }]
// - fingertipResults: produced by FingertipFilter.compute(...)
// - This module purposely only emits callbacks; UI wiring is left to the app.
// - TODO: Replace simple distance-hysteresis with learned contact model later.

import { FINGERTIP_INDICES } from './fingertip-filter.js';

export class GestureMapper {
  constructor({ onKeyDown = () => {}, onKeyUp = () => {}, key = 'A', params = {} } = {}) {
    this.onKeyDown = onKeyDown;
    this.onKeyUp = onKeyUp;
    this.key = key;

    // Tunable parameters (normalized landmark units)
    this.params = {
      pressOnDistance: params.pressOnDistance ?? 0.045, // distance (smaller => pressed)
      pressOffDistance: params.pressOffDistance ?? 0.07, // hysteresis release
      requirePalmFacing: params.requirePalmFacing ?? true, // orientation gate
      predictedTtiMsThreshold: params.predictedTtiMsThreshold ?? Infinity, // optional predictive gate
    };

    // internal state per controllerId
    // Map<controllerId, { pressed: bool, lastDistance: number, lastSeenMs: number }>
    this.state = new Map();
  }

  setParams(p = {}) {
    this.params = { ...this.params, ...p };
  }

  // Process a frame. fingertipResults should be an array of objects:
  // { controllerId, palm, fingertips: [ { index, pos, distanceToPalm, predictedTtiMs } ] }
  processFrame(assignedHands = [], fingertipResults = [], tMs = Date.now()) {
    const seen = new Set();

    for (const fr of fingertipResults) {
      const id = fr.controllerId;
      seen.add(id);

      const assigned = (assignedHands || []).find((a) => a.controllerId === id) || {};
      const palmFacing = Boolean(assigned.palmFacing);

      // find index fingertip entry
      const idxTip = (fr.fingertips || []).find((f) => f.index === FINGERTIP_INDICES.index);
      if (!idxTip) continue;

      const distance = Number(idxTip.distanceToPalm || 0);
      const predicted = Number(idxTip.predictedTtiMs || Infinity);
      const prev = this.state.get(id) ?? { pressed: false, lastDistance: Infinity, lastSeenMs: 0 };

      let newPressed = prev.pressed;

      // Orientation gate: require palm-facing to start/maintain press (configurable)
      if (this.params.requirePalmFacing && !palmFacing) {
        newPressed = false;
      } else {
        // Hysteresis: on when distance <= pressOnDistance, off when >= pressOffDistance
        if (!prev.pressed && distance <= this.params.pressOnDistance) {
          // optional predictive gate
          if (predicted <= this.params.predictedTtiMsThreshold) {
            newPressed = true;
          }
        } else if (prev.pressed && distance >= this.params.pressOffDistance) {
          newPressed = false;
        }
      }

      // Emit transitions
      if (!prev.pressed && newPressed) {
        try {
          this.onKeyDown({
            key: this.key,
            controllerId: id,
            timestampMs: tMs,
            predictedTtiMs: isFinite(predicted) ? predicted : null,
          });
        } catch (e) {
          console.error('GestureMapper onKeyDown handler threw', e);
        }
      } else if (prev.pressed && !newPressed) {
        try {
          this.onKeyUp({
            key: this.key,
            controllerId: id,
            timestampMs: tMs,
            predictedTtiMs: isFinite(predicted) ? predicted : null,
          });
        } catch (e) {
          console.error('GestureMapper onKeyUp handler threw', e);
        }
      }

      this.state.set(id, { pressed: newPressed, lastDistance: distance, lastSeenMs: tMs });
    }

    // Cleanup: any controllers not present this frame -> emit keyup if pressed and remove state
    for (const [id, st] of Array.from(this.state.entries())) {
      if (!seen.has(id)) {
        if (st.pressed) {
          try {
            this.onKeyUp({ key: this.key, controllerId: id, timestampMs: tMs, predictedTtiMs: null });
          } catch (e) {
            console.error('GestureMapper cleanup onKeyUp handler threw', e);
          }
        }
        this.state.delete(id);
      }
    }
  }

  // Force-reset all states (useful when filters or camera restart)
  reset() {
    // emit keyup for pressed states
    for (const [id, st] of Array.from(this.state.entries())) {
      if (st.pressed) {
        try {
          this.onKeyUp({ key: this.key, controllerId: id, timestampMs: Date.now(), predictedTtiMs: null });
        } catch (e) {
          console.error('GestureMapper reset onKeyUp handler threw', e);
        }
      }
    }
    this.state.clear();
  }
}