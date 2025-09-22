// WEBWAY:ww-2025-008: Hand Console ViewModel (pure aggregation layer)
// Purpose: unify pinch/orientation/flex/seats/landmarks aggregation for all console variants (V4–V6)
// Feature Flag: FEATURE_HAND_CONSOLE_VM
// TTL: 2025-10-08 (remove or graduate)
// Revert: delete this file + flag wiring; pages fallback to legacy per-page aggregation logic

/**
 * createHandConsoleViewModel
 * Pure (no DOM) event aggregator producing a readonly snapshot used by multiple console UIs.
 * Inputs: subscribe(fn) to core/app shell event bus; optional seat state getter (for fastOverlay / shell integration).
 * Outputs: { hands, seats, pinchLog, diag, lastFrame, ts }
 *
 * Event fields handled:
 *  - pinch:* (down/hold/up/cancel)
 *  - wrist:orientation, wrist:orientationVel
 *  - finger:index:angles
 *  - frame:landmarks (optional synthetic if provided by app shell)
 */
export function createHandConsoleViewModel(opts = {}) {
  if (!globalThis.__flags) globalThis.__flags = {}; // defensive
  if (!globalThis.__flags.FEATURE_HAND_CONSOLE_VM) {
    return null; // Flag disabled → callers should gracefully fallback.
  }
  const cfg = { pinchLogSize: 160, ...opts };
  const state = {
    hands: Object.create(null), // handKey -> { pinch, orient, vel, flex }
    seats: { P1: null, P2: null },
    pinchLog: [], // [{t,type,seat,handKey}]
    diag: { frames: 0, errors: 0, lastHandCount: 0 },
    lastFrame: null,
    ts: 0
  };

  function pushPinchLog(e) {
    state.pinchLog.push({ t: e.t, type: e.type, seat: e.seat || '', handKey: e.handKey || '' });
    const over = state.pinchLog.length - cfg.pinchLogSize;
    if (over > 0) state.pinchLog.splice(0, over);
  }

  function ensureHand(key) {
    if (!key) return null;
    let h = state.hands[key];
    if (!h) {
      h = { pinch: null, orient: null, vel: null, flex: null };
      state.hands[key] = h;
    }
    return h;
  }

  function onEvent(e) {
    try {
      state.ts = e.t || performance.now();
      if (e.type && e.type.startsWith('pinch:')) {
        const h = ensureHand(e.handKey);
        if (h) {
          // WEBWAY:ww-2025-023 continuity merge (TTL 2025-10-15): preserve last numeric telemetry if new pinch event omits it
          if (h.pinch) {
            const prev = h.pinch;
            const lacks = (fld)=>!(fld in e) || e[fld]==null;
            const copyFields = ['normalizedGap','rawNormalizedGap','norm','rawNorm','vRel','aRel','palmAngleDeg','ang'];
            let merged = false;
            for(const f of copyFields){ if(lacks(f) && prev[f]!=null){ if(!merged){ e = { ...e }; merged=true; } e[f] = prev[f]; } }
          }
          h.pinch = e;
        }
        pushPinchLog(e);
      } else if (e.type === 'wrist:orientation') {
        const h = ensureHand(e.handKey); if (h) h.orient = e;
      } else if (e.type === 'wrist:orientationVel') {
        const h = ensureHand(e.handKey); if (h) h.vel = e;
      } else if (e.type === 'finger:index:angles') {
        const h = ensureHand(e.handKey); if (h) h.flex = e;
      } else if (e.type === 'frame:landmarks') {
        state.lastFrame = e.frame || e.data || null; // flexible shape
      }
      // WEBWAY:ww-2025-021 seat propagation fix: ensure each hand record carries resolved seat for rich adapter lookup (TTL 2025-10-10)
      if (e.handKey && (e.seat === 'P1' || e.seat === 'P2' || e.seat === 'P3' || e.seat === 'P4')) {
        const h = ensureHand(e.handKey);
        if (h && h.seat !== e.seat) h.seat = e.seat;
      }
      if (e.seat === 'P1' && state.seats.P1 !== e.handKey) state.seats.P1 = e.handKey;
      if (e.seat === 'P2' && state.seats.P2 !== e.handKey) state.seats.P2 = e.handKey;
      state.diag.lastHandCount = Object.keys(state.hands).length;
    } catch (err) {
      state.diag.errors++;
      if (state.diag.errors < 4) console.warn('WEBWAY:ww-2025-008 vm event error', err, e);
    }
  }

  function attach(subscribe) {
    if (typeof subscribe === 'function') subscribe(onEvent);
  }

  function tick(frameMeta) {
    // Optional per-frame tick from a render loop, pass {landmarks?...}
    state.diag.frames++;
    if (frameMeta && frameMeta.landmarks) state.lastFrame = frameMeta;
  }

  function snapshot() {
    // Return a shallow-cloned readonly view
    return {
      hands: state.hands,
      seats: { ...state.seats },
      pinchLog: state.pinchLog.slice(),
      diag: { ...state.diag },
      lastFrame: state.lastFrame,
      ts: state.ts
    };
  }

  return { onEvent, attach, snapshot, tick, _state: state };
}

// WEBWAY:ww-2025-008:end