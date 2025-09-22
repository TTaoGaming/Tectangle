/**
 * fastOverlay.js
 * Minimal overlay abstraction producing pure draw ops (no side effects) for testability & renderer swapping.
 *
 * API:
 *   createFastOverlay({ getFrame, getSeats }) => {
 *     computeOps(): Op[]
 *     drawTo(ctx, ops?): void
 *   }
 *
 * Op shape (current): { kind:'dot', x, y, r, color }
 *  - Coordinates are already in display space (we map from frame landmarks with simple cover fit assumptions)
 *  - Radius is small constant with slight emphasis for landmark 4/8 (tips) for quick visual identification
 *
 * Assumptions / Heuristics:
 *  - Accepts either pixel landmark coords (0..video w/h) or normalized (-1..1 or 0..1). We detect by value magnitudes.
 *  - We do NOT attempt skeleton lines here—only dots—to keep pipeline minimal.
 *  - Seat coloring: P1=#2563eb, P2=#8b5cf6, fallback palette (#10b981 / #f59e0b).
 */

export function createFastOverlay({ getFrame, getSeats }) {
  if(typeof getFrame !== 'function') throw new Error('createFastOverlay requires getFrame()');
  if(typeof getSeats !== 'function') throw new Error('createFastOverlay requires getSeats()');

  function isLikelyNormalized(hand){
    let inRange=0; for(const lm of hand){ const x=lm[0]; const y=lm[1]; if(Math.abs(x)<=1.5 && Math.abs(y)<=1.5) inRange++; }
    return (inRange/hand.length)>=0.8;
  }

  function mapHands(frame){
    let handsRaw=null; try {
      if(globalThis.__hexLastHands && Array.isArray(globalThis.__hexLastHands)) handsRaw = globalThis.__hexLastHands;
      else if(frame && frame.landmarks && Array.isArray(frame.landmarks) && frame.landmarks.length && Array.isArray(frame.landmarks[0])) handsRaw=[frame.landmarks];
    } catch {}
    return Array.isArray(handsRaw)? handsRaw.filter(h=>Array.isArray(h)&&h.length>=21) : [];
  }

  function computeOps(){
    const frame = getFrame();
    if(!frame) return [];
    const seats = getSeats() || {};
    const hands = mapHands(frame);
    if(!hands.length) return [];
    // WEBWAY:ww-2025-009 fast overlay simplify
    // If feature flag enabled, emit ONLY normalized 0..1 coordinates (single downstream transform responsibility)
    const simplify = !!(globalThis.__flags && globalThis.__flags.FEATURE_FAST_OVERLAY_SIMPLIFY);
    const vw = (globalThis.__fastOverlayVideoRef && globalThis.__fastOverlayVideoRef.videoWidth) || 640; // used for pixel->normalized if needed
    const vh = (globalThis.__fastOverlayVideoRef && globalThis.__fastOverlayVideoRef.videoHeight) || 480;
    const ops=[];
    hands.forEach((hand, hi)=>{
      const normDetected = isLikelyNormalized(hand);
      const seatColor = (hi===0 && seats.P1)? '#2563eb' : (hi===1 && seats.P2)? '#8b5cf6' : (hi===0?'#10b981':'#f59e0b');
      for(let idx=0; idx<hand.length; idx++){
        const lm = hand[idx]; if(!lm) continue; const x=lm[0], y=lm[1];
        let outX, outY;
        if(simplify){
          // Unify ALL inputs to 0..1 normalized (not -1..1) for downstream renderer.
          if(normDetected){
            if(x>=-1 && x<=1 && y>=-1 && y<=1){
              outX = x*0.5 + 0.5; outY = y*0.5 + 0.5; // -1..1 -> 0..1
            } else { // assume already 0..1
              outX = x; outY = y;
            }
          } else {
            // pixel -> normalized
            outX = (vw? x / vw : 0); outY = (vh? y / vh : 0);
          }
        } else {
          // Legacy path: produce pixel-like display coordinates sized to video intrinsic (maintain previous behavior)
          if(normDetected){
            if(x>=-1 && x<=1 && y>=-1 && y<=1){
              outX = (x*0.5 + 0.5) * vw; outY = (y*0.5 + 0.5) * vh;
            } else { outX = x*vw; outY = y*vh; }
          } else {
            outX = x; outY = y; // already pixel relative to vw/vh
          }
        }
        const r = (idx===4||idx===8)?4:2.1;
        ops.push({ kind:'dot', x:outX, y:outY, r, color:(idx===4||idx===8)?'#ffffff':seatColor });
      }
    });
    return ops; // interpretation (normalized vs pixel) now decided by feature flag
  }

  function drawTo(ctx, ops){
    if(!ctx) return; const list = ops || computeOps();
    for(const op of list){
      if(op.kind==='dot'){
        ctx.beginPath(); ctx.fillStyle = op.color || '#fff'; ctx.arc(op.x, op.y, op.r||2, 0, Math.PI*2); ctx.fill();
      }
    }
  }

  return { computeOps, drawTo };
}

export default { createFastOverlay };
