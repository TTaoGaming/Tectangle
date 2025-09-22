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

// WEBWAY:ww-2025-002: Hand ID Calibration via pinch-hold
// Purpose: Let users assign stable IDs to tracks by performing simple pinch-hold gestures.
// - Index pinch-hold => assign U1
// - Middle pinch-hold => assign U2
// - Neutral until assigned. Resettable. No DOM deps.

/**
 * Create a calibration manager.
 * @param {{ holdMs?:number, reassignMs?:number, onThreshold?:number, offThreshold?:number }} [opts]
 */
export function createHandCalibration(opts={}){
  const cfg = Object.assign({ holdMs: 600, reassignMs: 900, onThreshold: 0.08, offThreshold: 0.12 }, opts);
  // per-track gesture state: { pinch:{index:{down:boolean,since:number}, middle:{down:boolean,since:number}} }
  /** @type {Record<string, { pinch: { index:{down:boolean,since:number|null}, middle:{down:boolean,since:number|null} }, assigned: 'U1'|'U2'|null, lastAssignAt:number|null }>} */
  const per = Object.create(null);

  function ensure(id){ return per[id] || (per[id] = { pinch:{ index:{down:false,since:null}, middle:{down:false,since:null} }, assigned:null, lastAssignAt:null }); }

  function dist(a,b){ const dx=a[0]-b[0], dy=a[1]-b[1], dz=(a[2]-b[2])||0; return Math.hypot(dx,dy,dz); }

  function pinchMetrics(lm){
    if(!lm || lm.length < 21) return { idx:Infinity, mid:Infinity, norm:1 };
    const palmSpan = dist(lm[5], lm[17]) + dist(lm[0], lm[9]) || 1;
    const idx = dist(lm[4], lm[8]) / palmSpan;    // thumb tip (4) to index tip (8)
    const mid = dist(lm[4], lm[12]) / palmSpan;   // thumb tip (4) to middle tip (12)
    return { idx, mid, norm:palmSpan };
  }

  function update(assignments, t){
    // assignments: [{ id:'H1'|'H2', wrist:[x,y], landmarks:number[][] }]
    let events = [];
    for(const a of assignments){
      const ref = ensure(a.id);
      const { idx, mid } = pinchMetrics(a.landmarks);
      // hysteresis thresholding
      const idxNow = ref.pinch.index.down ? (idx <= cfg.offThreshold) : (idx <= cfg.onThreshold);
      const midNow = ref.pinch.middle.down ? (mid <= cfg.offThreshold) : (mid <= cfg.onThreshold);
      // update states with since timestamps
      if(idxNow && !ref.pinch.index.down){ ref.pinch.index.down = true; ref.pinch.index.since = t; }
      else if(!idxNow && ref.pinch.index.down){ ref.pinch.index.down = false; ref.pinch.index.since = null; }
      if(midNow && !ref.pinch.middle.down){ ref.pinch.middle.down = true; ref.pinch.middle.since = t; }
      else if(!midNow && ref.pinch.middle.down){ ref.pinch.middle.down = false; ref.pinch.middle.since = null; }

      // assignment logic
      // If unassigned: any hold >= holdMs assigns accordingly.
      // If assigned: allow reassignment only if alternative gesture is held >= reassignMs.
      const nowAssigned = ref.assigned;
      if(!nowAssigned){
        if(ref.pinch.index.down && ref.pinch.index.since && (t - ref.pinch.index.since >= cfg.holdMs)){
          ref.assigned = 'U1'; ref.lastAssignAt = t; events.push({ type:'assign', id:a.id, to:'U1' });
        } else if(ref.pinch.middle.down && ref.pinch.middle.since && (t - ref.pinch.middle.since >= cfg.holdMs)){
          ref.assigned = 'U2'; ref.lastAssignAt = t; events.push({ type:'assign', id:a.id, to:'U2' });
        }
      } else {
        // Reassignment gate with longer hold to avoid accidents
        if(nowAssigned === 'U1' && ref.pinch.middle.down && ref.pinch.middle.since && (t - ref.pinch.middle.since >= cfg.reassignMs)){
          ref.assigned = 'U2'; ref.lastAssignAt = t; events.push({ type:'reassign', id:a.id, to:'U2' });
        } else if(nowAssigned === 'U2' && ref.pinch.index.down && ref.pinch.index.since && (t - ref.pinch.index.since >= cfg.reassignMs)){
          ref.assigned = 'U1'; ref.lastAssignAt = t; events.push({ type:'reassign', id:a.id, to:'U1' });
        }
      }
    }
    return { events };
  }

  function getMapping(){
    /** @type {Record<string,'U1'|'U2'|null>} */
    const out = {}; for(const k of Object.keys(per)){ out[k] = per[k].assigned || null; } return out;
  }
  function getSummary(){
    const m = getMapping();
    return { mapping:m };
  }
  function reset(){ for(const k of Object.keys(per)){ per[k].assigned=null; per[k].lastAssignAt=null; per[k].pinch.index.down=false; per[k].pinch.index.since=null; per[k].pinch.middle.down=false; per[k].pinch.middle.since=null; } }

  return { update, getMapping, getSummary, reset };
}
