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

// Anchor Joystick core: listens to pinch events and frames to create a spatial anchor for pinch-hold drags.
// Pure domain module (no DOM). Emits anchor:start/update/end/cancel events.

export function createAnchorJoystickCore(options = {}) {
  const C = Object.assign({
    confirmHoldMs: 120,
    minUpdateDelta: 0.01,
    maxIdleMs: 2000,
  }, options || {});

  const listeners = new Set();
  function emit(evt) {
    listeners.forEach(h => { try { h(evt); } catch {} });
  }

  let state = 'idle';
  let pending = null; // { t, anchor: [x,y,z] }
  let anchor = null;
  let anchorT = 0;
  let lastVector = [0, 0, 0];
  let lastFrame = null;

  function reset() {
    state = 'idle';
    pending = null;
    anchor = null;
    anchorT = 0;
    lastVector = [0, 0, 0];
  }

  function computePoint(frame) {
    if (!frame) return null;
    const { indexTip, thumbTip } = frame;
    if (!Array.isArray(indexTip) || !Array.isArray(thumbTip)) return null;
    return [
      0.5 * (indexTip[0] + thumbTip[0]),
      0.5 * (indexTip[1] + thumbTip[1]),
      0.5 * ((indexTip[2] ?? 0) + (thumbTip[2] ?? 0))
    ];
  }

  function magnitude3(v) {
    return Math.hypot(v[0], v[1], v[2]);
  }

  function shouldUpdate(vec) {
    return Math.abs(vec[0] - lastVector[0]) >= C.minUpdateDelta ||
           Math.abs(vec[1] - lastVector[1]) >= C.minUpdateDelta ||
           Math.abs(vec[2] - lastVector[2]) >= C.minUpdateDelta;
  }

  function startAnchor(nowT, frame, meta = {}) {
    const point = computePoint(frame) || (pending && pending.anchor);
    if (!point) return;
    anchor = point;
    anchorT = nowT;
    lastVector = [0, 0, 0];
    state = 'anchored';
    emit({ type: 'anchor:start', t: nowT, anchor: [...anchor], vector: [...lastVector], ...meta });
  }

  function updateAnchor(nowT, frame, meta = {}) {
    if (state !== 'anchored' || !anchor) return;
    const point = computePoint(frame);
    if (!point) return;
    const vector = [point[0] - anchor[0], point[1] - anchor[1], point[2] - anchor[2]];
    if (!shouldUpdate(vector)) return;
    lastVector = vector;
    emit({ type: 'anchor:update', t: nowT, anchor: [...anchor], vector: [...vector], ...meta });
  }

  function endAnchor(type, nowT, meta = {}) {
    if (state !== 'anchored') {
      reset();
      return;
    }
    emit({ type, t: nowT, anchor: anchor ? [...anchor] : null, vector: [...lastVector], ...meta });
    reset();
  }

  function updateFrame(frame, meta = {}) {
    if (!frame || typeof frame.t !== 'number') return;
    lastFrame = frame;
    if (pending && frame.t - pending.t >= C.confirmHoldMs) {
      const startMeta = Object.assign({}, meta);
      startAnchor(frame.t, frame, startMeta);
      pending = null;
    }
    if (state === 'anchored') {
      updateAnchor(frame.t, frame, meta);
    }
    if (state === 'anchored' && C.maxIdleMs > 0 && frame.t - anchorT > C.maxIdleMs) {
      endAnchor('anchor:timeout', frame.t, meta);
    }
  }

  function onPinchEvent(evt, meta = {}) {
    const t = evt?.t ?? (lastFrame?.t ?? 0);
    if (!evt || !evt.type) return;
    switch (evt.type) {
      case 'pinch:down': {
        const anchorPoint = computePoint(lastFrame);
        pending = { t, anchor: anchorPoint };
        if (C.confirmHoldMs <= 0) {
          startAnchor(t, lastFrame, meta);
          pending = null;
        }
        break;
      }
      case 'pinch:hold': {
        if (state !== 'anchored' && pending) {
          if (t - pending.t >= C.confirmHoldMs) {
            startAnchor(t, lastFrame, meta);
            pending = null;
          }
        } else if (state === 'anchored') {
          updateAnchor(t, lastFrame, meta);
        }
        break;
      }
      case 'pinch:cancel': {
        pending = null;
        endAnchor('anchor:cancel', t, meta);
        break;
      }
      case 'pinch:up': {
        pending = null;
        endAnchor('anchor:end', t, meta);
        break;
      }
      default:
        break;
    }
  }

  return {
    updateFrame,
    onPinchEvent,
    on(handler) { listeners.add(handler); return () => listeners.delete(handler); },
    reset,
    getState() {
      return {
        state,
        anchor: anchor ? [...anchor] : null,
        vector: [...lastVector],
        pending: pending ? { t: pending.t, anchor: pending.anchor ? [...pending.anchor] : null } : null,
      };
    }
  };
}
