// WEBWAY:ww-2025-068: Seat Magnet Manager (hex) — persistent anchors + autosnap
// Pure logic; no DOM. Inputs: frames with detections [{hand,handId,landmarks}], current seat map
// Outputs: events via onEvent callback; maintains an assignment map (handKey->seat) and anchors (seat->uv/lastSeen)

export function createSeatMagnetManager({
  radiusNorm = 0.08,
  autosnapWindowMs = 10 * 60 * 1000, // 10 minutes
  maxSeats = 4,
  onEvent = () => {},
  nowFn = () => (globalThis.performance ? performance.now() : Date.now())
} = {}){
  const anchors = new Map(); // seat -> { u, v, lastSeen, lastObsT, landmarks, velU, velV }
  const map = new Map();     // handKey -> seat
  const seatsTaken = new Set();

  function handKeyOf(d){ return `${d.hand}:${d.handId ?? ''}`; }
  function setAnchor(seat, u, v, t, landmarks){
    const prev = anchors.get(seat);
    let velU = prev?.velU || 0, velV = prev?.velV || 0;
    if(prev && typeof prev.lastObsT === 'number' && prev.u!=null && prev.v!=null && t>prev.lastObsT){
      const dt = (t - prev.lastObsT) / 1000; // seconds
      if(dt > 0){ velU = (u - prev.u) / dt; velV = (v - prev.v) / dt; }
    }
    anchors.set(seat, {
      u, v,
      lastSeen: t,
      lastObsT: t,
      landmarks: Array.isArray(landmarks)? landmarks : (prev?.landmarks || null),
      velU, velV
    });
  }
  function assignSeat(seat, handKey){
    // Singleton seats: only one owner; avoid duplicate seat usage
    if(seatsTaken.has(seat)) return false;
    // Ensure handKey not already seated elsewhere
    if(map.has(handKey)) return false;
    map.set(handKey, seat);
    seatsTaken.add(seat);
    onEvent({ type: 'seat:snap', seat, handKey });
    return true;
  }
  function releaseSeat(seat){
    if(!seatsTaken.has(seat)) return;
    seatsTaken.delete(seat);
    for(const [hk, st] of map.entries()) if(st===seat) map.delete(hk);
    onEvent({ type: 'seat:release', seat });
  }
  function getSeatForHand(handKey){ return map.get(handKey) || null; }
  function getMap(){ return new Map(map); }
  function getAnchors(){ return new Map(anchors); }

  // Update active seats and anchors from external seat map (optional)
  function syncFromSeatMap(seatMap){
    if(!seatMap) return;
    const t = nowFn();
    for(const [seat, info] of Object.entries(seatMap)){
      if(!info) continue;
      // info should contain handKey or uv
      if(info.handKey){
        if(!seatsTaken.has(seat)){
          seatsTaken.add(seat);
          map.set(info.handKey, seat);
        }
      }
      if(typeof info.u === 'number' && typeof info.v === 'number') setAnchor(seat, +info.u, +info.v, t);
    }
  }

  function onFrame({ dets = [], seats = {}, autosnap = true } = {}){
    const t = nowFn();
    // Refresh anchors from seated detections
    for(const d of dets){
      const hk = handKeyOf(d);
      const seat = seats[hk] || getSeatForHand(hk) || null;
      if(seat){
        // Wrist at landmarks[0]
        const lms = d.landmarks || [];
        if(lms[0] && typeof lms[0][0]==='number' && typeof lms[0][1]==='number'){
          setAnchor(seat, lms[0][0], lms[0][1], t, lms);
        }
      }
    }
    if(!autosnap) return;
    // If seats available under maxSeats, snap nearest unseated wrists that are inside an active seat's radius and within window
    const activeSeats = Array.from(anchors.keys());
    if(activeSeats.length === 0) return;
    // Build unseated wrists
    const unseated = [];
    for(const d of dets){
      const hk = handKeyOf(d);
      if(getSeatForHand(hk)) continue; // already seated
      const l0 = d.landmarks && d.landmarks[0];
      if(!l0) continue;
      if(map.size >= maxSeats) break;
      unseated.push({ handKey: hk, u: l0[0], v: l0[1] });
    }
    // For each anchor, see if any unseated inside radius; snap the closest
    for(const seat of activeSeats){
      if(seatsTaken.has(seat)) continue; // seat already occupied
      const anc = anchors.get(seat);
      if(!anc) continue;
      const age = t - (anc.lastSeen||0);
      const withinWindow = age <= autosnapWindowMs;
      // Always allow immediate autosnap within window (per spec); beyond window, caller can require gesture separately
      let best = null; let bestDist = Infinity;
      for(const u of unseated){
        const du = u.u - anc.u, dv = u.v - anc.v;
        const dist2 = du*du + dv*dv;
        if(dist2 <= radiusNorm*radiusNorm && dist2 < bestDist){ best = u; bestDist = dist2; }
      }
      if(best && withinWindow){ assignSeat(seat, best.handKey); }
    }
  }
  // Inertial ghost prediction (decayed velocity)
  function getGhost(seat, opts={}){
    const { frictionPerSec = 0.85 } = opts; // velocity multiplier per second
    const a = anchors.get(seat); if(!a) return null;
    const t = nowFn(); const t0 = a.lastObsT ?? a.lastSeen ?? t;
    const dt = Math.max(0, (t - t0) / 1000);
    // decay factor
    const decay = Math.pow(frictionPerSec, dt);
    const du = (a.velU || 0) * dt * decay;
    const dv = (a.velV || 0) * dt * decay;
    const u = a.u + du; const v = a.v + dv;
    let landmarks = null;
    if(Array.isArray(a.landmarks)){
      const l0 = a.landmarks[0];
      if(l0 && typeof l0[0]==='number' && typeof l0[1]==='number'){
        const offU = u - a.u, offV = v - a.v;
        landmarks = a.landmarks.map(pt => (Array.isArray(pt) && pt.length>=2) ? [ (pt[0] + offU), (pt[1] + offV), pt[2] ?? 0 ] : pt);
      }
    }
    return { u, v, landmarks };
  }

  return { onFrame, setAnchor, assignSeat, releaseSeat, getSeatForHand, getMap, getAnchors, syncFromSeatMap, getGhost };
}
