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

// MediaPipe Hands adapter (CDN module) -> emits per-hand frames
export function createMediaPipeSource(video, onFrame){
  let landmarker=null; let rafId=null; let running=false; let lastHands=null; let lastDetections=null; let vfcRunning=false;
  // WEBWAY:ww-2025-001 + WEBWAY:ww-2025-076: Tier-1 tracker; required mode if FEATURE_T1_TRACKER_REQUIRED
  let tracker=null;
  const trackerRequired = (typeof window!=='undefined' && window.FEATURE_T1_TRACKER_REQUIRED) || false;
  const featureEnabled = trackerRequired || (typeof window!=='undefined' && window.FEATURE_HEX_HAND_TRACKER_T1);
  const stabilityEnabled = typeof window!=='undefined' && window.FEATURE_HEX_HAND_TRACKER_T1_STABILITY;
  if(featureEnabled){
    // Attempt CommonJS style first (will be ignored in browser ESM)
  try{ const mod = typeof require==='function' ? (require('../ports/handTrackerT1.js')) : null; if(mod && mod.createHandTrackerT1) tracker = mod.createHandTrackerT1({ maxTracks: 4, seats: ['P1','P2','P3','P4'] }); }catch{}
  }
  async function init(){
    const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.19/vision_bundle.mjs');
    const { FilesetResolver, HandLandmarker } = vision;
    const fileset = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.19/wasm');
    landmarker = await HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task' },
      runningMode: 'VIDEO', numHands: 4
    });
    if(featureEnabled && !tracker){
      try{ const mod = await import('../ports/handTrackerT1.js'); tracker = mod.createHandTrackerT1({ maxTracks: 4, seats: ['P1','P2','P3','P4'] }); }catch{}
    }
    // If required and still missing, throw to surface misconfig early
    if(trackerRequired && !tracker){ throw new Error('WEBWAY:ww-2025-076: T1 hand tracker required but unavailable'); }
  }
  const toArr = lm => [lm.x, lm.y, lm.z ?? 0];
  function tick(t){
    try {
      const res = landmarker.detectForVideo(video, t);
      const L = res?.landmarks || [];
  lastHands = L.length ? L.map(hand => hand.map(toArr)) : null;
  try { if(typeof window!=='undefined') window.__hexLastHands = lastHands; }catch{}
      lastDetections = [];
      const dets = [];
      for (let i=0;i<L.length;i++){
        const h=L[i]; if(!h || h.length<21) continue;
        let handTag='Right'; const hs=res?.handednesses?.[i]?.[0]; if(hs && hs.categoryName) handTag = hs.categoryName;
        dets.push({ rawLabel: handTag, wrist: toArr(h[0]), landmarks: h });
      }
      let anns = null;
      if(tracker && dets.length){
        anns = tracker.assign(dets, t);
      }
  let handIdNulls = 0; // WEBWAY:ww-2025-078: count frames missing handId for telemetry guard
      for (let i=0;i<L.length;i++){
        const h=L[i]; if(!h || h.length<21) continue;
        let handTag='Right'; const hs=res?.handednesses?.[i]?.[0]; if(hs && hs.categoryName) handTag = hs.categoryName;
        const ann = anns ? anns[i] : null;
        const detObj = {
          hand: (ann?.hand || (handTag==='Left'?'Left':'Right')),
          handId: ann?.handId || null,
          controllerId: ann?.controllerId || null,
          landmarks: h.map(toArr)
        };
        lastDetections.push(detObj);
        if(detObj.handId == null) handIdNulls++;
        onFrame({
          t,
          hand:(ann?.hand || (handTag==='Left'?'Left':'Right')),
          handId: ann?.handId || null,
          controllerId: ann?.controllerId || null,
          indexTip:toArr(h[8]),
          indexPIP:toArr(h[6]), // WEBWAY:ww-2025-025 add PIP for finger geometry
          indexDIP:toArr(h[7]), // WEBWAY:ww-2025-025 add DIP for finger geometry
          thumbTip:toArr(h[4]),
          wrist:toArr(h[0]),
          indexMCP:toArr(h[5]),
          pinkyMCP:toArr(h[17]),
          landmarks: h.map(toArr)
        });
      }
      // WEBWAY:ww-2025-078: accumulate handId-null frames in a global for smokes/guards to read
      try {
        if(typeof window!=='undefined'){
          // Feature flag default-on; set window.FEATURE_TELEM_HANDID_GUARD=false to disable
          const enabled = (window.FEATURE_TELEM_HANDID_GUARD ?? true);
          if(enabled){ window.__hexHandIdNullFrames = (window.__hexHandIdNullFrames||0) + handIdNulls; }
        }
      }catch{}
      try { if(typeof window!=='undefined') window.__hexLastDetections = lastDetections; }catch{}
    } catch(e){}
  }
  function loopRAF(){ if(!running) return; const t=performance.now(); tick(t); rafId=requestAnimationFrame(loopRAF); }
  function loopVFC(){ if(!running) return; if(!('requestVideoFrameCallback' in video)){ loopRAF(); return; } if(vfcRunning) return; vfcRunning=true; const cb = (now/*DOMHighResTimeStamp*/)=>{ vfcRunning=false; if(!running) return; tick(now||performance.now()); // schedule next
      if('requestVideoFrameCallback' in video){ try{ video.requestVideoFrameCallback(cb); } catch { rafId=requestAnimationFrame(loopRAF); } }
      else { rafId=requestAnimationFrame(loopRAF); }
    };
    try{ video.requestVideoFrameCallback(cb); } catch { loopRAF(); }
  }
  return { 
    async start(){ if(running) return; await init(); running=true; if('requestVideoFrameCallback' in video) loopVFC(); else loopRAF(); }, 
    stop(){ running=false; if(rafId) cancelAnimationFrame(rafId); }, 
    getLastLandmarks(){ return lastHands; },
    getLastDetections(){ return lastDetections; },
    getHandTrackerStats(){ return tracker && tracker.getStats ? tracker.getStats() : null; },
    resetHandTracker(){ if(tracker && tracker.reset) tracker.reset(); }
  };
}


// MediaPipe Hands image detector for frame-by-frame processing (no <video> required)
export async function createMediaPipeImageDetector(){
  const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.19/vision_bundle.mjs');
  const { FilesetResolver, HandLandmarker } = vision;
  const fileset = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.19/wasm');
  const landmarker = await HandLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task' },
    runningMode: 'IMAGE', numHands: 4
  });
  const toArr = lm => [lm.x, lm.y, lm.z ?? 0];
  function detect(image, t, emit){
    const res = landmarker.detect(image);
    const L = res?.landmarks || [];
    for(let i=0;i<L.length;i++){
      const h=L[i]; if(!h || h.length<21) continue;
      let handTag='Right'; const hs=res?.handednesses?.[i]?.[0]; if(hs && hs.categoryName) handTag = hs.categoryName;
      emit({ t, hand:(handTag==='Left'?'Left':'Right'), indexTip:toArr(h[8]), thumbTip:toArr(h[4]), wrist:toArr(h[0]), indexMCP:toArr(h[5]), pinkyMCP:toArr(h[17]), landmarks: h.map(toArr) });
    }
  }
  function close(){ try{ landmarker.close && landmarker.close(); }catch{} }
  return { detect, close };
}

