/* EARS_HEADER_START
TLDR: PredictiveLatencyManager — planning header for fingertip prediction and latency compensation (Kalman / simple motion models).

Purpose:
- Provide prediction to compensate for pipeline and network latency for critical fingertip landmarks.
- Acceptance criteria (planning): exposes setConfig, start, stop, destroy; will subscribe to landmark:clamped/landmark:smoothed and eventually emit predictive outputs (e.g., predictive:landmarks).
- This is a planning/header-only file (no runtime Kalman implementation here yet).

Notes:
- Header-only manager: lifecycle methods are no-ops returning { ok: true } to support integration testing and incremental implementation.
HEADER_META_START
{
  "name": "PredictiveLatencyManager",
  "tldr": "Header-only PredictiveLatencyManager — will perform fingertip prediction to reduce apparent latency.",
  "version": "0.1.0",
  "configDefaults": {
    "enablePrediction": false,
    "predictionMs": 50
  }
}
HEADER_META_END
EARS_HEADER_END */

import defaultEventBus from "./EventBusManager.js";

export default class PredictiveLatencyManager {
  constructor({ eventBus } = {}) {
    this._eventBus = eventBus || defaultEventBus;
    this._running = false;
    this._config = {};
  }

  setConfig(cfg = {}) {
    this._config = Object.assign({}, this._config, cfg);
    return { ok: true };
  }

  start() {
    if (this._running) return { ok: true };
    // header-only: no subscriptions yet
    this._running = true;
    return { ok: true };
  }

  stop() {
    if (!this._running) return { ok: true };
    // header-only: no unsubscriptions necessary
    this._running = false;
    return { ok: true };
  }

  destroy() {
    this.stop();
    this._config = {};
    return { ok: true };
  }
}
