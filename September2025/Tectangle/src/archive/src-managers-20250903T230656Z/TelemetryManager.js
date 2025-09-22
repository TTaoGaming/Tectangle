/**
 * TelemetryManager - minimal testable header
 */

export const __HEADER__ = "TelemetryManager.v1";

export default class TelemetryManager {
  constructor({ sink } = {}) {
    this._sink = sink || null;
    this._buffer = [];
  }

  record(envelope = {}) {
    if (!envelope || typeof envelope !== "object") return false;
    this._buffer.push(envelope);
    return true;
  }

  flush() {
    const out = this._buffer.slice();
    this._buffer.length = 0;
    return out;
  }

  destroy() {
    this._buffer.length = 0;
    this._sink = null;
    return { ok: true };
  }
}