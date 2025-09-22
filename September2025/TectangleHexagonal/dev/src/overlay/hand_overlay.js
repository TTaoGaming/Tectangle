// Hand landmarks overlay renderer (ports/adapters-friendly)
// Consumes SDK detections and draws 21-point hand skeletons with seat-based colors.

const LM_EDGES = [
  // Thumb
  [0,1],[1,2],[2,3],[3,4],
  // Index
  [0,5],[5,6],[6,7],[7,8],
  // Middle
  [0,9],[9,10],[10,11],[11,12],
  // Ring
  [0,13],[13,14],[14,15],[15,16],
  // Pinky
  [0,17],[17,18],[18,19],[19,20]
];

function getSeatColor(seat){
  if(seat==='P1') return '#ef4444'; // red
  if(seat==='P2') return '#3b82f6'; // blue
  return '#94a3b8'; // slate-300 grey for unseated
}

function computeDrawRect(video, W, H, fit){
  const vw = video?.videoWidth||0, vh = video?.videoHeight||0;
  if(!vw || !vh) return { scale: 1, dx: 0, dy: 0, drawW: W, drawH: H, ready: false };
  const cover = (fit==='cover');
  const scale = cover ? Math.max(W/vw, H/vh) : Math.min(W/vw, H/vh);
  const drawW = vw*scale, drawH = vh*scale;
  const dx = (W - drawW)/2; // center (object-position: center)
  const dy = (H - drawH)/2;
  return { scale, dx, dy, drawW, drawH, ready: true };
}

export function createHandOverlay({ canvas, video, sdk, getFitMode, getMirrored }){
  const ctx = canvas.getContext('2d');
  // Feature flag: seat magnet visualization and snapping proposals
  const __p = new URLSearchParams(globalThis.location?.search||'');
  const SEAT_MAGNET = (__p.get('seatmag') === '1');
  // Test-only: allow forcing no detections to simulate occlusion
  // WEBWAY: ww-2025-069: test-only toggle and probes for ghost persistence e2e
  let TEST_NODETS = (__p.get('seatmag_test_nodets') === '1');
  globalThis.window.__SEATMAG_TEST_NODETS = TEST_NODETS;
  // Seat anchors persist even when tracking is lost; normalized coords (u,v)
  const seatAnchors = new Map(); // seat -> { u, v, lastSeen }
  const proposals = [];
  // For ghost rendering, consult manager anchors (if available)
  function getManagerAnchors(){ try{ return (globalThis.window?.__seatMagnetManager?.getAnchors?.()) || new Map(); }catch{ return new Map(); } }
  if(SEAT_MAGNET){
    globalThis.window.__seatMagnet = {
      proposals,
      setAnchor(seat, u, v){ try{ seatAnchors.set(String(seat).toUpperCase(), { u:+u, v:+v, lastSeen: performance.now() }); }catch{} },
      get anchors(){ return Array.from(seatAnchors.entries()); },
      ghostSeats: new Set(),
      setTestNoDets(on){ try{ TEST_NODETS = !!on; globalThis.window.__SEATMAG_TEST_NODETS = TEST_NODETS; }catch{} }
    };
  }
  function draw(){
    let dets = (sdk?.ports?.mediapipe?.getLastDetections?.() || (globalThis.window?.__hexLastDetections) || []);
    // test-only override at runtime
    try{ if(globalThis.window.__SEATMAG_TEST_NODETS) dets = []; }catch{}
    const W = canvas.width, H = canvas.height;
    const mirrored = !!(getMirrored?.()||false);
    const fit = (getFitMode?.()||'cover');
    const rect = computeDrawRect(video, W, H, fit);
    if(!rect.ready) return;
    // Map normalized UV (relative to source frame) to canvas pixels respecting object-fit
    const project = (u,v)=>{
      // u,v in [0,1] relative to source video size
      let x = rect.dx + (u * video.videoWidth) * rect.scale;
      let y = rect.dy + (v * video.videoHeight) * rect.scale;
      if(mirrored) x = W - x; // mirror around canvas edge
      return [x,y];
    };

    // Seat lookup from rich snapshot (optional)
  const seatByKey = new Map();
    try{
      const rich = sdk.getRichSnapshot?.()||[];
      for(const r of rich){ const key = r.hand + ':' + (r.handId??''); if(r.seat && !seatByKey.has(key)) seatByKey.set(key, r.seat); }
    }catch{}

    // Fallback seat lookup from sdk.getState seats.map
    function seatFromStateForDet(d){
      try{
        const st = sdk.getState?.();
        const arr = st?.seats?.map; // expected [[key, seat], ...]
        if(!Array.isArray(arr)) return null;
        // Try 'hand:<hand>' first, then 'handId:<id>'
        const handKey = (d?.hand? ('hand:' + String(d.hand).toLowerCase()) : null);
        const idKey = (d?.handId!=null? ('handId:' + d.handId) : null);
        for(const kv of arr){ const k = Array.isArray(kv)? kv[0] : null; const v = Array.isArray(kv)? kv[1] : null; if(v && (k===handKey || k===idKey)) return v; }
      }catch{}
      return null;
    }

    // Clear proposals this frame
    if(SEAT_MAGNET){ proposals.length = 0; }

    // Track unseated wrists for magnet check
    const unseatedWrists = [];

    for(const d of dets){
      const key = d.hand + ':' + (d.handId||'');
      const lms = d.landmarks; if(!Array.isArray(lms) || lms.length<21) continue;
      const seat = seatByKey.get(key) || seatFromStateForDet(d) || null;
      const col = getSeatColor(seat);

      // Wrist location (normalized)
      const wu = lms[0][0], wv = lms[0][1];
      // Update seat anchors when seated
      if(SEAT_MAGNET && seat){ seatAnchors.set(seat, { u: wu, v: wv, lastSeen: performance.now() }); }

      if(SEAT_MAGNET && !seat){
        // Unseated: draw wrist dot only, collect for magnet proposals
        const [wx,wy] = project(wu, wv);
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(wx, wy, 3.0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = col; ctx.font = '11px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';
        ctx.fillText('unseated', wx+6, wy-6);
        unseatedWrists.push({ key, u: wu, v: wv, x: wx, y: wy });
        continue; // Skip full skeleton for unseated under magnet mode
      }

      // Default: draw full skeleton for seated or when magnet disabled
      // Edges
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
      for(const [a,b] of LM_EDGES){
        const [x1,y1] = project(lms[a][0], lms[a][1]);
        const [x2,y2] = project(lms[b][0], lms[b][1]);
        ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
      }
      ctx.stroke();
      // Joints
      ctx.fillStyle = col;
      for(let i=0;i<21;i++){ const [x,y] = project(lms[i][0], lms[i][1]); ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI*2); ctx.fill(); }
      // Label near wrist (landmark 0)
      const [wx,wy] = project(lms[0][0], lms[0][1]);
      const label = seat || 'unseated';
      ctx.fillStyle = col; ctx.font = '11px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';
      ctx.fillText(label, wx+6, wy-6);
    }

    // After drawing hands (or even if none), overlay seat magnet anchors and compute proposals
    if(SEAT_MAGNET){
      // WEBWAY: ww-2025-069: reset ghostSeats each frame for test assertions
      try{ if(globalThis.window.__seatMagnet?.ghostSeats) globalThis.window.__seatMagnet.ghostSeats = new Set(); }catch{}
      const radiusNorm = 0.08; // normalized radius ~8% of video dimension
      const now = performance.now();
      // Merge anchors: prefer manager anchors (with landmarks) to draw ghost; fall back to local anchors
      const merged = new Map(seatAnchors);
      for(const [seat, a] of getManagerAnchors().entries()){ merged.set(seat, Object.assign({}, merged.get(seat)||{}, a)); }
      for(const [seat, anc] of merged.entries()){
        // Project anchor to canvas
        const [ax, ay] = project(anc.u, anc.v);
        // Convert normalized radius to pixels using video width scaling
        const rpx = (video.videoWidth * rect.scale) * radiusNorm;
        // Draw anchor circle
        ctx.strokeStyle = getSeatColor(seat);
        ctx.lineWidth = 2;
        ctx.setLineDash([6,4]);
        ctx.beginPath(); ctx.arc(ax, ay, rpx, 0, Math.PI*2); ctx.stroke();
        ctx.setLineDash([]);
        // Draw ghost skeleton if we have last landmarks for this seat
        let lms = anc.landmarks;
        // If no saved landmarks but manager can predict a ghost, use that
        if((!Array.isArray(lms) || lms.length<21) && globalThis.window?.__seatMagnetManager?.getGhost){
          const g = globalThis.window.__seatMagnetManager.getGhost(seat, { frictionPerSec: 0.90 });
          if(g && Array.isArray(g.landmarks) && g.landmarks.length>=21){ lms = g.landmarks; }
        }
        if(Array.isArray(lms) && lms.length>=21){
          ctx.globalAlpha = 0.55;
          ctx.strokeStyle = getSeatColor(seat);
          ctx.lineWidth = 1.5;
          ctx.setLineDash([2,2]);
          ctx.beginPath();
          for(const [aIdx,bIdx] of LM_EDGES){
            const [x1,y1] = project(lms[aIdx][0], lms[aIdx][1]);
            const [x2,y2] = project(lms[bIdx][0], lms[bIdx][1]);
            ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
          }
          ctx.stroke();
          ctx.setLineDash([]);
          // ghost joints
          ctx.fillStyle = getSeatColor(seat);
          for(let i=0;i<21;i++){ const [x,y] = project(lms[i][0], lms[i][1]); ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI*2); ctx.fill(); }
          ctx.globalAlpha = 1.0;
          // label
          ctx.fillStyle = '#fbbf24'; // amber for lost-tracking label
          ctx.font = '11px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';
          ctx.fillText(`${seat} (tracking lost)`, ax+8, ay-8);
          // mark ghost present for tests
          try{ globalThis.window.__seatMagnet?.ghostSeats?.add?.(seat); }catch{}
        } else {
          // Even without landmarks, consider the seat in ghost state while anchor exists
          try{ globalThis.window.__seatMagnet?.ghostSeats?.add?.(seat); }catch{}
          // optional label to aid visual debug
          ctx.fillStyle = '#fbbf24';
          ctx.font = '11px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';
          ctx.fillText(`${seat} (tracking lost)`, ax+8, ay-8);
        }
        // Evaluate proposals
        for(const w of unseatedWrists){
          const dx = w.x - ax, dy = w.y - ay; const dist = Math.hypot(dx, dy);
          if(dist <= rpx){
            proposals.push({ seat, handKey: w.key, dist });
            // Visual highlight
            ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(w.x, w.y, 6, 0, Math.PI*2); ctx.stroke();
            // arrow/line to indicate snap target
            ctx.strokeStyle = '#22d3ee'; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(w.x, w.y); ctx.lineTo(ax, ay); ctx.stroke(); ctx.setLineDash([]);
          }
        }
      }
    }
  }
  return { draw };
}
