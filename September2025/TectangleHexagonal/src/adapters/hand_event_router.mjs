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

// Lightweight per-hand event router using built-in EventTarget (no deps)
// Reversible: drop-in adapter that doesn't change core APIs
// Usage:
//   const router = createHandRouter({ seats: ['P1','P2'] });
//   router.on('P1','pinch:down', (e)=>{ /* ... */ });
//   // In your frame loop / core.on():
//   core.on((e)=> router.routePinchEvent(e));

/**
 * @typedef {Object} PinchEvent
 * @property {string} type - 'pinch:down' | 'pinch:confirm' | 'pinch:up' | 'pinch:cancel' | 'pinch:hold'
 * @property {number} t - event time (ms, performance.now())
 * @property {string} [hand] - 'Left' | 'Right' (if provided upstream)
 * @property {string} [handId] - stable biomech hash (if available)
 * @property {number} [toiActualEnterAbs]
 * @property {number} [toiPredAbsV]
 * @property {number} [toiActualStopAbs] - approach-stop TOI (if surfaced by core)
 * @property {boolean} [speculative]
 */

/** Seat-aware pinch event detail */
class SeatEvent extends Event {
  /** @param {string} type */
  constructor(type, detail) {
    super(type);
    this.detail = detail;
  }
}

/**
 * Create a hand router that maps pinch events to seats and re-emits seat-scoped events.
 * No external deps; safe for tests and demos.
 * @param {{ seats?: string[], defaultSeat?: string }} [opts]
 */
export function createHandRouter(opts={}){
  // WEBWAY:ww-2025-001: router will respect upstream handId/controllerId when FEATURE_HEX_HAND_TRACKER_T1 is enabled
  const seats = opts.seats ?? ['P1','P2'];
  const defaultSeat = opts.defaultSeat ?? seats[0];
  /** @type {Record<string, EventTarget>} */
  const buses = Object.fromEntries(seats.map(s=>[s,new EventTarget()]));
  /** @type {Map<string,string>} */
  const handToSeat = new Map(); // handId -> seat

  function guessSeatFromHandLabel(hand){
    if(hand === 'Right') return seats[0] ?? defaultSeat;
    if(hand === 'Left') return seats[1] ?? defaultSeat;
    return defaultSeat;
  }

  /** Choose seat for a pinch event */
  function resolveSeat(e){
    if(e.handId && handToSeat.has(e.handId)) return handToSeat.get(e.handId);
    if(e.handId){
      const seat = guessSeatFromHandLabel(e.hand);
      handToSeat.set(e.handId, seat);
      return seat;
    }
    // WEBWAY:ww-2025-078: remove handedness bias when no handId — fall back to default seat only
    return defaultSeat;
  }

  /** Route a pinch event into a seat bus and return seat used */
  function routePinchEvent(e){
    const seat = resolveSeat(e);
    const bus = buses[seat] || buses[defaultSeat];
    if(!bus) return defaultSeat;
    const payload = {
      seat,
      event: e,
      // Minimal projection to keep consumers decoupled from core shape changes
      t: e.t,
      type: e.type,
      hand: e.hand,
      handId: e.handId,
      toi: {
        predAbsV: e.toiPredAbsV ?? null,
        actualEnterAbs: e.toiActualEnterAbs ?? null,
        actualStopAbs: e.toiActualStopAbs ?? null,
      },
      speculative: !!e.speculative,
    };
    bus.dispatchEvent(new SeatEvent(e.type, payload));
    return seat;
  }

  /**
   * Subscribe to seat-scoped events
   * @param {string} seat
   * @param {string} type - e.g., 'pinch:down'
   * @param {(evt: SeatEvent)=>void} fn
   */
  function on(seat, type, fn){ (buses[seat]||buses[defaultSeat]).addEventListener(type, fn); return ()=> off(seat,type,fn); }
  function off(seat, type, fn){ (buses[seat]||buses[defaultSeat]).removeEventListener(type, fn); }

  /** Manually pin a handId to a seat (e.g., after pairing gesture) */
  function setSeat(handId, seat){ if(!buses[seat]) throw new Error(`Unknown seat ${seat}`); handToSeat.set(handId, seat); }
  function getSeat(handId){ return handToSeat.get(handId) ?? null; }
  function reset(){ handToSeat.clear(); }

  return { seats, on, off, routePinchEvent, setSeat, getSeat, reset };
}
