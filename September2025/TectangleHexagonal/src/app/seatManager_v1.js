// WEBWAY:ww-2025-107: SeatManager v1 skeleton — unseated/seated with claim/hold/reacquire/release (behind FEATURE_SEAT_MANAGER_V1)

export function createSeatManager(cfg = {}) {
  const opts = {
    maxSeats: cfg.maxSeats ?? 4,
    claimMs: cfg.claimMs ?? 150,
    cooldownMs: cfg.cooldownMs ?? 600,
    lossGraceMs: cfg.lossGraceMs ?? 5000,
    snapRadius: cfg.snapRadius ?? 0.12,
  };

  const seats = {};
  const order = ['P1','P2','P3','P4'].slice(0, opts.maxSeats);
  for (const s of order) seats[s] = { key: null, anchor: null, lastSeen: 0 };
  const openPalmAt = new Map(); // key -> tStart
  const lastClaimAt = { t: 0 };

  function nextSeatName(){ return order.find(s => !seats[s].key) || null; }

  function onFrame(rawHands = [], stableIds = [], tNow = performance.now(), labelAtIndex = ()=>null, scoreAtIndex = ()=>null) {
    // Update open-palm timers (if recognizer labels provided)
    for (let i=0;i<rawHands.length;i++){
      const key = stableIds[i]; if(!key) continue;
      const lab = labelAtIndex(i);
      const sco = scoreAtIndex(i);
      const passScore = (sco == null) ? true : (sco >= 0.4);
      if (lab === 'Open_Palm' && passScore) {
        if (!openPalmAt.has(key)) openPalmAt.set(key, tNow);
      } else {
        openPalmAt.delete(key);
      }
    }

    // Avoid claims while any seat awaits reacquire within grace
    const awaiting = order.some(name => {
      const s = seats[name]; if(!s.key || !s.anchor) return false;
      const presentIdx = stableIds.findIndex(k => k === s.key);
      const withinGrace = (tNow - (s.lastSeen||0)) <= opts.lossGraceMs;
      return presentIdx < 0 && withinGrace;
    });

    if (!awaiting){
      const sinceClaim = tNow - (lastClaimAt.t||0);
      for (let i=0;i<rawHands.length;i++){
        const key = stableIds[i]; if(!key) continue;
        // skip keys that already have a seat
        if (order.some(n => seats[n].key === key)) continue;
        const start = openPalmAt.get(key);
        if (start && (tNow - start) >= opts.claimMs && sinceClaim >= opts.cooldownMs){
          const sname = nextSeatName(); if (sname){
            const w = rawHands[i]?.[0] || null;
            seats[sname].key = key;
            seats[sname].anchor = w ? [w.x, w.y] : null;
            seats[sname].lastSeen = tNow;
            lastClaimAt.t = tNow;
          }
        }
      }
    }

    // Maintain anchors and attempt snap-to-anchor when a seated hand is briefly lost
    for (const sname of order){
      const s = seats[sname]; if (!s.key) continue;
      const idx = stableIds.findIndex(k => k === s.key);
      if (idx >= 0) {
        const w = rawHands[idx]?.[0];
        if (w){ s.anchor = [w.x, w.y]; s.lastSeen = tNow; }
      } else if (s.anchor){
        // find nearest non-seated hand within snap radius
        let bestIdx = -1; let bestD = Infinity;
        for (let i=0;i<rawHands.length;i++){
          const key = stableIds[i]; if(!key) continue;
          if (order.some(n => seats[n].key === key)) continue;
          const w = rawHands[i]?.[0]; if (!w) continue;
          const dx = w.x - s.anchor[0], dy = w.y - s.anchor[1];
          const d = Math.hypot(dx, dy);
          if (d < bestD){ bestD = d; bestIdx = i; }
        }
        if (bestIdx >= 0 && bestD <= opts.snapRadius){
          const newKey = stableIds[bestIdx];
          s.key = newKey;
          const w = rawHands[bestIdx]?.[0];
          s.anchor = w ? [w.x, w.y] : s.anchor;
          s.lastSeen = tNow;
        }
      }
    }
  }

  function getSeatMap(){
    const copy = {}; for (const n of order){ copy[n] = { ...seats[n] }; }
    return copy;
  }

  function getState(){
    return { order: [...order], seats: getSeatMap(), timers: { openPalm: openPalmAt.size }, lastClaimAt: lastClaimAt.t };
  }

  return { onFrame, getSeatMap, getState };
}
