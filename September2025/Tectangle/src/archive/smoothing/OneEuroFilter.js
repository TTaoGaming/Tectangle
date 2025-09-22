/* ARCHIVE STUB: OneEuroFilter
 *
 * NOTE: The One Euro filter implementation has been inlined into
 * `src/LandmarkSmoothManager.js` to keep smoothing logic self-contained.
 * This file is retained as a small backward-compatible stub so any
 * existing imports won't break. The stub is a pass-through filter and
 * logs a deprecation notice.
 *
 * Do not rely on this stub for production smoothing. Use LandmarkSmoothManager
 * (setConfig to tune oneEuro params) which contains the canonical implementation.
 *
 * Created by archive action 2025-08-29
 */
export default class OneEuroFilter {
  constructor(opts = {}) {
    this._warnOnce();
    this.minCutoff = Number(opts.minCutoff ?? 1.0);
    this.beta = Number(opts.beta ?? 0.007);
    this.dCutoff = Number(opts.dCutoff ?? 1.0);
    this._x = null;
    this._dx = 0;
    this._t = null;
  }

  _warnOnce() {
    if (typeof console !== "undefined" && !OneEuroFilter._warned) {
      console.warn(
        "OneEuroFilter (stub): filter implementation archived and inlined into LandmarkSmoothManager. This stub is a pass-through."
      );
      OneEuroFilter._warned = true;
    }
  }

  // Pass-through filter to preserve API compatibility
  filter(value, tMs) {
    return Number(value ?? 0);
  }

  reset() {
    this._x = null;
    this._dx = 0;
    this._t = null;
  }
}
