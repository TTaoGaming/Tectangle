/* ARCHIVE STUB: Kalman2D
 *
 * NOTE: The Kalman2D implementation has been inlined into
 * `src/LandmarkSmoothManager.js` to keep smoothing logic self-contained.
 * This file is retained as a small backward-compatible stub so any
 * existing imports won't break. The stub performs minimal pass-through
 * behavior and logs a deprecation notice.
 *
 * Do not rely on this stub for production filtering. Use LandmarkSmoothManager
 * (setConfig to tune kalman params) which contains the canonical implementation.
 *
 * Created by archive action 2025-08-29
 */
export default class Kalman2D {
  constructor(opts = {}) {
    const { initX = 0, initY = 0 } = opts || {};
    this._warnOnce();
    this._x = [Number(initX) || 0, Number(initY) || 0, 0, 0];
  }

  _warnOnce() {
    if (typeof console !== "undefined" && !Kalman2D._warned) {
      console.warn(
        "Kalman2D (stub): implementation archived and inlined into LandmarkSmoothManager. This stub is a pass-through."
      );
      Kalman2D._warned = true;
    }
  }

  // Predict step (stub) — returns current predicted position
  predict(dt) {
    // no-op predict in stub
    return { x: this._x[0], y: this._x[1] };
  }

  // Update step (stub) — overwrite position with measurement
  update(mx, my, rScale = 1) {
    this._x[0] = Number(mx) || 0;
    this._x[1] = Number(my) || 0;
    return this.state();
  }

  state() {
    return {
      x: this._x[0],
      y: this._x[1],
      vx: this._x[2] || 0,
      vy: this._x[3] || 0,
    };
  }

  reset(initX = 0, initY = 0) {
    this._x = [Number(initX) || 0, Number(initY) || 0, 0, 0];
  }
}
