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

// HandInputPort — contract only (ports & adapters)
// Emits simplified hand events including approximate fingertip pose

/**
 * @typedef {Object} HandPose
 * @property {{x:number,y:number,z:number}} center   // e.g., midpoint between thumb/index tips
 * @property {{x:number,y:number,z:number,w:number}} quat // orientation (placeholder ok)
 * @property {number} radius // visualization scale (meters or normalized)
 * @property {boolean} isPinching // derived state
 */

/**
 * @callback HandListener
 * @param {HandPose} right
 * @param {HandPose} left
 */

/**
 * @typedef {Object} HandInputPort
 * @property {(cb:HandListener)=>()=>void} subscribe // returns unsubscribe
 * @property {()=>void} start
 * @property {()=>void} stop
 */

export function createHandInputPort(){
  /** @type {Set<HandListener>} */
  const listeners = new Set();
  let running = false;
  return {
    subscribe(cb){ listeners.add(cb); return ()=> listeners.delete(cb); },
    start(){ running = true; /* adapter wires events to listeners */ },
    stop(){ running = false; },
    // Internal helpers for adapters to publish — not part of public API, but practical for local wiring
    __emit(right,left){ if(!running) return; for(const cb of listeners) cb(right,left); }
  };
}
