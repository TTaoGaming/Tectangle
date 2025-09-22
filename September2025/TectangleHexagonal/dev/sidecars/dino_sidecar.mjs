// WEBWAY:ww-2025-008: Dino sidecar with predictive vs actual TOI and session EMA bias

export function createDinoSidecar(options = {}) {
  const cfg = {
    code: options.code || 'Digit1',
    key: options.key || '1',
    biasAlpha: options.biasAlpha ?? 0.2, // EMA smoothing
    target: options.target || (typeof window !== 'undefined' ? window : null),
    // WEBWAY:ww-2025-056: seat filter (default P1)
    seat: options.seat || 'P1',
  };

  let attached = false;
  let sdk = null;
  let unsub = [];
  let biasMsDown = 0; // EMA of (actual - predicted)
  const stats = {
    downs: 0,
    ups: 0,
    predDown: [],
    actualDown: [],
    errorsDown: [], // actual - predicted
    jitterDown: [], // successive diffs of error
    rejectedBySeat: 0,
    seat: 'P1',
  };

  function nowMs() {
    return (typeof performance !== 'undefined' ? performance.now() : Date.now());
  }

  function scheduleAt(msAbs, fn) {
    const delay = Math.max(0, msAbs - nowMs());
    return setTimeout(fn, delay);
  }

  function emitKey(action, reason) {
    if (!cfg.target) return;
    try {
      // PostMessage for robust consumption by game/side processes
      cfg.target.postMessage({ type: 'dino:key', action, code: cfg.code, key: cfg.key, ts: Date.now(), reason }, '*');
    } catch {}
    try {
      // Local KeyboardEvent (not isTrusted, but fine for demo wiring)
      const type = action === 'down' ? 'keydown' : 'keyup';
      // Try to nudge legacy listeners (Dino uses keyCode)
      const init = { code: cfg.code, key: cfg.key, bubbles: true, cancelable: true };
      if (cfg.code === 'Space' || cfg.key === ' ' || cfg.key === 'Space') {
        init.keyCode = 32; init.which = 32;
      }
  const EventCtor = (cfg.target && cfg.target.KeyboardEvent) ? cfg.target.KeyboardEvent : KeyboardEvent;
  const ev = new EventCtor(type, init);
      // Force legacy properties for frameworks relying on them
      if ((init.keyCode === 32) || init.code === 'Space' || init.key === ' ') {
        try { Object.defineProperty(ev, 'keyCode', { get: ()=>32 }); } catch {}
        try { Object.defineProperty(ev, 'which', { get: ()=>32 }); } catch {}
      }
      const tgtWin = cfg.target;
      const doc = (tgtWin && (tgtWin.document || tgtWin.contentDocument)) || (typeof document !== 'undefined' ? document : null);
      if (doc && typeof doc.dispatchEvent === 'function') { try{ doc.dispatchEvent(ev);}catch{} }
      try{ cfg.target.dispatchEvent(ev); }catch{}
      // Try canvas element target as some games listen there
      try{
        const canvas = (doc && doc.querySelector && doc.querySelector('canvas')) || null;
        if (canvas && typeof canvas.dispatchEvent === 'function') canvas.dispatchEvent(ev);
      }catch{}
    } catch {}
  }

  function emaUpdate(current, sample, alpha) {
    return (1 - alpha) * current + alpha * sample;
  }

  function onPinchDownOrConfirm(ev) {
    // Seat filter: accept only matching seat; fallback map from hand if seat missing
    const evSeat = ev?.seat || seatFromHand(ev?.hand);
    if (cfg.seat && evSeat && evSeat !== cfg.seat) {
      stats.rejectedBySeat++;
      return;
    }
    // Predicted absolute TOI from Kalman if present, else velocity-based, else immediate
    const tPred = ev?.toiPredAbsK ?? ev?.toiPredAbsV ?? nowMs();
    const tPredBiased = tPred - biasMsDown; // pull earlier by bias toward 0ms perceived
    stats.predDown.push(tPred);
    scheduleAt(tPredBiased, () => emitKey('down', 'predicted'));

    // Actual enter absolute, if provided, records ground truth
    const tActual = ev?.toiActualEnterAbs ?? nowMs();
    stats.actualDown.push(tActual);
    const err = tActual - tPred;
    stats.errorsDown.push(err);
    if (stats.errorsDown.length > 1) {
      const n = stats.errorsDown.length;
      stats.jitterDown.push(Math.abs(stats.errorsDown[n - 1] - stats.errorsDown[n - 2]));
    }
    biasMsDown = emaUpdate(biasMsDown, err, cfg.biasAlpha);
    stats.downs += 1;
  }

  function onPinchUp(ev) {
    // Seat filter for up as well
    const evSeat = ev?.seat || seatFromHand(ev?.hand);
    if (cfg.seat && evSeat && evSeat !== cfg.seat) {
      stats.rejectedBySeat++;
      return;
    }
    emitKey('up', 'actual');
    stats.ups += 1;
  }

  function attach({ sdk: _sdk } = {}) {
    if (attached) return;
    sdk = _sdk;
    if (!sdk || typeof sdk.on !== 'function') return;
    attached = true;
    // Schedule on earliest reliable event
    unsub.push(sdk.on('pinch:down', onPinchDownOrConfirm));
    unsub.push(sdk.on('pinch:confirm', onPinchDownOrConfirm));
    unsub.push(sdk.on('pinch:up', onPinchUp));
  }

  function detach() {
    for (const u of unsub) try { u && u(); } catch {}
    unsub = [];
    attached = false;
  }

  function getSummary() {
    const mean = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    const sorted = (arr) => [...arr].sort((a, b) => a - b);
    const p95 = (arr) => {
      if (!arr.length) return 0;
      const s = sorted(arr);
      const idx = Math.floor(0.95 * (s.length - 1));
      return s[idx];
    };
    const abs = (arr) => arr.map((x) => Math.abs(x));
    return {
      downs: stats.downs,
      ups: stats.ups,
      seat: cfg.seat,
      rejectedBySeat: stats.rejectedBySeat,
      biasMsDown: +biasMsDown.toFixed(2),
      errorDown: {
        mean: +mean(stats.errorsDown).toFixed(2),
        p95: +p95(abs(stats.errorsDown)).toFixed(2),
        maxAbs: +(stats.errorsDown.length ? Math.max(...abs(stats.errorsDown)) : 0).toFixed(2),
        jitterP95: +p95(stats.jitterDown).toFixed(2),
        samples: stats.errorsDown.length,
      },
    };
  }

  return {
    attach,
    detach,
    getSummary,
    setParams: (params = {}) => {
      if (params.biasAlpha != null) cfg.biasAlpha = params.biasAlpha;
      if (params.code) cfg.code = params.code;
      if (params.key) cfg.key = params.key;
      if (params.target) cfg.target = params.target;
      if (params.seat) { cfg.seat = params.seat; stats.seat = cfg.seat; }
    },
  };
}

// WEBWAY:ww-2025-056: fallback seat mapping from hand
function seatFromHand(hand) {
  if (!hand) return undefined;
  const h = String(hand).toLowerCase();
  if (h.startsWith('l')) return 'P1';
  if (h.startsWith('r')) return 'P2';
  return undefined;
}
