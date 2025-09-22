// WEBWAY:ww-2025-050 — SDK-placed TTI recorder
export function createTTIRecorder({ getLookaheadMs }){
  const perHand = new Map(); // handKey -> { lastNorm:number|null, predTimeMs:number|null }
  const samples = [];
  function ensure(handKey){ let s = perHand.get(handKey); if(!s){ s = { lastNorm: null, predTimeMs: null }; perHand.set(handKey, s); } return s; }
  function update({ now, handKey, snap, kalman, enterThresh }){
    const st = ensure(handKey);
    const norm = (snap?.norm!=null)? snap.norm : null;
    // Predicted trigger time: prefer Kalman-provided absolute prediction if present
    // WEBWAY:ww-2025-051: prefer absolute TOI from Kalman when available; otherwise unit-correct fallback
    if(kalman && Number.isFinite(kalman.toiPredAbsK)){
      st.predTimeMs = kalman.toiPredAbsK;
    } else if(kalman && typeof kalman.x==='number' && typeof kalman.v==='number'){
      // Fallback: linear crossing estimate with correct units
      const x = kalman.x, vPerSec = kalman.v;
      const dv = vPerSec;
      const needsUpward = (dv > 0 && x < enterThresh);
      const needsDownward = (dv < 0 && x > enterThresh);
      if((needsUpward || needsDownward) && Math.abs(dv) > 1e-6){
        const dtSec = Math.abs(enterThresh - x) / Math.abs(dv); // seconds
        const tPred = now + Math.max(0, dtSec*1000);
        st.predTimeMs = tPred;
      }
    }
    // Actual threshold crossing
    if(st.lastNorm!=null && norm!=null){
      if(st.lastNorm < enterThresh && norm >= enterThresh){
        if(st.predTimeMs!=null){
          const lookahead = +getLookaheadMs?.() || 0;
          const tti = now - st.predTimeMs;
          const err = tti - lookahead;
          samples.push({ t: now, lookahead_ms: lookahead, pred: st.predTimeMs, actual: now, tti, err, handKey, seat: snap?.seat ?? null, handId: snap?.handId ?? null });
        }
        st.predTimeMs = null;
      }
    }
    st.lastNorm = norm;
  }
  function getSamples(){ return samples.slice(); }
  return { update, getSamples };
}
