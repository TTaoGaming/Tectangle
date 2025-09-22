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

// AppShell: wires FrameSource -> HandSessionManager -> ControllerRouter + optional game bridge
// WEBWAY:ww-2025-006: AppShell minimal scaffold (expires 2025-10-07)
import { createHandSessionManager } from './handSessionManager.js';
import { createControllerRouter } from './controllerRouterCore.js';
import { createMediaPipeSource } from '../ports/mediapipe.js?v11'; // WEBWAY:ww-2025-025 cache-bust for added PIP/DIP
// WEBWAY:ww-2025-003 geometry stabilization and angle derivation for consensus
import { computeHandJointAngles } from '../core/handGeometry.js';
import { flag } from './featureFlags.js';
import { createSeatConfigStore } from './seatConfigStore.js';
import { createGameEventBridge } from './gameEventBridge.js';
// WEBWAY:ww-2025-011 responsive camera constraints scaffold (FEATURE_CAMERA_CONSTRAINTS)

export function createAppShell(options = {}) {
  const seats = options.seats || ['P1','P2','P3','P4'];
  const router = createControllerRouter({ enabled: true, seats, cfg: { lostAfterMs: 700, reserveTtlMs: 4000, snapDist: 0.15 } });
  // WEBWAY:ww-2025-043: Seat-scoped config store
  const seatCfg = createSeatConfigStore({ seats });
  const hsm = createHandSessionManager({
    pinch: options.pinch || { enterThresh:0.40, exitThresh:0.70, palmGate:true },
    orientation: { enabled: flag('FEATURE_WRIST_ORIENT_V1') },
    fingerGeometry: { enabled: flag('FEATURE_FINGER_GEOMETRY_V1') }
  }); // WEBWAY:ww-2025-006 wrist orientation + finger geometry flag integration (expires 2025-10-07)
  const subs = [];
  let mp = null;
  let lastFrame = null; // WEBWAY:ww-2025-006 expose last processed frame for orientation demo (expires 2025-10-07)
  const listeners = new Set();
  const actionListeners = new Set();
  const telemEnabled = flag('FEATURE_SEAT_TELEM_V1');
  const telem = telemEnabled ? { bySeat:{}, orientCounts:{} } : null;
  const lastRichByHand = new Map();
  const userBridgeConfig = Object.assign({}, options.gameBridge || {});
  const bridgeTelemetrySink = telemEnabled ? (entry => {
    if(!telem.bridge){
      telem.bridge = { events:0, actions:0, byProfile:{}, last:null };
    }
    if(entry && entry.kind === "profile:action"){
      telem.bridge.actions++;
      const id = entry.profileId || "unknown";
      const bucket = telem.bridge.byProfile[id] || (telem.bridge.byProfile[id] = { actions:0 });
      bucket.actions++;
      if(entry.seat){
        if(!bucket.bySeat) bucket.bySeat = {};
        bucket.bySeat[entry.seat] = (bucket.bySeat[entry.seat] || 0) + 1;
      }
      telem.bridge.last = entry;
    } else {
      telem.bridge.events++;
      telem.bridge.last = entry;
    }
  }) : null;
  if(bridgeTelemetrySink){
    if(typeof userBridgeConfig.telemetry === "function"){
      const prev = userBridgeConfig.telemetry;
      userBridgeConfig.telemetry = entry => { try { bridgeTelemetrySink(entry); } catch {} return prev(entry); };
    } else if(userBridgeConfig.telemetry && typeof userBridgeConfig.telemetry === "object"){
      const prevRecord = typeof userBridgeConfig.telemetry.record === "function" ? userBridgeConfig.telemetry.record.bind(userBridgeConfig.telemetry) : null;
      userBridgeConfig.telemetry = Object.assign({}, userBridgeConfig.telemetry, {
        record(entry){ try { bridgeTelemetrySink(entry); } catch {} if(prevRecord) return prevRecord(entry); }
      });
    } else {
      userBridgeConfig.telemetry = bridgeTelemetrySink;
    }
  }
  const bridge = flag('FEATURE_GAME_BRIDGE') ? createGameEventBridge(userBridgeConfig) : null;

  // WEBWAY:ww-2025-002: Pinch lookahead (Tier-0) config and helpers (flagged)
  const predictCfg = Object.assign({
    enabled: flag('FEATURE_PINCH_LOOKAHEAD_V1') || false,
    lookaheadMs: 120,
    leadMs: 0,           // can be negative to aim ahead of system latency
    smoothAlpha: 0.3,    // EMA for velocity/acceleration smoothing
    maxAccel: 5.0        // max |a| in norm units per s^2 (clamp to reduce jitter)
  }, (options.pinchPredict || {}));
  function v2(a){ return [a[0], a[1]]; }
  function sub(a,b){ return [a[0]-b[0], a[1]-b[1]]; }
  function add(a,b){ return [a[0]+b[0], a[1]+b[1]]; }
  function mul(a,k){ return [a[0]*k, a[1]*k]; }
  function dot(a,b){ return a[0]*b[0]+a[1]*b[1]; }
  function len(a){ return Math.hypot(a[0], a[1]); }
  function norm(a){ const L=len(a)||1e-6; return [a[0]/L, a[1]/L]; }
  function clamp01(x){ return x<0?0:(x>1?1:x); }
  function projectScalar(p, O, U){ return dot(sub(p,O), U); }
  function pointOnAxis(O, U, s){ return add(O, mul(U, s)); }

  // WEBWAY:ww-2025-003: Triple-consensus (distance, kinematics, angle velocity)
  const consensusCfg = Object.assign({
    enabled: flag('FEATURE_PINCH_TRIPLE_CONSENSUS_V1') || false,
    requireAll: false,
    nearEps: 0.02,
    vMin: 0.15,           // norm/s toward pinch (negative v)
    angleVelMin: 20,      // deg/s of increasing flexion
    smoothAlphaAngles: 0.4
  }, (options.pinchConsensus || {}));

  // Relay pinch events to router
  subs.push(hsm.on(evt => {
    if (evt.type === 'pinch:down' || evt.type === 'pinch:up' || evt.type === 'pinch:cancel' || evt.type === 'pinch:confirm') {
      const seat = router.onPinchEvent({ type: evt.type, t: evt.t, hand: evt.hand, handId: evt.handId });
      const enriched = { ...evt, seat: seat || null };
      // WEBWAY:ww-2025-025: also tag lastRichByHand with seat assignment for this hand
      try {
        const key = (evt.hand + ':' + (evt.handId||''));
        const existing = lastRichByHand.get(key) || { hand: evt.hand, handId: evt.handId||null, seat: null, history: [] };
        if(seat && !existing.seat) existing.seat = seat;
        lastRichByHand.set(key, existing);
      } catch {}
      listeners.forEach(h => { try { h(enriched); } catch {} });
      if(bridge && (evt.type==='pinch:down' || evt.type==='pinch:up')){
        bridge.onPinchEvent({ ...enriched, frame: evt.frame });
      }
      if(telem){
        if(enriched.seat){
          const s = telem.bySeat[enriched.seat] || (telem.bySeat[enriched.seat] = { downs:0, ups:0, active:null, durations:[] });
          if(enriched.type==='pinch:down'){ s.downs++; s.active = enriched.t; }
          if(enriched.type==='pinch:up'){ s.ups++; if(s.active!=null){ s.durations.push(enriched.t - s.active); s.active=null; } }
        }
      }
    }
  // WEBWAY:ww-2025-014 (expires 2025-10-09) Enrich rich snapshot with joint angles, orientation & hysteresis history
  if(evt.hand){
      const key = (evt.hand + ':' + (evt.handId||''));
      const existing = lastRichByHand.get(key) || { hand: evt.hand, handId: evt.handId||null, seat: evt.seat||null, history: [] };
      if(evt.seat && !existing.seat) existing.seat = evt.seat; // first claim
      // Pinch frame data (on pinch events, and on per-frame metrics via pinch:metrics)
      if(evt.frame){
        existing.t = evt.t;
        const f = evt.frame;
        existing.norm = evt.norm!=null? evt.norm : (f.norm!=null? f.norm : existing.norm||null);
        existing.rawNorm = f.rawNorm!=null? f.rawNorm : existing.rawNorm||null;
        existing.palmAngleDeg = f.ang!=null? f.ang : (f.palmAngleDeg!=null? f.palmAngleDeg : existing.palmAngleDeg||null);
        existing.velocity = f.vRel!=null? f.vRel : (f.velocity!=null? f.velocity : existing.velocity||null);
        existing.acceleration = f.aRel!=null? f.aRel : (f.acceleration!=null? f.acceleration : existing.acceleration||null);
        if(f.thresholds){ existing.thresholds = { enter: f.thresholds.enter, exit: f.thresholds.exit }; }
        existing.gate = f.gate!=null? !!f.gate : existing.gate||null;
        // WEBWAY:ww-2025-002: compute 1-D pinch-axis lookahead prediction (flagged)
        try {
          if(predictCfg.enabled && existing.gate){
            const idxTip = f.indexTip && v2(f.indexTip);
            const thTip  = f.thumbTip && v2(f.thumbTip);
            const idxMCP = f.indexMCP && v2(f.indexMCP);
            const pkyMCP = f.pinkyMCP && v2(f.pinkyMCP);
            if(idxTip && thTip && idxMCP && pkyMCP){
              const O = mul(add(idxMCP, pkyMCP), 0.5); // origin at knuckle midpoint
              const U = norm(sub(idxMCP, pkyMCP));     // axis from pinky->index MCP
              const sIdx = projectScalar(idxTip, O, U);
              const sTh  = projectScalar(thTip,  O, U);
              const dAxis = Math.abs(sIdx - sTh);
              // Use normalized pinch metric if available; else normalize by palm width (|idxMCP-pkyMCP|)
              const palmW = Math.max(len(sub(idxMCP, pkyMCP)), 1e-4);
              const normNow = existing.norm != null ? existing.norm : (dAxis / palmW);
              // Kinematics per-hand state
              const kin = existing._kin || (existing._kin = {});
              const lastT = kin.t || evt.t;
              const dt = Math.max(1e-3, (evt.t - lastT) / 1000);
              const vInst = (normNow - (kin.norm ?? normNow)) / dt; // instantaneous v
              const vSm = kin.v != null ? (predictCfg.smoothAlpha * vInst + (1-predictCfg.smoothAlpha) * kin.v) : vInst;
              const aInst = (vSm - (kin.v ?? vSm)) / dt;
              const aClamped = Math.max(-predictCfg.maxAccel, Math.min(predictCfg.maxAccel, aInst));
              kin.t = evt.t; kin.norm = normNow; kin.v = vSm; kin.a = aClamped;
              kin.sIdx = sIdx; kin.sTh = sTh; // store axis scalars for tips
              const aheadMs = (predictCfg.leadMs || 0) + (predictCfg.lookaheadMs || 0);
              const dtA = Math.max(-1.0, Math.min(1.0, aheadMs / 1000)); // clamp +/-1s for safety
              const dPred = clamp01(normNow + vSm * dtA + 0.5 * aClamped * dtA * dtA);
              const margin = Math.min(0.15, 0.5 * Math.abs(aClamped) * Math.abs(dtA) + 0.02);
              const range = [clamp01(dPred - margin), clamp01(dPred + margin)];
              // Distribute predicted delta symmetrically along axis for fingertip ranges
              const deltaD = (dPred - (dAxis / palmW));
              const half = 0.5 * deltaD * palmW;
              const band = 0.5 * margin * palmW;
              const sIdxLo = sIdx + half - band, sIdxHi = sIdx + half + band;
              const sThLo  = sTh  - half - band, sThHi  = sTh  - half + band;
              const pIdxLo = pointOnAxis(O, U, sIdxLo), pIdxHi = pointOnAxis(O, U, sIdxHi);
              const pThLo  = pointOnAxis(O, U, sThLo),  pThHi  = pointOnAxis(O, U, sThHi);
              existing.prediction = {
                enabled: true,
                gated: !!existing.gate,
                lookaheadMs: predictCfg.lookaheadMs,
                leadMs: predictCfg.leadMs,
                axis: { origin: [O[0], O[1]], u: [U[0], U[1]] },
                norm: { now: normNow, pred: dPred, range },
                tips: {
                  index: { now: [idxTip[0], idxTip[1]], range: { lo: [pIdxLo[0], pIdxLo[1]], hi: [pIdxHi[0], pIdxHi[1]] } },
                  thumb: { now: [thTip[0], thTip[1]],  range: { lo: [pThLo[0],  pThLo[1]],  hi: [pThHi[0],  pThHi[1]] } }
                }
              };
            }
          }
        } catch {}
        // WEBWAY:ww-2025-003: compute joint angle velocity and triple-consensus (flagged)
        try {
          if(consensusCfg.enabled && existing.gate && f.landmarks && f.landmarks.length>=21){
            const J = computeHandJointAngles(f.landmarks);
            if(J && J.index){
              const sumDeg = (J.index.mcpDeg||0) + (J.index.pipDeg||0) + (J.index.dipDeg||0);
              const kin = existing._kin || (existing._kin = {});
              const lastT = kin.t || evt.t;
              const dt = Math.max(1e-3, (evt.t - lastT) / 1000);
              const aVinst = (sumDeg - (kin.angSum ?? sumDeg)) / dt; // deg/s
              const aVsm = kin.angV != null ? (consensusCfg.smoothAlphaAngles * aVinst + (1-consensusCfg.smoothAlphaAngles) * kin.angV) : aVinst;
              kin.angSum = sumDeg; kin.angV = aVsm; kin.t = evt.t;
              const enter = (existing.thresholds && existing.thresholds.enter != null) ? existing.thresholds.enter : 0.5;
              const near = consensusCfg.nearEps;
              const nNow = existing.norm != null ? existing.norm : null;
              const vSm = kin.v != null ? kin.v : 0;
              const dPred = existing.prediction && existing.prediction.norm ? existing.prediction.norm.pred : null;
              const distOKNow = (nNow!=null) ? (nNow <= (enter + near)) : false;
              const kinOKNow = (vSm < -consensusCfg.vMin);
              const angOKNow = (aVsm > consensusCfg.angleVelMin);
              const lookDistOK = (dPred!=null) ? (dPred <= (enter + near)) : false;
              const lookKinOK = (vSm < -consensusCfg.vMin); // reuse smoothed v as near-future slope
              const lookAngOK = (aVsm > consensusCfg.angleVelMin);
              const passNow = consensusCfg.requireAll ? (distOKNow && kinOKNow && angOKNow) : ([distOKNow,kinOKNow,angOKNow].filter(Boolean).length>=2);
              const passLook = consensusCfg.requireAll ? (lookDistOK && lookKinOK && lookAngOK) : ([lookDistOK,lookKinOK,lookAngOK].filter(Boolean).length>=2);
              existing.consensus = { now:{ distOK:distOKNow, kinOK:kinOKNow, angOK:angOKNow, pass:passNow }, look:{ distOK:lookDistOK, kinOK:lookKinOK, angOK:lookAngOK, pass:passLook } };
            }
          }
        } catch {}
        // Maintain small hysteresis history for visualization (norm + gate)
        if(existing.history){
          existing.history.push({ t: evt.t, norm: existing.norm, gate: existing.gate });
          if(existing.history.length > 240) existing.history.splice(0, existing.history.length-240);
        }
      }
      // Joint angles events
      if(evt.type === 'finger:index:angles'){
        existing.indexAngles = { mcpDeg: evt.mcpDeg, pipDeg: evt.pipDeg, dipDeg: evt.dipDeg };
        // WEBWAY:ww-2025-025: Forward finger angles to listeners so VM/UI can bind flex per-hand (preserve seat if known)
        const out = { type:'finger:index:angles', t: evt.t, hand: evt.hand, handId: evt.handId, handKey: key, mcpDeg: evt.mcpDeg, pipDeg: evt.pipDeg, dipDeg: evt.dipDeg };
        if(existing.seat) out.seat = existing.seat;
        listeners.forEach(h => { try { h(out); } catch {} });
      } else if(evt.type === 'finger:thumb:angles'){
        existing.thumbAngles = { cmcDeg: evt.cmcDeg, mcpDeg: evt.mcpDeg, ipDeg: evt.ipDeg };
      }
      // Wrist orientation events (hypothetical types: 'wrist:orientation')
      if(evt.type && evt.type.startsWith('wrist:')){
        // Store generic orientation payload sans large objects
        existing.orientation = Object.assign({}, evt);
      }
      lastRichByHand.set(key, existing);
    }
  }));

  if(bridge){
    bridge.on(actionEvt => { actionListeners.forEach(h=>{ try{ h(actionEvt); }catch{} }); });
    if(telem){
      bridge.on(actionEvt => {
        if(actionEvt.orientBucket){ telem.orientCounts[actionEvt.orientBucket] = (telem.orientCounts[actionEvt.orientBucket]||0)+1; }
      });
    }
  }

  function onEvent(handler){ listeners.add(handler); return () => listeners.delete(handler); }
  function onAction(handler){ actionListeners.add(handler); return () => actionListeners.delete(handler); }

  async function startCamera(videoEl){
    const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'user' }, audio:false });
    videoEl.srcObject = stream;
    if (videoEl.readyState < 1) {
      await new Promise(res => { const to=setTimeout(res,1500); videoEl.onloadedmetadata=()=>{ clearTimeout(to); res(); }; });
    }
  mp = createMediaPipeSource(videoEl, f => { lastFrame = f; router.onFrame(f); hsm.onFrame(f); });
    await mp.start();
    await videoEl.play();
  }

  async function startVideoUrl(videoEl, url){
    // WEBWAY:ww-2025-057: set muted/playsInline for reliable autoplay under test runners
    try{ videoEl.muted = true; videoEl.playsInline = true; }catch{}
    videoEl.srcObject = null; videoEl.src = url;
    if (videoEl.readyState < 1) {
      await new Promise(res => { const to=setTimeout(res,2000); videoEl.onloadedmetadata=()=>{ clearTimeout(to); res(); }; });
    }
  mp = createMediaPipeSource(videoEl, f => { lastFrame = f; router.onFrame(f); hsm.onFrame(f); });
    await mp.start();
    videoEl.currentTime = 0;
    await videoEl.play();
  }

  function stop(videoEl){ try { if(mp) mp.stop(); }catch{}; try { if(videoEl) { videoEl.pause(); if(videoEl.srcObject){ videoEl.srcObject.getTracks().forEach(t=>t.stop()); videoEl.srcObject=null; } } }catch{}; hsm.dispose(); }

  // WEBWAY:ww-2025-011: attempt to apply constraints to active camera without restart
  async function applyCameraConstraints(videoEl, { width, height, frameRate }={}){
    if(!flag('FEATURE_CAMERA_CONSTRAINTS')) return { applied:false, reason:'flag-disabled' };
    const stream = videoEl && videoEl.srcObject;
    if(!stream) return { applied:false, reason:'no-stream' };
    const track = stream.getVideoTracks && stream.getVideoTracks()[0];
    if(!track) return { applied:false, reason:'no-track' };
    const constraints = { advanced: [] };
    if(width || height){ constraints.width = width; constraints.height = height; }
    if(frameRate){ constraints.frameRate = frameRate; }
    try {
      await track.applyConstraints(constraints);
      const settings = track.getSettings ? track.getSettings() : {};
      dispatchCameraEvent('camera:constraints-applied', { method:'apply', settings, requested:{ width, height, frameRate } });
      return { applied:true, settings };
    } catch(err){
      return restartCamera(videoEl, { width, height, frameRate, fallbackError: err && err.message });
    }
  }

  // WEBWAY:ww-2025-011: full restart with new constraints as fallback
  async function restartCamera(videoEl, { width, height, frameRate, facingMode='user', fallbackError }={}){
    if(!flag('FEATURE_CAMERA_CONSTRAINTS')) return { applied:false, reason:'flag-disabled' };
    try {
      if(videoEl && videoEl.srcObject){ try { videoEl.srcObject.getTracks().forEach(t=>t.stop()); } catch{} }
      const constraints = { video: { facingMode } };
      if(width || height || frameRate){ constraints.video = { ...constraints.video, width, height, frameRate }; }
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoEl.srcObject = stream;
      if (videoEl.readyState < 1) {
        await new Promise(res => { const to=setTimeout(res,1500); videoEl.onloadedmetadata=()=>{ clearTimeout(to); res(); }; });
      }
      if(mp){ try{ mp.stop(); }catch{} }
      mp = createMediaPipeSource(videoEl, f => { lastFrame = f; router.onFrame(f); hsm.onFrame(f); });
      await mp.start();
      await videoEl.play();
      const track = stream.getVideoTracks && stream.getVideoTracks()[0];
      const settings = track && track.getSettings ? track.getSettings() : {};
      dispatchCameraEvent('camera:constraints-applied', { method:'restart', settings, requested:{ width, height, frameRate }, fallbackError });
      return { applied:true, settings, restart:true };
    } catch(err){
      dispatchCameraEvent('camera:constraints-failed', { error: err && err.message, requested:{ width, height, frameRate }, fallbackError });
      return { applied:false, reason:'restart-failed', error: err && err.message };
    }
  }

  function dispatchCameraEvent(type, detail){
    try { document.dispatchEvent(new CustomEvent(type, { detail })); } catch {}
  }

  function getState(){ return { seats: router.getState(), hands: hsm.state(), actions: bridge?undefined:undefined, telemetry: telemEnabled ? telem : null, lastFrame }; }
  // WEBWAY:ww-2025-043: SeatConfig API on shell
  function getSeatConfig(seat){ return seatCfg.get(seat); }
  function setSeatConfig(seat, partial){
    const cfg = seatCfg.set(seat, partial);
    // propagate relevant knobs
    if(cfg.enterThresh!=null || cfg.exitThresh!=null){ try{ hsm.updatePinchConfig && hsm.updatePinchConfig({ enterThresh: cfg.enterThresh, exitThresh: cfg.exitThresh }); }catch{} }
    if(cfg.lookaheadMs!=null){ try{ updatePredictionConfig({ enabled:true, lookaheadMs: cfg.lookaheadMs }); }catch{} }
    return cfg;
  }
  function setSeatPreset(seat, presetId){ const res = seatCfg.setPreset(seat, presetId); if(res.ok){ setSeatConfig(seat, res.cfg); } return res; }
  // WEBWAY:ww-2025-013 dynamic config update stubs (no-op for now; extend to propagate to hsm + MP source)
  function updatePinchConfig(part){ try{ hsm.updatePinchConfig && hsm.updatePinchConfig(part); }catch{} }
  // WEBWAY:ww-2025-002: runtime tuning for lookahead/lead (non-breaking)
  function updatePredictionConfig(part){
    if(!part) return { applied:false };
    if(typeof part.enabled === 'boolean') predictCfg.enabled = part.enabled;
    if(typeof part.lookaheadMs === 'number') predictCfg.lookaheadMs = part.lookaheadMs;
    if(typeof part.leadMs === 'number') predictCfg.leadMs = part.leadMs;
    if(typeof part.smoothAlpha === 'number') predictCfg.smoothAlpha = Math.max(0.0, Math.min(1.0, part.smoothAlpha));
    if(typeof part.maxAccel === 'number') predictCfg.maxAccel = Math.max(0.5, Math.min(20.0, part.maxAccel));
    return { applied:true, cfg: { ...predictCfg } };
  }
  function updateMediaPipeConfig(part){ /* placeholder: MP graph options not yet exposed */ return { applied:false, reason:'not-implemented' }; }
  // WEBWAY:ww-2025-003: runtime consensus tuning
  function updateConsensusConfig(part){
    if(!part) return { applied:false };
    if(typeof part.enabled === 'boolean') consensusCfg.enabled = part.enabled;
    if(typeof part.requireAll === 'boolean') consensusCfg.requireAll = part.requireAll;
    if(typeof part.nearEps === 'number') consensusCfg.nearEps = Math.max(0, Math.min(0.1, part.nearEps));
    if(typeof part.vMin === 'number') consensusCfg.vMin = Math.max(0.0, Math.min(1.0, part.vMin));
    if(typeof part.angleVelMin === 'number') consensusCfg.angleVelMin = Math.max(0, Math.min(180, part.angleVelMin));
    if(typeof part.smoothAlphaAngles === 'number') consensusCfg.smoothAlphaAngles = Math.max(0.0, Math.min(1.0, part.smoothAlphaAngles));
    return { applied:true, cfg: { ...consensusCfg } };
  }
  function getRichSnapshot(){
    const arr=[]; lastRichByHand.forEach(v=>arr.push(v)); return arr;
  }
  return { startCamera, startVideoUrl, stop, onEvent, onAction, getState, router, hsm, bridge, applyCameraConstraints, restartCamera, updatePinchConfig, updatePredictionConfig, updateConsensusConfig, updateMediaPipeConfig, getRichSnapshot, getSeatConfig, setSeatConfig, setSeatPreset };
}




