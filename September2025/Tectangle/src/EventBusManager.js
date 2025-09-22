/* EARS_HEADER_START
HEADER_META_START
{
  "name": "EventBusManager",
  "file": "`src/EventBusManager.js`",
  "tldr": "Central EventBus — normalize envelopes, provide publish/subscribe adapters (DOM + Node patterns), and a small helper API for publishFrom/publish/subscribe.",
  "purpose": "Provide a single authoritative event routing layer used by managers and prototypes. Normalize envelope shape, support DOM CustomEvent bridging, and offer convenience helpers for source-tagged publishes.",
  "stage": "planning",
  "author": "automated-assistant",
  "updated": "2025-08-30T16:38:26Z",
  "version": "0.1.0",
  "publicEvents": {
    "publishes": ["landmark:raw","landmark:smoothed","manager:diagnostic","telemetry:event","tectangle:gesture"],
    "subscribes": ["camera:frame","landmarkraw.setConfig","landmark:raw","landmark:smoothed"],
    "helpers": ["publishFrom(source,eventName,payload,meta,frameId)","publish(eventName,payload)","addEventListener(eventName,cb)"]
  },
  "api": [
    "addEventListener(eventName, callback) — normalized subscribe; returns unsubscribe",
    "publish(eventName, payload) — normalize envelope and forward to listeners",
    "publishFrom(source, eventName, payload, meta, frameId) — attach source/meta/frameId, then publish",
    "compat: on/off/emit for EventEmitter-like adapters"
  ],
  "nextActions": [
    "Create red tests for event normalization: `tests/unit/eventbus.normalization.test.mjs` (assert publish/publishFrom echo shape).",
    "Add a red smoke test: prototype consumes EventBus canonical 'landmark:raw' (prototype/landmark-raw/index.html uses EventBus).",
    "Define simple schema for key envelopes and add runtime validators in a later subtask (Option 3)."
  ]
}
HEADER_META_END
EARS_HEADER_END */

/**
 * TLDR: EventBusManager — Centralized pub/sub, envelope normalization and in-memory ring buffer for telemetry and inter-manager messaging (TREQ-EVT-001 / TREQ-EVT-002).
 *
 * Executive summary (5W1H):
 *  - Who: All managers in the Tectangle pipeline and QA/Watchdog/Telemetry consumers.
 *  - What: Normalize event envelopes, dispatch to subscribers and retain recent events in a ring buffer for diagnostics.
 *  *  - When: During runtime to deliver manager events and during tests to assert observable envelopes.
 *  *  - Where: Imported by managers and UI/watchdog tools in mobile/Chromebook demos and ESM tests.
 *  *  - Why: Prevent ad-hoc messaging, provide canonical telemetry shape, and enable deterministic diagnostics for CI.
 *  *  - How: Expose publish/addEventListener/getRecent APIs and dispatch window.CustomEvent where available.
 *
 * Top 3 immediate responsibilities:
 *  - Normalize and dispatch canonical event envelopes: { ts, manager, event, frameId, detail, tags }.
 *  - Maintain a ring buffer of recent events for diagnostics and allow retrieval via getRecent(n).
 *  - Provide simple per-event and global subscribe APIs and integrate with Watchdog and UI.
 *
 * API summary:
 *  - async init(), start(), stop(), destroy(), setParams(params)
 *  - addEventListener(eventName, cb), removeEventListener(eventName, cb)
 *  - publish(eventName, detail, tags, frameId), publishFrom(managerName, eventName, ...)
 *  *  - getRecent(n), clear()
 *
 * Test protocol summary:
 *  *  - Unit: publish synthetic envelopes and assert subscribers receive normalized envelopes; assert getRecent returns last N envelopes.
 *  *  - Golden/Smoke: publish > ringBufferSize envelopes and assert oldest entries are evicted; assert window.CustomEvent dispatched when env supports it.
 *  *  - Exact asserts: envelope.ts is number, envelope.manager is string, envelope.event is string, envelope.detail shape and frameId presence as expected.
 *
 * EARS Acceptance Criteria:
 *  *  - TREQ-EVT-001 — When a manager publishes an event via EventBusManager.publish(), the system shall emit a canonical envelope with shape { ts, manager, event, frameId, detail, tags } and dispatch it to registered subscribers.
 *  *  - TREQ-EVT-002 — When the number of published events exceeds the configured ringBufferSize, the system shall evict the oldest envelopes so that the ring buffer retains at most ringBufferSize recent events.
 *
 * UI_METADATA:
 *  *  { tabId: 'eventbus', title: 'Event Bus', order: 2 }
 *
 * Usage snippet:
 *  *  // import eventBus from './EventBusManager.js';
 *  *  // eventBus.publishFrom('CameraManager','landmark:raw', { landmarks }, { severity:'info' }, frameId);
 *
 * Header generated from: August Tectangle Sprint/foundation/docs/TECTANGLE_EARS_CANONICAL_2025-08-27T034212Z.md (2025-08-27T03:42:12Z)
 */

function deepFreeze(obj) {
  if (!obj || typeof obj !== "object" || Object.isFrozen(obj)) return obj;
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    try {
      const val = obj[key];
      if (val && typeof val === "object" && !Object.isFrozen(val))
        deepFreeze(val);
    } catch (e) {
      // ignore
    }
  }
  return obj;
}

export class EventBusManager {
  constructor({ ringBufferSize = 1024 } = {}) {
    this._listeners = new Map(); // eventName -> Set(callback)
    this._globalListeners = new Set();
    this._ring = [];
    this._ringSize = ringBufferSize;
    this._running = false;
  }

  // Add a per-event listener. Returns an unsubscribe function.
  addEventListener(eventName, cb) {
    const set = this._listeners.get(eventName) || new Set();
    set.add(cb);
    this._listeners.set(eventName, set);
    return () => this.removeEventListener(eventName, cb);
  }

  removeEventListener(eventName, cb) {
    const set = this._listeners.get(eventName);
    if (!set) return;
    set.delete(cb);
    if (set.size === 0) this._listeners.delete(eventName);
  }

  // Global subscribe (receives all envelopes)
  subscribeAll(cb) {
    this._globalListeners.add(cb);
    return () => this._globalListeners.delete(cb);
  }

  // Compatibility aliases
  on(eventName, cb) {
    return this.addEventListener(eventName, cb);
  }
  off(eventName, cb) {
    return this.removeEventListener(eventName, cb);
  }
  subscribe(eventName, cb) {
    return this.addEventListener(eventName, cb);
  }

  // Publish a canonical envelope and notify listeners.
  publish(eventName, detail = {}, tags = {}, frameId) {
    const envelope = {
      ts: Date.now(),
      manager: (detail && detail.manager) || undefined,
      event: eventName,
      frameId:
        typeof frameId !== "undefined" ? frameId : detail && detail.frameId,
      detail,
      tags,
    };

    // expose tags as envelope.meta for downstream consumers (non-breaking additive)
    envelope.meta = Object.assign({}, tags || {});

    // push to ring buffer
    this._ring.push(envelope);
    while (this._ring.length > this._ringSize) this._ring.shift();

    // notify per-event listeners
    const set = this._listeners.get(eventName);
    if (set) {
      for (const cb of Array.from(set)) {
        try {
          cb(envelope);
        } catch (err) {
          /* swallow listener errors */
        }
      }
    }

    // notify global listeners
    for (const cb of Array.from(this._globalListeners)) {
      try {
        cb(envelope);
      } catch (err) {
        /* swallow */
      }
    }

    // Return envelope for synchronous tests
    return envelope;
  }

  // Convenience: publishFrom(managerName, eventName, detail, tags, frameId)
  publishFrom(managerName, eventName, detail = {}, tags = {}, frameId) {
    // Normalize detail so consumers that inspect only detail see the same source/meta.
    const normalizedDetail = Object.assign({}, detail);

    // Ensure detail.meta includes tags and source
    normalizedDetail.meta = Object.assign(
      {},
      normalizedDetail.meta || {},
      tags || {}
    );
    normalizedDetail.meta.source = managerName;

    // Also set convenient top-level fields on detail for older consumers
    normalizedDetail.source = managerName;
    normalizedDetail.manager = managerName;

    // Envelope-level tags should also include source
    const tagsWithSource = Object.assign({}, tags || {}, {
      source: managerName,
    });

    // Publish the normalized detail and get the envelope
    const env = this.publish(
      eventName,
      normalizedDetail,
      tagsWithSource,
      frameId
    );

    // Ensure envelope meta/source present for envelope-level consumers
    try {
      if (!env.meta) env.meta = {};
      env.meta.source = managerName;
      env.source = managerName;
    } catch (e) {
      // noop
    }

    // Freeze in test mode to catch accidental mutation in consumers/tests
    if (
      typeof process !== "undefined" &&
      process.env &&
      process.env.NODE_ENV === "test"
    ) {
      try {
        deepFreeze(env);
      } catch (e) {
        // ignore freeze errors
      }
    }

    return env;
  }

  getRecent(n = 10) {
    return this._ring.slice(-n);
  }

  clear() {
    // Reset the ring buffer and remove all registered listeners so tests can
    // reliably isolate EventBus state between runs.
    try {
      if (this._listeners && typeof this._listeners.clear === "function") {
        this._listeners.clear();
      } else {
        this._listeners = new Map();
      }
      if (
        this._globalListeners &&
        typeof this._globalListeners.clear === "function"
      ) {
        this._globalListeners.clear();
      } else {
        this._globalListeners = new Set();
      }
    } catch (err) {
      // Fallback: reinitialize collections
      this._listeners = new Map();
      this._globalListeners = new Set();
    }
    this._ring.length = 0;
  }

  async init() {
    this._running = true;
    return { ok: true };
  }
  async start() {
    this._running = true;
    return { ok: true };
  }
  stop() {
    this._running = false;
    return { ok: true };
  }
}

const defaultBus = new EventBusManager();
export default defaultBus;
