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

// Pure Controller Router core (no DOM). Exports a factory to create a router instance.
// Assigns seats on pinch:down; supports proximity-based reacquire without pinch.
// WEBWAY:ww-2025-006: MULTISEAT_V2 concurrency integration (expires 2025-10-07)
import { createSeatConcurrencyCore } from '../core/seatConcurrencyCore.js';

export function createControllerRouter(options = {}){
  const seats = Array.isArray(options.seats) && options.seats.length ? [...options.seats] : ['P1','P2','P3','P4'];
  const enabled = options.enabled !== undefined ? !!options.enabled : true;
  const baseCfg = Object.assign({ lostAfterMs: 700, reserveTtlMs: 4000, snapDist: 0.15, preferByHandLabel: false }, options.cfg || {});
  const cfg = {
    ...baseCfg,
    pairing: Object.assign({ enabled: true, seats: ['P1','P2'], respectPreferred: false, strictConcurrent: true }, (baseCfg.pairing||{}))
  };

  const idToSeat = new Map();
  const seatToId = new Map();
  const lastSeen = new Map();   // key -> t
  const lastPos = new Map();    // key -> [x,y]
  const seatReserve = new Map();// seat -> { pos:[x,y], tLost:number, lastOwner:string|null }
  // Track max concurrently active hands (seen within lostAfterMs) and distinct hands ever seen
  let maxConcurrent = 0;
  const everSeenKeys = new Set();
  function activeCount(nowT){
    let n=0; for(const tSeen of lastSeen.values()){ if(nowT - (tSeen||0) <= cfg.lostAfterMs) n++; }
    return n;
  }
  const multiseatEnabled = (typeof process !== 'undefined' && process.env && process.env.FEATURE_MULTISEAT_V2 === '1') || options.featureMultiseatV2 === true;
  const autoSeatOnPresence = options.autoSeatOnPresence === true; // new opt-in to not break legacy tests
  const concurrencyCore = multiseatEnabled ? createSeatConcurrencyCore({ sustainFramesForPeak:3, peakWindowMs:2500, staleTimeoutMs: cfg.lostAfterMs }) : null;
  function allowedSeatCount(){
    if(multiseatEnabled && concurrencyCore){
      return Math.min(seats.length, Math.max(1, concurrencyCore.state().unlockSeats));
    }
    const basis = Math.max(1, maxConcurrent || 1);
    return Math.max(1, Math.min(seats.length, basis));
  }

  // Pairing mode: first good pinch locks next seat in order (default P1 then P2)
  let pairingActive = !!(cfg.pairing && cfg.pairing.enabled);
  const pairSeats = (cfg.pairing && Array.isArray(cfg.pairing.seats) && cfg.pairing.seats.length)
    ? cfg.pairing.seats.filter(s=>seats.includes(s))
    : [...seats];
  function nextPairSeat(){
    const limit = allowedSeatCount();
    for(let i=0;i<Math.min(limit, pairSeats.length);i++){
      const s = pairSeats[i];
      if(!seatToId.has(s)) return s;
    }
    return null;
  }
  function maybeDeactivatePairing(){ if(pairSeats.every(s=> seatToId.has(s))){ pairingActive = false; } }

  function keyFor(src){ if(!src) return null; if(src.handId) return `id:${src.handId}`; if(src.hand) return `hand:${src.hand}`; if(typeof src === 'string') return src; return null; }
  function remember(key, seat){ if(!key || !seat) return; const ex = seatToId.get(seat); if(ex && ex!==key){ idToSeat.delete(ex); } idToSeat.set(key, seat); seatToId.set(seat, key); }
  function releaseAll(){ idToSeat.clear(); seatToId.clear(); lastSeen.clear(); lastPos.clear(); seatReserve.clear(); }
  function acquireSeat(key, preferred, handLabel){
    if(idToSeat.has(key)) return idToSeat.get(key);
    // During pairing, assign strictly by order ignoring preferences/hand
    if(pairingActive){
      const s = nextPairSeat();
      if(s){ remember(key, s); maybeDeactivatePairing(); return s; }
      // fall through if somehow all pairing seats are occupied
    }
    const limit = allowedSeatCount();
    if(preferred && seats.indexOf(preferred) > -1 && seats.indexOf(preferred) < limit && !seatToId.has(preferred)){ remember(key, preferred); return preferred; }
    if(cfg.preferByHandLabel){
      const preference = handLabel === 'Left' && seats.length>1 ? seats[1] : seats[0];
      const idx = seats.indexOf(preference);
      if(idx>-1 && idx<limit && !seatToId.has(preference)){ remember(key, preference); return preference; }
    }
    for(let i=0;i<limit;i++){ const seat = seats[i]; if(!seatToId.has(seat)){ remember(key, seat); return seat; } }
    return null;
  }

  return {
    isEnabled(){ return enabled; },
    onFrame(frame){
      if(!enabled || !frame) return;
      const t = frame.t; const key = (frame.handId!=null) ? `id:${frame.handId}` : (frame.hand ? `hand:${frame.hand}` : null);
      const wrist = Array.isArray(frame.wrist) ? frame.wrist : null;
  if(key && wrist){ lastSeen.set(key, t); lastPos.set(key, [wrist[0], wrist[1]]); everSeenKeys.add(key); }
      // Update max concurrent active hands
      const nowActive = activeCount(t);
      if(nowActive > maxConcurrent){ maxConcurrent = nowActive; }
      if(multiseatEnabled && concurrencyCore){
        // Feed active (within lostAfterMs) hand ids to concurrency core each frame
        const activeHands = [];
        for(const [id, ts] of lastSeen.entries()){
          if(t - ts <= cfg.lostAfterMs){ activeHands.push({ id }); }
        }
        concurrencyCore.update({ t, hands: activeHands });
      }
      // WEBWAY:ww-2025-006: pairing auto-seat on presence (no pinch) for idle baseline video support (opt-in)
      if(autoSeatOnPresence && pairingActive && key && !idToSeat.has(key)){
        const seat = acquireSeat(key, null, frame.hand || null);
        if(seat){ remember(key, seat); maybeDeactivatePairing(); }
      }
      // Expire reservations
      for(const [seat, meta] of [...seatReserve.entries()]){ if(t - meta.tLost > cfg.reserveTtlMs){ seatReserve.delete(seat); } }
      // Move lost owners to reserved
      for(const [seat, ownerKey] of [...seatToId.entries()]){
        const ls = lastSeen.get(ownerKey) || 0;
        if(t - ls > cfg.lostAfterMs){
          const pos = lastPos.get(ownerKey) || null;
          idToSeat.delete(ownerKey); seatToId.delete(seat);
          if(pos){ seatReserve.set(seat, { pos, tLost: t, lastOwner: ownerKey }); }
        }
      }
      // Snap nearest unassigned hand to reserved seat
      if(key && !idToSeat.has(key)){
        const p = lastPos.get(key);
        if(p){ let bestSeat=null, bestD2=Infinity; for(const [seat, meta] of seatReserve.entries()){ const dx=meta.pos[0]-p[0], dy=meta.pos[1]-p[1]; const d2=dx*dx+dy*dy; if(d2<bestD2){ bestD2=d2; bestSeat=seat; } }
          if(bestSeat && bestD2 <= cfg.snapDist*cfg.snapDist && !seatToId.has(bestSeat)){ idToSeat.set(key, bestSeat); seatToId.set(bestSeat, key); seatReserve.delete(bestSeat); }
        }
      }
    },
    onPinchEvent(event){
      if(!enabled){ return (event && event.controllerId!=null) ? event.controllerId : null; }
  const key = keyFor(event); const preferred = event && event.controllerId!=null ? event.controllerId : null; if(!key) return preferred;
  everSeenKeys.add(key);
      let seat = idToSeat.get(key) || null;
      if(event && event.type==='pinch:down'){
        seat = acquireSeat(key, preferred, event.hand || null);
      } else {
        if(!seat && preferred && !seatToId.has(preferred)){ seat = acquireSeat(key, preferred, event.hand || null); }
      }
      if(seat){ remember(key, seat); }
      return seat;
    },
    getControllerForHand(identifier){ const key = keyFor(identifier); if(!key) return null; return idToSeat.get(key) || null; },
  reset(){ releaseAll(); pairingActive = !!(cfg.pairing && cfg.pairing.enabled); },
  setPairingEnabled(flag){ pairingActive = !!flag; },
    getState(){ return { seats:[...seats], map:Array.from(idToSeat.entries()), reserved: Array.from(seatReserve.entries()).map(([seat,meta])=>({ seat, pos: meta.pos, tLost: meta.tLost, lastOwner: meta.lastOwner })), multiseat: multiseatEnabled && concurrencyCore ? concurrencyCore.state() : null }; }
  };
}
