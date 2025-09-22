// Minimal, self-contained pinch core for portable smoke
// Emits events: { type: 'pinch:down'|'pinch:up', t }

export function createPinchCore(cfg = {}) {
  const enterThresh = cfg.enterThresh ?? 0.40;
  const exitThresh = cfg.exitThresh ?? 0.60;
  const debounceMs = cfg.debounceMs ?? 40;
  const palmConeDeg = cfg.palmConeDeg ?? 30; // placeholder, not enforced without normals

  let state = 'up';
  let lastChangeT = -Infinity;
  const listeners = new Set();

  function dist(a, b) {
    const ax = Array.isArray(a) ? a[0] : a?.x ?? 0;
    const ay = Array.isArray(a) ? a[1] : a?.y ?? 0;
    const bx = Array.isArray(b) ? b[0] : b?.x ?? 0;
    const by = Array.isArray(b) ? b[1] : b?.y ?? 0;
    const dx = ax - bx, dy = ay - by;
    return Math.hypot(dx, dy);
  }

  function normSpan(indexMCP, pinkyMCP) {
    if (!indexMCP || !pinkyMCP) return 1; // fallback
    const d = dist(indexMCP, pinkyMCP);
    return d > 1e-6 ? d : 1;
  }

  function emit(evt) { listeners.forEach(fn => { try { fn(evt); } catch {} }); }

  function update(frame) {
    if (!frame || typeof frame.t !== 'number') return;
    const t = frame.t;
    const d = dist(frame.indexTip, frame.thumbTip) / normSpan(frame.indexMCP, frame.pinkyMCP);
    // Simple hysteresis with debounce
    if (state === 'up' && d <= enterThresh && (t - lastChangeT) >= debounceMs) {
      state = 'down';
      lastChangeT = t;
      emit({ type: 'pinch:down', t });
    } else if (state === 'down' && d >= exitThresh && (t - lastChangeT) >= debounceMs) {
      state = 'up';
      lastChangeT = t;
      emit({ type: 'pinch:up', t });
    }
  }

  return {
    on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    update,
    getState() { return state; }
  };
}

