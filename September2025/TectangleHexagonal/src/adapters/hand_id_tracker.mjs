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

// Simple 2-track hand ID tracker (screen-space) with distance + inertia
// No external deps; reversible. Works with normalized [0..1] coords.

/** @typedef {{ id:string, idx:number, last:[number,number], lastT:number, alive:boolean }} Track */

/**
 * Create a lightweight hand ID tracker.
 * @param {{ maxJump?:number, forgetMs?:number, teleportJump?:number }} [opts]
 */
export function createHandIdTracker(opts={}){
  const maxJump = opts.maxJump ?? 0.18;        // normalized distance allowed for association
  const forgetMs = opts.forgetMs ?? 300;       // forget track if not seen within
  const teleportJump = opts.teleportJump ?? 0.42; // jump threshold counted as teleport
  /** @type {Track[]} */
  let tracks = [
    { id:'H1', idx:0, last:[NaN,NaN], lastT:-1, alive:false },
    { id:'H2', idx:1, last:[NaN,NaN], lastT:-1, alive:false },
  ];
  let frames=0, teleports=0, reassigns=0;

  function dist(a,b){ const dx=a[0]-b[0], dy=a[1]-b[1]; return Math.hypot(dx,dy); }

  /**
   * Update tracker with current detections
   * @param {Array<{ wrist:[number,number], landmarks:number[][] }>} dets
   * @param {number} t
   * @returns {Array<{ id:string, idx:number, wrist:[number,number], landmarks:number[][] }>} assigned
   */
  function update(dets, t){
    frames++;
    // Expire old
    for(const tr of tracks){ if(tr.alive && t - tr.lastT > forgetMs){ tr.alive=false; tr.last=[NaN,NaN]; } }
    const assigned = [];
    const used = new Set();
    for(const d of dets){
      let best=null; let bestI=-1; let bestD=Infinity;
      for(let i=0;i<tracks.length;i++){
        const tr = tracks[i];
        if(!tr.alive) continue; if(Number.isNaN(tr.last[0])) continue;
        const dd = dist(d.wrist, tr.last);
        if(dd < bestD){ bestD=dd; bestI=i; best=tr; }
      }
      let useTrack=null;
      if(best && bestD <= maxJump && !used.has(best.idx)){
        useTrack = best;
      } else {
        // Pick first free track
        const free = tracks.find(tr=>!tr.alive && !used.has(tr.idx));
        if(free) useTrack = free;
      }
      if(!useTrack){
        // Fallback: steal the farthest (rare); count as reassign
        let farI=0, farD=-1; for(let i=0;i<tracks.length;i++){ const tr=tracks[i]; const dd = Number.isNaN(tr.last[0])?0:dist(d.wrist,tr.last); if(dd>farD){ farD=dd; farI=i; } }
        useTrack = tracks[farI]; reassigns++;
      }
      // Teleport check
      if(useTrack.alive && !Number.isNaN(useTrack.last[0])){
        const jump = dist(d.wrist, useTrack.last);
        if(jump > teleportJump) teleports++;
      }
      // Update
      useTrack.alive = true; useTrack.last = d.wrist; useTrack.lastT = t; used.add(useTrack.idx);
      assigned.push({ id: useTrack.id, idx: useTrack.idx, wrist:d.wrist, landmarks:d.landmarks });
    }
    return assigned;
  }

  function getSummary(){ return { frames, teleports, reassigns, alive: tracks.filter(t=>t.alive).length }; }
  function reset(){ tracks.forEach(t=>{ t.alive=false; t.last=[NaN,NaN]; t.lastT=-1; }); frames=0; teleports=0; reassigns=0; }

  return { update, getSummary, reset };
}
