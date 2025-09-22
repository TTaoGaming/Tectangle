// OverlayOpsPort: hexagonal port for producing display-agnostic overlay ops.
// Contract:
//   createOverlayOpsPort({ getFrame, getSeats }) -> {
//      sample(): { ops: Op[], coordinateSpace:'normalized', meta:{ hands:number, ts:number } }
//   }
// WEBWAY:ww-2025-010 overlay redo (ports-level) replaces prior dependency on ui/fastOverlay (boundary violation)
// Strategy: ALWAYS output normalized 0..1 coordinates; renderer solely handles fit & mirror.
// Revert: remove WEBWAY markers + restore previous implementation if needed.

export function createOverlayOpsPort({ getFrame, getSeats, getVideoDims, spanWarn }={}){
  if(!getFrame) throw new Error('overlayOpsPort requires getFrame');
  if(!getSeats) getSeats = ()=>({});
  if(!getVideoDims) {
    // Dependency Injection: supply intrinsic video dimensions; fallback only once (logged) to avoid hidden scaling bugs.
    let warned=false;
    getVideoDims = () => { if(!warned){ console.warn('[overlayOpsPort] getVideoDims defaulting to 640x480'); warned=true; } return { width:640, height:480 }; };
  }
  // Helper: detect if a hand landmark array is normalized (-1..1 or 0..1)
  function detectSpace(hand){
    // Returns 'neg1to1' | 'unit' | 'pixel'
    let inNegRange=0, inUnit=0; let anyOutPixel=false; let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for(const lm of hand){ if(!lm) continue; const x=lm[0]; const y=lm[1];
      if(x>=-1 && x<=1 && y>=-1 && y<=1) inNegRange++;
      if(x>=0 && x<=1 && y>=0 && y<=1) inUnit++;
      if(x>2 || y>2) anyOutPixel=true;
      if(x<minX) minX=x; if(x>maxX) maxX=x; if(y<minY) minY=y; if(y>maxY) maxY=y;
    }
    const n = hand.length||1;
    const fracNeg = inNegRange/n;
    const fracUnit = inUnit/n;
    const hasNegative = (minX < 0) || (minY < 0);
    if(fracNeg >= 0.85 && hasNegative) return 'neg1to1';
    if(fracUnit >= 0.85 && !anyOutPixel) return 'unit';
    return 'pixel';
  }

  function collectHands(frame){
    let handsRaw=null; try {
      if(globalThis.__hexLastHands && Array.isArray(globalThis.__hexLastHands)) handsRaw = globalThis.__hexLastHands;
      else if(frame && frame.landmarks && Array.isArray(frame.landmarks) && frame.landmarks.length && Array.isArray(frame.landmarks[0])) handsRaw=[frame.landmarks];
    } catch {}
    return Array.isArray(handsRaw)? handsRaw.filter(h=>Array.isArray(h)&&h.length>=21) : [];
  }

  function buildOps(frame, seats){
    const hands = collectHands(frame); if(!hands.length) return [];
    const { width:vw, height:vh } = getVideoDims() || { width:640, height:480 };
    const ops=[];
    const debug = !!(globalThis.__flags && globalThis.__flags.FEATURE_OVERLAY_DEBUG);
    hands.forEach((hand, hi)=>{
      const space = detectSpace(hand);
      if(debug){
        try {
          let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity; for(const lm of hand){ if(!lm) continue; if(lm[0]<minX)minX=lm[0]; if(lm[0]>maxX)maxX=lm[0]; if(lm[1]<minY)minY=lm[1]; if(lm[1]>maxY)maxY=lm[1]; }
          console.debug('[overlayOpsPort] rawRange', { space, minX:+minX.toFixed(3), maxX:+maxX.toFixed(3), minY:+minY.toFixed(3), maxY:+maxY.toFixed(3), vw, vh });
        } catch {}
      }
      // WEBWAY:ww-2025-011 span heuristic (optional)
      if(spanWarn){
        try {
          let minX= 1e9, maxX=-1e9, minY=1e9, maxY=-1e9;
          for(const lm of hand){ if(!lm) continue; const x=lm[0]; const y=lm[1]; if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y; }
          let spanX, spanY;
          if(space==='neg1to1'){
            spanX = (maxX - minX)/2; spanY = (maxY - minY)/2; // convert -1..1 width to unit width
          } else if(space==='unit'){
            spanX = (maxX - minX); spanY = (maxY - minY);
          } else { // pixel
            spanX = vw? (maxX - minX)/vw : 0; spanY = vh? (maxY - minY)/vh : 0;
          }
            if((spanX!=null && spanY!=null) && (spanX < 0.15 && spanY < 0.15)){
              console.warn('[overlayOpsPort] spanWarn small hand bbox', { spanX: +spanX.toFixed(3), spanY: +spanY.toFixed(3), vw, vh });
            }
        } catch{}
      }
      const seatColor = (hi===0 && seats.P1)? '#2563eb' : (hi===1 && seats.P2)? '#8b5cf6' : (hi===0?'#10b981':'#f59e0b');
      for(let idx=0; idx<hand.length; idx++){
        const lm = hand[idx]; if(!lm) continue; let x=lm[0], y=lm[1];
        // Normalize to 0..1 based on detected space
        if(space==='neg1to1'){
          x = x*0.5 + 0.5; y = y*0.5 + 0.5;
        } else if(space==='unit'){
          // already 0..1, do nothing
        } else { // pixel
          x = vw? x / vw : 0; y = vh? y / vh : 0;
        }
        // Clamp to guard against dimension mismatch drift
        if(!Number.isFinite(x) || !Number.isFinite(y)){ continue; }
        if(x<0) x=0; else if(x>1) x=1;
        if(y<0) y=0; else if(y>1) y=1;
        const r = (idx===4||idx===8)?4:2.1;
        ops.push({ kind:'dot', x, y, r, color:(idx===4||idx===8)?'#ffffff':seatColor });
      }
    });
    return ops;
  }

  function sample(){
    const frame = getFrame();
    if(!frame) return { ops:[], coordinateSpace:'normalized', meta:{ hands:0, ts:Date.now() } }; // WEBWAY:ww-2025-010
    const seats = getSeats() || {};
    const ops = buildOps(frame, seats);
    return { ops, coordinateSpace:'normalized', meta:{ hands: estimateHandCount(), ts: Date.now() } };
  }

  function estimateHandCount(){
    if(Array.isArray(globalThis.__hexLastHands)) return globalThis.__hexLastHands.length;
    return 0;
  }

  return { sample };
}

export default { createOverlayOpsPort };
