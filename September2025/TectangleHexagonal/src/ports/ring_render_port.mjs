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

// RingRenderPort — draws floating rings/sigils based on fingertip pose

/**
 * @typedef {Object} RingSpec
 * @property {{x:number,y:number}} screen // pixel position
 * @property {number} radiusPx
 * @property {number} tilt // radians
 * @property {string[]} glyphs // ordered symbols/text around ring
 */

/**
 * @typedef {Object} RingRenderPort
 * @property {(specs:RingSpec[])=>void} draw
 * @property {()=>void} clear
 */

export function createRingRenderPort(adapter){
  /** @type {RingRenderPort} */
  return {
    draw: (specs)=> adapter.draw(specs),
    clear: ()=> adapter.clear()
  };
}
