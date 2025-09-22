// WEBWAY:ww-2025-050
// Pinch TTI recorder: computes predicted trigger time vs actual hysteresis crossing and error vs user lookahead

export function createTTIRecorder({ getLookaheadMs }){
  const perHand = new Map(); // handKey -> { lastNorm:number|null, predTimeMs:number|null }
  const samples = [];
  if(!globalThis.window.__ttiSamples) globalThis.window.__ttiSamples = samples;

  function ensure(handKey){ let s = perHand.get(handKey); if(!s){ s = { lastNorm: null, predTimeMs: null }; perHand.set(handKey, s); } return s; }

  function update({ now, handKey, snap, kalman, enterThresh }){
    const st = ensure(handKey);
    const norm = (snap?.norm!=null)? snap.norm : null;
    // Predicted trigger: prefer Kalman TOI if provided by port
    if(kalman && typeof kalman.toiPredAbsK === 'number' && isFinite(kalman.toiPredAbsK)){
      st.predTimeMs = kalman.toiPredAbsK;
    } else if(kalman && typeof kalman.x==='number' && typeof kalman.v==='number'){
      const x = kalman.x, v = kalman.v;
      if(v < 0 && (x - enterThresh) > 0){
        const ms = ( (x - enterThresh) / Math.abs(v) ) * 1000;
        const tPred = now + Math.max(0, ms);
        st.predTimeMs = tPred;
      }
    }
    // Actual crossing detection
    if(st.lastNorm!=null && norm!=null){
      if(st.lastNorm < enterThresh && norm >= enterThresh){
        if(st.predTimeMs!=null){
          const lookahead = +getLookaheadMs?.() || 0;
          const tti = now - st.predTimeMs;
          const err = tti - lookahead;
          const row = {
            t: now,
            lookahead_ms: lookahead,
            pred: st.predTimeMs,
            actual: now,
            tti,
            err,
            handKey,
            seat: snap?.seat ?? null,
            handId: snap?.handId ?? null,
          };
          samples.push(row);
        }
        st.predTimeMs = null; // reset after event
      }
    }
    st.lastNorm = norm;
  }

  function getSamples(){ return samples.slice(); }

  return { update, getSamples };
}
