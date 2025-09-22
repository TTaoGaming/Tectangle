// WEBWAY:ww-2025-018: seat-lock gated enrichment adapter
export function createSeatLockRichAdapter({ shell, vmCore, stableFrames = 8, maxHistory = 60 }) { // WEBWAY:ww-2025-018 enrichment jointAngles+history
  const state = { frame: 0, seatsStableCount: {}, lastSeatIds: {}, enriched: {}, freezeInject:false };
  function inject(seatId, patch){ state.enriched[seatId] = Object.assign({}, state.enriched[seatId]||{ seat:seatId }, patch); }
  function freeze(){ state.freezeInject = true; }
  function unfreeze(){ state.freezeInject = false; }
  // WEBWAY:ww-2025-025: continuity merge (fill-forward). Only fills when current frame has null/undefined, never overwrites explicit 0.
  function continuityMerge(prev, curr){
    if(!prev) return curr;
    const out = { ...curr };
    const fields = ['norm','rawNorm','velocity','acceleration','palmAngleDeg'];
    for(const f of fields){ if(out[f] == null && prev[f] != null) out[f] = prev[f]; }
    // Nested joint angles: index mcp/pip/dip
    const pIdx = (prev.jointAngles && prev.jointAngles.index) || {};
    const cIdx = (out.jointAngles && out.jointAngles.index) || {};
    const idxOut = { ...cIdx };
    for(const f of ['mcpDeg','pipDeg','dipDeg']){ if(idxOut[f] == null && pIdx[f] != null) idxOut[f] = pIdx[f]; }
    if(Object.keys(idxOut).length){ out.jointAngles = out.jointAngles || {}; out.jointAngles.index = idxOut; }
    // thresholds/historyLen/history left as-is from producer
    return out;
  }
  function tick() {
    if(state.freezeInject) return; // WEBWAY:ww-2025-023 allow frozen state for test injection
    state.frame++;
    const snap = vmCore.snapshot();
    // WEBWAY:ww-2025-021 adapter robustness: shell.getRichSnapshot() currently returns an Array of per-hand rich entries
    // Normalize to object maps for fast lookup by seat + handKey.
    const richRaw = shell.getRichSnapshot ? shell.getRichSnapshot() : null;
    let richHandsArr = Array.isArray(richRaw) ? richRaw : (richRaw && Array.isArray(richRaw.hands) ? richRaw.hands : []);
    // Build lookup maps
    const richBySeat = {};
    const richByHandKey = {};
    for(const r of richHandsArr){
      if(!r) continue; const seat = r.seat || null; const handKey = r.hand && (r.hand + ':' + (r.handId||''));
      if(seat){ (richBySeat[seat] || (richBySeat[seat]=[])).push(r); }
      if(handKey){ richByHandKey[handKey] = r; }
    }
    const seatIds = Object.keys(snap.seats || {}).length ? Object.keys(snap.seats) : ['P1','P2'];
    for (const seatId of seatIds) {
      const current = snap.seats[seatId];
      if (!current) { state.seatsStableCount[seatId] = 0; continue; }
      if (state.lastSeatIds[seatId] !== current) { state.seatsStableCount[seatId] = 0; state.lastSeatIds[seatId] = current; }
      state.seatsStableCount[seatId] = (state.seatsStableCount[seatId] || 0) + 1;
      const locked = state.seatsStableCount[seatId] >= stableFrames;
      const hands = snap.hands;
      // seatHand: find hand snapshot with seat property (added by ww-2025-021) or fall back to seat assignment state
      let seatHand = Object.values(hands).find(h => h.seat === seatId);
      if(!seatHand){
        // fallback: if vmCore seats mapping exists
        const mappedHandKey = snap.seats && snap.seats[seatId];
        if(mappedHandKey && hands[mappedHandKey]) seatHand = hands[mappedHandKey];
      }
      if (locked && seatHand) {
        // Prefer rich entry by seat, else by derived hand key
        let richHand = (richBySeat[seatId] && richBySeat[seatId][0]) || null;
        if(!richHand && seatHand.hand && seatHand.handId){
          const k = seatHand.hand + ':' + (seatHand.handId||'');
          richHand = richByHandKey[k] || null;
        }
        richHand = richHand || {};
        const history = Array.isArray(richHand.history) ? richHand.history.slice(-maxHistory) : null;
        const indexAngles = richHand.indexAngles || (seatHand.flex && { mcpDeg: seatHand.flex.mcpDeg, pipDeg: seatHand.flex.pipDeg, dipDeg: seatHand.flex.dipDeg }) || null;
        const thumbAngles = richHand.thumbAngles || null; // placeholder for future surface
  const pinchObj = seatHand.pinch || {};
  // Continuity: pinchObj may carry merged fields (normalizedGap/rawNormalizedGap/norm/rawNorm/vRel/aRel/ang)
        const orientObj = seatHand.orient || {};
        const velObj = seatHand.vel || {};
        const next = {
          seat: seatId,
          locked: true,
          id: current,
          norm: richHand.norm ?? pinchObj.normalizedGap ?? pinchObj.norm ?? pinchObj.rawNorm ?? null,
          rawNorm: richHand.rawNorm ?? pinchObj.rawNormalizedGap ?? pinchObj.rawNorm ?? null,
          velocity: richHand.velocity ?? pinchObj.vRel ?? velObj.velDegPerSec ?? velObj.vel ?? null,
          acceleration: richHand.acceleration ?? pinchObj.aRel ?? null,
          palmAngleDeg: richHand.palmAngleDeg ?? pinchObj.palmAngleDeg ?? pinchObj.ang ?? orientObj.angleDeg ?? orientObj.ang ?? null,
          thresholds: richHand.thresholds || {},
          historyLen: (richHand.history && richHand.history.length) || 0,
          history,
          jointAngles: { index: indexAngles, thumb: thumbAngles }
        };
        const prev = state.enriched[seatId];
        state.enriched[seatId] = continuityMerge(prev, next);
      } else if (seatHand) {
        state.enriched[seatId] = { seat: seatId, locked: false, id: current };
      }
    }
  }
  function snapshot() { return { enriched: state.enriched, stableCounts: { ...state.seatsStableCount } }; }
  return { tick, snapshot, _state: state, inject, freeze, unfreeze }; // WEBWAY:ww-2025-022 test visibility + ww-2025-023 helpers
}
