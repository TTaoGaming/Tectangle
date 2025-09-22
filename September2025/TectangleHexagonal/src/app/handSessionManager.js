/*
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
 - [ ] Re-evaluate this artifact against current Hexagonal goals
 - [ ] Verify dependent modules and update factorization notes
 - [ ] Log decisions in TODO_2025-09-16.md
*/

// HandSessionManager: orchestrates per-hand pinch cores (pure domain cores) and emits unified events.
// WEBWAY:ww-2025-006: HandSessionManager extraction (expires 2025-10-07)
import { createPinchCore } from '../core/pinchCore.js';
import { createAnchorJoystickCore } from '../core/anchorJoystickCore.js';
import { flag } from './featureFlags.js';
import { createWristOrientationCore } from '../core/wristOrientationCore.js'; // WEBWAY:ww-2025-006 wrist orientation integration (expires 2025-10-07)
import { createFingerGeometryCore } from '../core/fingerGeometryCore.js'; // WEBWAY:ww-2025-007 finger geometry scaffold (expires 2025-10-08)

export function createHandSessionManager(config = {}) {
  const C = Object.assign({
    pinch: { enterThresh: 0.40, exitThresh: 0.70, palmGate: true },
    createCore: createPinchCore,
  orientation: { enabled: false, emitUnchanged: false },
  fingerGeometry: { enabled: false },
    staleMs: 1000,
  }, config);

  const subs = new Set();
  function emit(e) { subs.forEach(h => { try { h(e); } catch {} }); }

  const hands = new Map(); // key -> { core, unsub, meta, anchor?, anchorUnsub?, orient?, orientUnsub? }

  function keyFor(frame) {
    if (frame.handId != null) return `id:${frame.handId}`;
    if (frame.hand) return `hand:${frame.hand}`;
    return 'hand:Unknown';
  }

  function ensureEntry(key, seed = {}) {
    let entry = hands.get(key);
    if (entry) return entry;
    const core = C.createCore({ ...C.pinch }); // Forward pinch config only (pure core) WEBWAY:ww-2025-006
    const meta = { hand: seed.hand || null, handId: seed.handId ?? null, lastT: 0 };
    const unsub = core.on(evt => {
      const enriched = { ...evt, hand: meta.hand, handId: meta.handId, handKey: key };
      emit(enriched);
    });
    let orient = null, orientUnsub = null;
    let finger = null, fingerUnsub = null;
    if (C.orientation && C.orientation.enabled) {
      orient = createWristOrientationCore({ emitUnchanged: C.orientation.emitUnchanged });
      orientUnsub = orient.on(oEvt => {
        const enriched = { ...oEvt, hand: meta.hand, handId: meta.handId, handKey: key };
        emit(enriched);
      });
    }
    if (C.fingerGeometry && C.fingerGeometry.enabled) {
      finger = createFingerGeometryCore();
      fingerUnsub = finger.on(fEvt => {
        const enriched = { ...fEvt, hand: meta.hand, handId: meta.handId, handKey: key };
        emit(enriched);
      });
    }
    entry = { core, unsub, meta, orient, orientUnsub, finger, fingerUnsub };
    hands.set(key, entry);
    return entry;
  }

  function onFrame(frame) {
    if (!frame || typeof frame.t !== 'number') return;
    const key = keyFor(frame);
    const entry = ensureEntry(key, { hand: frame.hand, handId: frame.handId });
    entry.meta.hand = frame.hand || entry.meta.hand;
    if (frame.handId != null) entry.meta.handId = frame.handId;
    entry.meta.lastT = frame.t;
    let metrics = null;
    try { metrics = entry.core.update(frame); } catch {}
    // WEBWAY:ww-2025-024 live metrics tick: publish per-frame compact metrics for rich snapshot updates (expires 2025-10-12)
    if (metrics && typeof metrics === 'object') {
      try {
        emit({ type: 'pinch:metrics', t: frame.t, hand: entry.meta.hand, handId: entry.meta.handId, handKey: key, frame: metrics });
      } catch {}
    }
    if (entry.orient) { try { entry.orient.update(frame); } catch {} }
    if (entry.finger) { try { entry.finger.update(frame); } catch {} }
    // GC stale entries optionally
    if (C.staleMs > 0) {
      const cutoff = frame.t - C.staleMs;
      for (const [k, e] of hands.entries()) {
        if (e.meta.lastT < cutoff) {
          try { e.unsub && e.unsub(); } catch {}
          hands.delete(k);
        }
      }
    }
  }

  function state() {
    const now = Date.now();
    return {
      hands: [...hands.entries()].map(([k, e]) => ({
        key: k,
        hand: e.meta.hand,
        handId: e.meta.handId,
        ageMs: now - e.meta.lastT,
        // Light pinch snapshot for labs (safe: derived only; no heavy objects)
        pinch: (e.core && e.core.getState) ? e.core.getState() : undefined
      }))
    };
  }

  // Runtime pinch config update (labs/tests)
  function updatePinchConfig(part){
    if(!part || typeof part!=='object') return C.pinch;
    Object.assign(C.pinch, part);
    // Patch existing cores
    for(const e of hands.values()){
      try { e.core && e.core.setConfig && e.core.setConfig(C.pinch); } catch {}
    }
    return C.pinch;
  }

  return {
    onFrame,
    on(handler) { subs.add(handler); return () => subs.delete(handler); },
    state,
    updatePinchConfig,
    dispose() {
      for (const e of hands.values()) {
        try { e.unsub && e.unsub(); } catch {}
        try { e.anchorUnsub && e.anchorUnsub(); } catch {}
        try { e.anchor && e.anchor.reset(); } catch {}
        try { e.orientUnsub && e.orientUnsub(); } catch {}
        try { e.fingerUnsub && e.fingerUnsub(); } catch {}
      }
      hands.clear(); subs.clear();
    },
  };
}









