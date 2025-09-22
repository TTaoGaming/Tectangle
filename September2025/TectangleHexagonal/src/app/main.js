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

import { createPinchCore } from '../core/pinchCore.js';
import { createControllerRouter } from './controllerRouterCore.js';
import { createMediaPipeSource, createMediaPipeImageDetector } from '../ports/mediapipe.js';
import { Beeper } from '../ports/audio.js';
import { MidiOut } from '../ports/midi.js';
import { GoldenRecorder } from '../ports/goldenRecorder.js';
import { LandmarksRecorder } from '../ports/landmarksRecorder.js';
import { createOverlay } from '../ui/overlay.js';
import { AnalysisRecorder } from '../ports/analysisRecorder.js';
import { createHUD } from '../ui/hud.js';

const Q = new URLSearchParams(location.search);
const byId = id => document.getElementById(id);
const video = byId('cam');
const hud = createHUD(document);
const overlay = createOverlay(byId('overlay'));
const golden = new GoldenRecorder();
const landmarks = new LandmarksRecorder();
const beeper = new Beeper();
const midi = new MidiOut();
const ctxR = byId('r_hyst')?.getContext('2d');
const ctxL = byId('l_hyst')?.getContext('2d');
const analysis = new AnalysisRecorder();

let mp=null;
const cores = new Map(); // hand -> { core, unsub, meta }
// Lightweight run-state for harnesses to detect readiness
const RunState = { mediaReady:false, mpStarted:false, playing:false };
try{ window.__hexRunState = RunState; }catch{}

const DEFAULT_SEAT_OUTPUTS = {
  P1: { key:'Z', note:60 },
  P2: { key:'X', note:62 },
  P3: { key:'C', note:64 },
  P4: { key:'V', note:65 },
};
const CUSTOM_SEAT_OUTPUTS = (typeof window !== 'undefined' && window.HEX_CONTROLLER_OUTPUTS && typeof window.HEX_CONTROLLER_OUTPUTS === 'object') ? window.HEX_CONTROLLER_OUTPUTS : {};
function resolveSeatOutput(controllerId, handLabel){
  const table = Object.assign({}, DEFAULT_SEAT_OUTPUTS, CUSTOM_SEAT_OUTPUTS);
  if(controllerId && table[controllerId]) return table[controllerId];
  // Avoid relying on hand labels for seat mapping; default to P1 when unknown
  return table.P1 || { key:'Z', note:60 };
}

function highlightKey(key, mode){ const el=document.querySelector(`.key[data-key="${key}"]`); if(!el) return; el.classList.toggle('down', mode==='down' || mode==='hold'); el.classList.toggle('hold', mode==='hold'); }
function postToParent(payload){ try{ window.parent && window.parent !== window && window.parent.postMessage({ source:'hex', ...payload }, '*'); }catch{} }

function handlePinchEvent(meta, event){
  const evt = Object.assign({}, event);
  evt.hand = evt.hand || meta.hand || 'Hand';
  evt.handId = evt.handId ?? meta.handId ?? null;
  if(meta.controllerId != null && evt.controllerId == null){
    evt.controllerId = meta.controllerId;
  }
  let controllerId = null;
  if(typeof ControllerRouter !== 'undefined' && ControllerRouter.isEnabled && ControllerRouter.isEnabled()){
    controllerId = ControllerRouter.onPinchEvent(evt);
  }
  if(controllerId == null && evt.controllerId != null){
    controllerId = evt.controllerId;
  }
  if(controllerId != null){
    evt.controllerId = controllerId;
    meta.controllerId = controllerId;
  }
  meta.hand = evt.hand;
  meta.handId = evt.handId;
  const seatOutput = resolveSeatOutput(evt.controllerId, evt.hand);
  const useMidi = byId('midi').checked;
  if(evt.type==='pinch:down'){
    // Track start time for duration computation
    meta.__downT = evt.t;
    Telemetry.noteDown(evt.hand, evt.handId, evt.controllerId, evt.t, !!evt.speculative);
    const predAbsV = (typeof evt.toiPredAbsV==='number' && isFinite(evt.toiPredAbsV)) ? Math.round(evt.toiPredAbsV) : null;
    const predAbsA = (typeof evt.toiPredAbsA==='number' && isFinite(evt.toiPredAbsA)) ? Math.round(evt.toiPredAbsA) : null;
    if(predAbsV!=null) Telemetry.notePredictedToiAbs(predAbsV);
    analysis.event({ t:evt.t, type:'down', hand:evt.hand, handId:evt.handId||null, controllerId:evt.controllerId, spec:!!evt.speculative, toiPredV: null, toiPredA: null, toiPredAbsV: predAbsV, toiPredAbsA: predAbsA, toiActualEnterAbs: null });
    try{ window.dispatchEvent(new CustomEvent('hex-pinch', { detail:{ action:'down', hand:evt.hand, controllerId:evt.controllerId, t:evt.t } })); }catch{}
    document.dispatchEvent(new KeyboardEvent('keydown',{ key:seatOutput.key, bubbles:true }));
  postToParent({ type:'pinch-key', action:'down', key:seatOutput.key, controllerId:evt.controllerId });
    if(byId('beep').checked) beeper.down();
    if(useMidi) midi.send(0x90, seatOutput.note, 100);
    highlightKey(seatOutput.key,'down');
    golden.frame({ t:evt.t, event:'down', hand:evt.hand, controllerId:evt.controllerId, handId:evt.handId||null, spec:!!evt.speculative, toi: evt.toi!=null? Math.round(evt.toi): null });
  } else if(evt.type==='pinch:hold'){
    highlightKey(seatOutput.key,'hold');
  } else if(evt.type==='pinch:up'){
    const durationMs = (typeof meta.__downT === 'number' && isFinite(meta.__downT)) ? Math.max(0, Math.round(evt.t - meta.__downT)) : null;
    Telemetry.noteUp(evt.hand, evt.handId, evt.controllerId, evt.t);
    analysis.event({ t:evt.t, type:'up', hand:evt.hand, handId:evt.handId||null, controllerId:evt.controllerId, spec:false, durationMs });
    try{ window.dispatchEvent(new CustomEvent('hex-pinch', { detail:{ action:'up', hand:evt.hand, controllerId:evt.controllerId, t:evt.t, durationMs } })); }catch{}
    document.dispatchEvent(new KeyboardEvent('keyup',{ key:seatOutput.key, bubbles:true }));
  postToParent({ type:'pinch-key', action:'up', key:seatOutput.key, controllerId:evt.controllerId, durationMs });
    if(byId('beep').checked) beeper.up();
    if(useMidi) midi.send(0x80, seatOutput.note, 0);
    highlightKey(seatOutput.key,'up');
    golden.frame({ t:evt.t, event:'up', hand:evt.hand, controllerId:evt.controllerId, handId:evt.handId||null });
  } else if(evt.type==='pinch:cancel'){
    Telemetry.noteSpecCancel();
    analysis.event({ t:evt.t, type:'cancel', hand:evt.hand, handId:evt.handId||null, controllerId:evt.controllerId, spec:true });
    try{ window.dispatchEvent(new CustomEvent('hex-pinch', { detail:{ action:'cancel', hand:evt.hand, controllerId:evt.controllerId, t:evt.t } })); }catch{}
  } else if(evt.type==='pinch:confirm'){
    const tAct = (typeof evt.toiActualEnterAbs==='number') ? evt.toiActualEnterAbs : null;
    if(tAct!=null) Telemetry.noteActualEnterAbs(tAct);
    analysis.event({ t:evt.t, type:'confirm', hand:evt.hand, handId:evt.handId||null, controllerId:evt.controllerId, spec:true, toiActualEnterAbs: tAct });
    try{ window.dispatchEvent(new CustomEvent('hex-pinch', { detail:{ action:'confirm', hand:evt.hand, controllerId:evt.controllerId, t:evt.t } })); }catch{}
  }
  return evt.controllerId ?? null;
}


function ensureCoreWithMeta(key, seedMeta = {}){
  if(cores.has(key)) return cores.get(key);
  const meta = {
    hand: seedMeta.hand ?? null,
    handId: seedMeta.handId ?? null,
    controllerId: seedMeta.controllerId ?? null,
  };
  const core = createPinchCore({
  // Tuned baseline from offline sweep (see tests/replay/tune_toi_params.mjs): enter=0.40 exit=0.70 cone=25; OneEuro ~2.2/0.04/1.2
  enterThresh:+byId('enter').value||0.40,
  exitThresh:+byId('exit').value||0.70,
    palmConeDeg:+byId('cone').value||30,
    palmGate: byId('palmGate')?.checked!==false,
    enableSpeculative: byId('speculative')?.checked!==false,
    holdDeadzoneEnabled: byId('holdDeadzoneEnabled')?.checked===true,
    holdDeadzoneNorm: +byId('holdDeadzone')?.value || 0,
  oneEuro: { minCutoff:+byId('minCutoff').value||2.2, beta:+byId('beta').value||0.04, dCutoff:+byId('dCutoff').value||1.2 }
  });
  const entry = { core, unsub: null, meta };
  entry.unsub = core.on(evt=>{
    const enriched = Object.assign({ hand: meta.hand, handId: meta.handId, controllerId: meta.controllerId }, evt);
    const controllerId = handlePinchEvent(meta, enriched);
    if(controllerId != null){ meta.controllerId = controllerId; }
    hud.setState(meta.hand || meta.handId || 'Hand', evt.type.replace('pinch:',''));
  });
  cores.set(key, entry);
  return entry;
}

function ensureCoreForFrame(frame){
  const key = frame.handId ? `id:${frame.handId}` : `hand:${frame.hand || 'unknown'}`;
  const entry = cores.get(key) || ensureCoreWithMeta(key, { hand: frame.hand || null, handId: frame.handId || null, controllerId: frame.controllerId ?? null });
  if(frame.hand) entry.meta.hand = frame.hand;
  if(frame.handId != null) entry.meta.handId = frame.handId;
  if(frame.controllerId != null) entry.meta.controllerId = frame.controllerId;
  return entry;
}


function telemetry(){ // minimal snapshot
  const downs = (window.__downs = (window.__downs||0));
  return { downs };
}

export async function startCamera(){
  try{
    const stream=await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'user' }, audio:false });
    video.srcObject=stream;
    // Wait metadata before starting MP to avoid missing first frames
    if (video.readyState < 1) {
      await new Promise((res) => { const to=setTimeout(res,1500); video.onloadedmetadata = ()=>{ clearTimeout(to); res(); }; });
    }
  } catch(e){ alert('Camera permission required.'); throw e; }
  mp = createMediaPipeSource(video, f=>{
    Telemetry.noteFrame();
    try{ ControllerRouter.onFrame && ControllerRouter.onFrame(f); }catch{}
    const entry = ensureCoreForFrame(f);
    if(entry.meta){
      entry.meta.hand = f.hand;
      if(f.handId !== undefined && f.handId !== null) entry.meta.handId = f.handId;
      if(f.controllerId !== undefined && f.controllerId !== null) entry.meta.controllerId = f.controllerId;
    }
    const res = entry.core.update(f);
    try{
      if(ControllerRouter.isEnabled && ControllerRouter.isEnabled()){
        const key = entry.meta.handId ? `id:${entry.meta.handId}` : (entry.meta.hand ? `hand:${entry.meta.hand}` : null);
        const seat = ControllerRouter.getControllerForHand && ControllerRouter.getControllerForHand(key);
        if(seat){ entry.meta.controllerId = seat; }
      }
    }catch{}
  const { state, norm, rawNorm, gate, ang, debug, toi, toiA, vRel, aRel } = res;
    overlay.clear(); overlay.drawHands(mp.getLastLandmarks()); overlay.annotate(`enter:${(+byId('enter').value).toFixed(2)} exit:${(+byId('exit').value).toFixed(2)} cone:${(+byId('cone').value).toFixed(0)}°`);
    hud.setPalmAngle(f.hand, ang, gate, +byId('cone').value);
    hud.debugUpdate(f.hand, { ...debug, rawNorm, norm, gate, enter:+byId('enter').value, exit:+byId('exit').value });
    const ctx = f.hand==='Right'? ctxR : ctxL; if(ctx) overlay.drawHyst(ctx, norm, +byId('enter').value, +byId('exit').value, gate);
  hud.updateRuntime({ norm, gate, fps: FPS.tick(f.t), snapshot: Telemetry.snapshot(), toi });
  golden.frame({ t:f.t, norm:+norm.toFixed(4), state, gate, toi: isFinite(toi)? Math.round(toi): null });
    analysis.frame({ t:f.t, hand:f.hand, state, gate, ang, norm:+norm.toFixed(4), rawNorm:+rawNorm.toFixed(4), vRel:+(vRel??0).toFixed(4), aRel:+(aRel??0).toFixed(4),
      toiPredV: isFinite(toi)? Math.round(toi): null, toiPredA: isFinite(toiA)? Math.round(toiA): null,
      toiPredAbsV: null, toiPredAbsA: null,
      raw: { indexTip: f.indexTip, thumbTip: f.thumbTip, wrist: f.wrist, indexMCP: f.indexMCP, pinkyMCP: f.pinkyMCP },
      smoothed: { indexTip: [debug.ixSm, debug.iySm, debug.izSm], thumbTip: [debug.txSm, debug.tySm, debug.tzSm] }
    });
    landmarks.frame({ t:f.t, hand:f.hand, indexTip:f.indexTip, thumbTip:f.thumbTip, wrist:f.wrist, indexMCP:f.indexMCP, pinkyMCP:f.pinkyMCP });
  });
  await mp.start(); RunState.mpStarted = true; await midi.init();
  // Start playback after MP is ready
  try{
    if (video.readyState < 2) { await new Promise(res=>{ const to=setTimeout(res,1500); video.oncanplay = ()=>{ clearTimeout(to); res(); }; }); }
    const played = video.play(); if (played && typeof played.then==='function') await played;
    await new Promise(res=>{ let done=false; const on=()=>{ if(done) return; done=true; video.removeEventListener('playing', on); res(); }; video.addEventListener('playing', on, { once:true }); setTimeout(on, 500); });
    RunState.playing = true;
  }catch{}
  hud.status('running');
  golden.start({ sha:'hex-local', device:navigator.userAgent, fps:'rAF', cfg:{ enter:+byId('enter').value, exit:+byId('exit').value, cone:+byId('cone').value } });
  landmarks.start({ sha:'hex-local', source:'camera', cfg:{ enter:+byId('enter').value, exit:+byId('exit').value, cone:+byId('cone').value } });
  analysis.start({ sha:'hex-local', source:'camera', cfg:{ enter:+byId('enter').value, exit:+byId('exit').value, cone:+byId('cone').value, oneEuro:{ min:+byId('minCutoff').value, beta:+byId('beta').value, d:+byId('dCutoff').value } } });
}

export async function startVideoFile(file){
  const url = URL.createObjectURL(file);
  video.srcObject=null; video.src = url; RunState.mediaReady = false; RunState.mpStarted=false; RunState.playing=false;
  // Ensure metadata before starting MP
  if (video.readyState < 1) {
    await new Promise((res) => { const to=setTimeout(res,1500); video.onloadedmetadata = ()=>{ clearTimeout(to); RunState.mediaReady=true; res(); }; });
  } else { RunState.mediaReady = true; }
  mp = createMediaPipeSource(video, f=>{
    Telemetry.noteFrame();
    try{ ControllerRouter.onFrame && ControllerRouter.onFrame(f); }catch{}
    const entry = ensureCoreForFrame(f);
    if(entry.meta){
      entry.meta.hand = f.hand;
      if(f.handId !== undefined && f.handId !== null) entry.meta.handId = f.handId;
      if(f.controllerId !== undefined && f.controllerId !== null) entry.meta.controllerId = f.controllerId;
    }
    const res = entry.core.update(f);
    try{
      if(ControllerRouter.isEnabled && ControllerRouter.isEnabled()){
        const key = entry.meta.handId ? `id:${entry.meta.handId}` : (entry.meta.hand ? `hand:${entry.meta.hand}` : null);
        const seat = ControllerRouter.getControllerForHand && ControllerRouter.getControllerForHand(key);
        if(seat){ entry.meta.controllerId = seat; }
      }
    }catch{}
  const { state, norm, rawNorm, gate, ang, debug, toi, toiA, vRel, aRel } = res;
    overlay.clear(); overlay.drawHands(mp.getLastLandmarks()); overlay.annotate(`video enter:${(+byId('enter').value).toFixed(2)} exit:${(+byId('exit').value).toFixed(2)} cone:${(+byId('cone').value).toFixed(0)}°`);
    hud.setPalmAngle(f.hand, ang, gate, +byId('cone').value);
    hud.debugUpdate(f.hand, { ...debug, rawNorm, norm, gate, enter:+byId('enter').value, exit:+byId('exit').value });
    const ctx = f.hand==='Right'? ctxR : ctxL; if(ctx) overlay.drawHyst(ctx, norm, +byId('enter').value, +byId('exit').value, gate);
  hud.updateRuntime({ norm, gate, fps: FPS.tick(f.t), snapshot: Telemetry.snapshot(), toi });
  golden.frame({ t:f.t, norm:+norm.toFixed(4), state, gate, toi: isFinite(toi)? Math.round(toi): null });
    analysis.frame({ t:f.t, hand:f.hand, state, gate, ang, norm:+norm.toFixed(4), rawNorm:+rawNorm.toFixed(4), vRel:+(vRel??0).toFixed(4), aRel:+(aRel??0).toFixed(4),
      toiPredV: isFinite(toi)? Math.round(toi): null, toiPredA: isFinite(toiA)? Math.round(toiA): null,
      toiPredAbsV: null, toiPredAbsA: null,
      raw: { indexTip: f.indexTip, thumbTip: f.thumbTip, wrist: f.wrist, indexMCP: f.indexMCP, pinkyMCP: f.pinkyMCP },
      smoothed: { indexTip: [debug.ixSm, debug.iySm, debug.izSm], thumbTip: [debug.txSm, debug.tySm, debug.tzSm] }
    });
    landmarks.frame({ t:f.t, hand:f.hand, indexTip:f.indexTip, thumbTip:f.thumbTip, wrist:f.wrist, indexMCP:f.indexMCP, pinkyMCP:f.pinkyMCP });
  });
  await mp.start(); RunState.mpStarted = true; await midi.init();
  // Start playback after MP is ready
  try{
    video.currentTime = 0;
    if (video.readyState < 2) { await new Promise(res=>{ const to=setTimeout(res,1500); video.oncanplay = ()=>{ clearTimeout(to); res(); }; }); }
    const played = video.play(); if (played && typeof played.then==='function') await played;
    await new Promise(res=>{ let done=false; const on=()=>{ if(done) return; done=true; video.removeEventListener('playing', on); res(); }; video.addEventListener('playing', on, { once:true }); setTimeout(on, 500); });
    RunState.playing = true;
  }catch{}
  hud.status('running (video)');
  golden.start({ sha:'hex-local', device:'video-file', fps:'rAF', cfg:{ enter:+byId('enter').value, exit:+byId('exit').value, cone:+byId('cone').value } });
  landmarks.start({ sha:'hex-local', source:'video-file', cfg:{ enter:+byId('enter').value, exit:+byId('exit').value, cone:+byId('cone').value } });
  analysis.start({ sha:'hex-local', source:'video-file', cfg:{ enter:+byId('enter').value, exit:+byId('exit').value, cone:+byId('cone').value, oneEuro:{ min:+byId('minCutoff').value, beta:+byId('beta').value, d:+byId('dCutoff').value } } });
  video.onended = ()=> stop();
}

export async function startVideoUrl(fileUrl){
  try{
    video.srcObject=null; video.src = fileUrl; RunState.mediaReady=false; RunState.mpStarted=false; RunState.playing=false;
    // Wait metadata first so MP knows dimensions
    if (video.readyState < 1) {
      await new Promise((res) => { const to=setTimeout(res,2000); video.onloadedmetadata = ()=>{ clearTimeout(to); RunState.mediaReady=true; res(); }; });
    } else { RunState.mediaReady = true; }
  }
  catch(e){ console.error('Could not set URL', fileUrl, e); throw e; }
  mp = createMediaPipeSource(video, f=>{
    Telemetry.noteFrame();
    try{ ControllerRouter.onFrame && ControllerRouter.onFrame(f); }catch{}
    const entry = ensureCoreForFrame(f);
    if(entry.meta){
      entry.meta.hand = f.hand;
      if(f.handId !== undefined && f.handId !== null) entry.meta.handId = f.handId;
      if(f.controllerId !== undefined && f.controllerId !== null) entry.meta.controllerId = f.controllerId;
    }
    const res = entry.core.update(f);
    try{
      if(ControllerRouter.isEnabled && ControllerRouter.isEnabled()){
        const key = entry.meta.handId ? `id:${entry.meta.handId}` : (entry.meta.hand ? `hand:${entry.meta.hand}` : null);
        const seat = ControllerRouter.getControllerForHand && ControllerRouter.getControllerForHand(key);
        if(seat){ entry.meta.controllerId = seat; }
      }
    }catch{}
  const { state, norm, rawNorm, gate, ang, debug, toi, toiA, vRel, aRel } = res;
    overlay.clear(); overlay.drawHands(mp.getLastLandmarks()); overlay.annotate(`video enter:${(+byId('enter').value).toFixed(2)} exit:${(+byId('exit').value).toFixed(2)} cone:${(+byId('cone').value).toFixed(0)}°`);
    hud.setPalmAngle(f.hand, ang, gate, +byId('cone').value);
    hud.debugUpdate(f.hand, { ...debug, rawNorm, norm, gate, enter:+byId('enter').value, exit:+byId('exit').value });
    const ctx = f.hand==='Right'? ctxR : ctxL; if(ctx) overlay.drawHyst(ctx, norm, +byId('enter').value, +byId('exit').value, gate);
  hud.updateRuntime({ norm, gate, fps: FPS.tick(f.t), snapshot: Telemetry.snapshot(), toi });
  golden.frame({ t:f.t, norm:+norm.toFixed(4), state, gate, toi: isFinite(toi)? Math.round(toi): null });
    analysis.frame({ t:f.t, hand:f.hand, state, gate, ang, norm:+norm.toFixed(4), rawNorm:+rawNorm.toFixed(4), vRel:+(vRel??0).toFixed(4), aRel:+(aRel??0).toFixed(4),
      toiPredV: isFinite(toi)? Math.round(toi): null, toiPredA: isFinite(toiA)? Math.round(toiA): null,
      toiPredAbsV: null, toiPredAbsA: null,
      raw: { indexTip: f.indexTip, thumbTip: f.thumbTip, wrist: f.wrist, indexMCP: f.indexMCP, pinkyMCP: f.pinkyMCP }
    });
  });
  await mp.start(); RunState.mpStarted = true; await midi.init(); hud.status('running (video-url)');
  // Begin playback only after MP started
  try{
    video.currentTime = 0;
    if (video.readyState < 2) { await new Promise(res=>{ const to=setTimeout(res,2000); video.oncanplay = ()=>{ clearTimeout(to); res(); }; }); }
    const played = video.play(); if (played && typeof played.then==='function') await played;
    await new Promise(res=>{ let done=false; const on=()=>{ if(done) return; done=true; video.removeEventListener('playing', on); res(); }; video.addEventListener('playing', on, { once:true }); setTimeout(on, 500); });
    RunState.playing = true;
  }catch{}
  golden.start({ sha:'hex-local', device:'video-url', fps:'rAF', cfg:{ enter:+byId('enter').value, exit:+byId('exit').value, cone:+byId('cone').value } });
  video.onended = ()=> stop();
}

export function stop(){
  for(const [hand,obj] of cores){ if(obj.unsub) obj.unsub(); }
  cores.clear();
  try{ if(mp) mp.stop(); }catch{}
  if(video.srcObject){ try{ video.srcObject.getTracks().forEach(t=>t.stop()); }catch{} video.srcObject=null; }
  try{ video.pause(); }catch{}
  beeper.up(); hud.status('stopped');
  // Reset run-state
  RunState.mediaReady=false; RunState.mpStarted=false; RunState.playing=false;
}

export function applyConfigToCores(){
  const cfg = {
  enterThresh:+byId('enter').value||0.40,
  exitThresh:+byId('exit').value||0.70,
    palmConeDeg:+byId('cone').value||30,
    palmGate: byId('palmGate')?.checked!==false,
    enableSpeculative: byId('speculative')?.checked!==false,
    holdDeadzoneEnabled: byId('holdDeadzoneEnabled')?.checked===true,
    holdDeadzoneNorm: +byId('holdDeadzone')?.value || 0,
  oneEuro: { minCutoff:+byId('minCutoff').value||2.2, beta:+byId('beta').value||0.04, dCutoff:+byId('dCutoff').value||1.2 }
  };
  for(const [hand, obj] of cores){ obj.core.setConfig(cfg); }
}

// Minimal Telemetry module (local)
const Telemetry = (()=>{
  const rec = { downs:0, ups:0, spec:0, specCancel:0, downLat:[], frames:0, lastToiError:null, lastPredictedToi:null, lastPredictedToiAbs:null, lastActualEnterAbs:null, perHand:{ downs:{}, ups:{} } };
  let lastDownT=null;
  function bump(bucket, key){ if(!key) return; bucket[key] = (bucket[key]||0)+1; }
  function keyFor(hand, handId){ return handId || hand || 'unknown'; }
  return {
    noteFrame(){ rec.frames++; },
    noteDown(hand, handId, controllerId, t, isSpec){ if(isSpec) rec.spec++; rec.downs++; lastDownT=t; bump(rec.perHand.downs, keyFor(hand, handId)); },
    noteUp(hand, handId, controllerId, t){ rec.ups++; if(lastDownT!=null){ const d=t-lastDownT; if(d>=0&&d<2000) rec.downLat.push(d); } bump(rec.perHand.ups, keyFor(hand, handId)); },
    noteSpecCancel(){ rec.specCancel++; },
    notePredictedToiAbs(tAbs){ rec.lastPredictedToiAbs = tAbs; },
    noteActualEnterAbs(tAbs){ rec.lastActualEnterAbs = tAbs; if(rec.lastPredictedToiAbs!=null){ rec.lastToiError = Math.round(tAbs - rec.lastPredictedToiAbs); rec.lastPredictedToiAbs = null; } },
    snapshot(){
      const perHand = { downs:{}, ups:{} };
      for(const [k,v] of Object.entries(rec.perHand.downs)) perHand.downs[k] = v;
      for(const [k,v] of Object.entries(rec.perHand.ups)) perHand.ups[k] = v;
      return { downs: rec.downs, ups: rec.ups, specCancelRate: rec.spec? (rec.specCancel/Math.max(1,rec.spec)) : 0, meanDownLatency: rec.downLat.length? Math.round(rec.downLat.reduce((a,b)=>a+b,0)/rec.downLat.length) : 0, frames: rec.frames, lastToiError: rec.lastToiError, perHand };
    },
    lastDownDuration(){ if(lastDownT==null) return null; const last = rec.downLat[rec.downLat.length-1]; return last ?? null; }
  };
})();

export const FPS = (()=>{ let lastT=null, fps=null; return { tick(t){ if(lastT!=null){ const dt=(t-lastT)/1000; fps = Math.max(0, Math.min(240, 1/dt)); } lastT=t; return fps; } };})();

// Controller Router (Tier-1): first pinch assigns seats; lost seats can be re-acquired by proximity (no pinch).
// Delegate to pure core to preserve Hex boundaries and avoid duplication.
const ControllerRouter = (()=>{
  const enabled = (()=>{
    try{
      if (typeof window.FEATURE_HEX_CONTROLLER_ROUTER === 'boolean') return window.FEATURE_HEX_CONTROLLER_ROUTER;
      const q = new URLSearchParams(location.search);
      return q.get('controller') !== '0';
    }catch{ return true; }
  })();
  const seats = (typeof window !== 'undefined' && Array.isArray(window.HEX_CONTROLLER_SEATS) && window.HEX_CONTROLLER_SEATS.length)
    ? [...window.HEX_CONTROLLER_SEATS]
    : ['P1','P2','P3','P4'];
  const router = createControllerRouter({ enabled, seats, cfg: { lostAfterMs: 700, reserveTtlMs: 4000, snapDist: 0.15 } });
  return router;
})();

try{ window.__controller = ControllerRouter; }catch{}

// Headless golden replay (Right hand synthetic)
export async function replayGolden(frames){
  const key = 'hand:Right';
  if(!cores.has(key)){
    ensureCoreWithMeta(key, { hand:'Right' });
  }
  const entry = cores.get(key);
  const c = entry ? entry.core : null;
  if(!c) return;
  for(const f of frames){
    if(f && typeof f.t==='number' && typeof f.norm==='number'){
      const ix = 0.5 + f.norm/2;
      const tx = 0.5 - f.norm/2;
      c.update({ t:f.t, hand:'Right', indexTip:[ix,0.5,0], thumbTip:[tx,0.5,0], indexMCP:[0.4,0.6,0], pinkyMCP:[0.6,0.6,0], wrist:[0.5,0.7,0] });
    }
    await new Promise(r=>setTimeout(r, 1));
  }
}

// Replay full landmark traces (deterministic, no MediaPipe)
export async function replayLandmarks(frames){
  const hands = new Set(frames.map(f=> f.hand || 'Right'));
  for(const identifier of hands){ if(!cores.has(identifier)) ensureCoreWithMeta(identifier, identifier.startsWith('id:') ? { handId: identifier.slice(3) } : { hand: identifier.slice(5) }); }
  try{ if(!analysis.started){ analysis.start({ sha:'hex-local', source:'replay-landmarks', cfg:{ enter:+byId('enter').value||0.50, exit:+byId('exit').value||0.80, cone:+byId('cone').value||30, oneEuro:{ min:+byId('minCutoff').value||2.2, beta:+byId('beta').value||0.04, d:+byId('dCutoff').value||1.2 } } }); } }catch{}
  for(const f of frames){
    if(!(f && typeof f.t==='number')) continue;
    const hand = f.hand==='Left' ? 'Left' : 'Right';
    const entry = ensureCoreWithMeta(hand, { hand });
    const res = entry.core.update({ t:f.t, hand, indexTip:f.indexTip, thumbTip:f.thumbTip, wrist:f.wrist, indexMCP:f.indexMCP, pinkyMCP:f.pinkyMCP });
  const { state, norm, rawNorm, gate, ang, debug, toi, toiA, vRel, aRel } = res;
    try{
      analysis.frame({ t:f.t, hand, state, gate, ang, norm:+norm.toFixed(4), rawNorm:+rawNorm.toFixed(4), vRel:+(vRel??0).toFixed(4), aRel:+(aRel??0).toFixed(4),
        toiPredV: isFinite(toi)? Math.round(toi): null, toiPredA: isFinite(res.toiA)? Math.round(res.toiA): null, toiPredAbsV: null, toiPredAbsA: null,
        raw: { indexTip: f.indexTip, thumbTip: f.thumbTip, wrist: f.wrist, indexMCP: f.indexMCP, pinkyMCP: f.pinkyMCP },
        smoothed: { indexTip: [debug.ixSm, debug.iySm, debug.izSm], thumbTip: [debug.txSm, debug.tySm, debug.tzSm] }
      });
    }catch{}
    await new Promise(r=>setTimeout(r, 0));
  }
}

// Expose dev hooks
Object.defineProperties(window,{ __hex:{ get(){ return { startCamera, startVideoFile, startVideoUrl, stop, applyConfigToCores, replayGolden, replayLandmarks, processVideoUrl, processFrameUrls, cores }; } } });
// Signal readiness for automation harnesses (collectors/replays)
try { window.__hexReady = true; } catch {}
window.__getGolden = function(){ try{ return (golden && golden.lines) ? [...golden.lines] : []; }catch{ return []; } };
window.__getTelemetry = function(){ try{ return Telemetry.snapshot(); }catch{ return null; } };
window.__getLandmarks = function(){ try{ return (landmarks && landmarks.lines) ? [...landmarks.lines] : []; }catch{ return []; } };
window.__getAnalysis = function(){ try{ return (analysis && analysis.lines) ? [...analysis.lines] : []; }catch{ return []; } };
window.__landmarks = {
  start(){ try{ if(!landmarks.started){ landmarks.start({ sha:'hex-local', source:'manual', cfg:{ enter:+byId('enter').value, exit:+byId('exit').value, cone:+byId('cone').value } }); } }catch{} },
  stop(){ try{ landmarks.stop(); }catch{} },
  download(){ try{ landmarks.download(); }catch{} },
  get(){ try{ return (landmarks && landmarks.lines) ? [...landmarks.lines] : []; }catch{ return []; } }
};

// Automated capture helper: process a video URL and return artifacts when done
async function processVideoUrl(fileUrl){
  const locGolden = []; const locLand = [];
  // WEBWAY:ww-2025-013 (expires 2025-10-08) Rich Telemetry V1 scaffold
  // When FEATURE_RICH_TELEM_V1 is enabled (window.FEATURE_RICH_TELEM_V1===true), we also
  // capture per-frame rich telemetry objects derived from pinchCore outputs. This is additive
  // and does not modify existing golden/landmarks artifacts. Revert by removing this block & flag.
  const richEnabled = (typeof window !== 'undefined' && window.FEATURE_RICH_TELEM_V1 === true);
  const richFrames = richEnabled ? [] : null;
  // Simple sequential seat assignment (first distinct pinch:down => P1, second => P2)
  const seatMap = {}; // handKey -> seat
  const seatOrder = ['P1','P2','P3','P4'];
  function ensureSeatFor(handKey){
    if(!handKey) return null;
    if(seatMap[handKey]) return seatMap[handKey];
    const used = new Set(Object.values(seatMap));
    const seat = seatOrder.find(s=> !used.has(s));
    if(seat){ seatMap[handKey] = seat; return seat; }
    return null;
  }
  const rec = { downs:0, ups:0, spec:0, specCancel:0, downLat:[], frames:0, perHand:{ downs:{}, ups:{} } }; let lastDownT=null;
  function capTelemetryFrame(){ rec.frames++; }
  function capDown(hand, handId, t, s){ if(s) rec.spec++; rec.downs++; lastDownT=t; const key = handId || hand; if(key){ rec.perHand.downs[key] = (rec.perHand.downs[key] || 0) + 1; } }
  function capUp(hand, handId, t){ rec.ups++; if(lastDownT!=null){ const d=t-lastDownT; if(d>=0&&d<2000) rec.downLat.push(d); } const key = handId || hand; if(key){ rec.perHand.ups[key] = (rec.perHand.ups[key] || 0) + 1; } }
  function snapshot(){ return { downs: rec.downs, ups: rec.ups, specCancelRate: rec.spec? (rec.specCancel/Math.max(1,rec.spec)) : 0, meanDownLatency: rec.downLat.length? Math.round(rec.downLat.reduce((a,b)=>a+b,0)/rec.downLat.length) : 0, frames: rec.frames, perHand: rec.perHand }; }
  function applyFirstPinchPolicy(){
    try{
      const enabled = (typeof window.__firstPinchIsDown === 'boolean') ? window.__firstPinchIsDown : false;
      if(!enabled) return;
      if(rec.downs>0) return; // already has downs
      if(!locGolden.length) return;
      const first = JSON.parse(locGolden[0]||'{}');
      if(first && first.state==='Pinched' && first.gate===true){ rec.downs = 1; }
    }catch{}
  }
  async function runImageDetectorFallback(){
    try{
      const detector = await createMediaPipeImageDetector();
      // Ensure metadata ready to know dimensions & duration
      if (video.readyState < 1) {
        await new Promise((res) => {
          const to = setTimeout(res, 1500);
          video.onloadedmetadata = () => { clearTimeout(to); res(); };
        });
      }
      const w = video.videoWidth || 640, h = video.videoHeight || 360;
      const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      const duration = isFinite(video.duration) && video.duration > 0 ? video.duration : null;
      if (duration){
        // Phase A: dense at the start (capture initial state reliably)
        const warmSec = Math.min(0.6, duration);
        const fpsA = 90; const dtA = 1/fpsA; const stepsA = Math.max(1, Math.ceil(warmSec * fpsA));
        let t0 = performance.now();
        for(let i=0;i<stepsA;i++){
          const ts = i*dtA; try{ await new Promise((res)=>{ const onSeek=()=>{ video.removeEventListener('seeked', onSeek); res(); }; video.addEventListener('seeked', onSeek, { once:true }); video.currentTime = Math.min(duration, ts); }); }catch{}
          try{ ctx.drawImage(video, 0, 0, w, h); const t = t0 + i * (1000/fpsA);
            detector.detect(canvas, t, f=>{ capTelemetryFrame(); const entry = ensureTempCore(f.hand, f.handId || null); const res = entry.core.update(f); const { state, norm, gate } = res; locGolden.push(JSON.stringify({ t:f.t, norm:+norm.toFixed(4), state, gate })); locLand.push(JSON.stringify({ t:f.t, hand:f.hand, indexTip:f.indexTip, thumbTip:f.thumbTip, wrist:f.wrist, indexMCP:f.indexMCP, pinkyMCP:f.pinkyMCP })); });
          }catch{}
          await new Promise(r=> setTimeout(r, 0));
        }
        // Phase B: remainder at 30 FPS
        const startB = warmSec; const fpsB = 30; const dtB = 1/fpsB; const stepsB = Math.max(0, Math.ceil((duration - startB) * fpsB));
        for(let j=0;j<stepsB;j++){
          const ts = startB + j*dtB; try{ await new Promise((res)=>{ const onSeek=()=>{ video.removeEventListener('seeked', onSeek); res(); }; video.addEventListener('seeked', onSeek, { once:true }); video.currentTime = Math.min(duration, ts); }); }catch{}
          try{ ctx.drawImage(video, 0, 0, w, h); const t = t0 + (stepsA + j) * (1000/fpsB);
            detector.detect(canvas, t, f=>{ capTelemetryFrame(); const entry = ensureTempCore(f.hand, f.handId || null); const res = entry.core.update(f); const { state, norm, gate } = res; locGolden.push(JSON.stringify({ t:f.t, norm:+norm.toFixed(4), state, gate })); locLand.push(JSON.stringify({ t:f.t, hand:f.hand, indexTip:f.indexTip, thumbTip:f.thumbTip, wrist:f.wrist, indexMCP:f.indexMCP, pinkyMCP:f.pinkyMCP })); });
          }catch{}
          await new Promise(r=> setTimeout(r, 0));
        }
      } else {
        // Fallback to sampling while playing
        const sample = ()=> new Promise(r=> requestAnimationFrame(r));
        while(!video.ended){ await sample(); try{ ctx.drawImage(video, 0, 0, w, h); const t = performance.now(); detector.detect(canvas, t, f=>{ capTelemetryFrame(); const entry = ensureTempCore(f.hand, f.handId || null); const res = entry.core.update(f); const { state, norm, gate } = res; locGolden.push(JSON.stringify({ t:f.t, norm:+norm.toFixed(4), state, gate })); locLand.push(JSON.stringify({ t:f.t, hand:f.hand, indexTip:f.indexTip, thumbTip:f.thumbTip, wrist:f.wrist, indexMCP:f.indexMCP, pinkyMCP:f.pinkyMCP })); }); }catch{} }
      }
      try{ detector.close && detector.close(); }catch{}
    }catch{}
  }

  return new Promise(async (resolve, reject)=>{
    try{
      video.srcObject=null; video.muted = true; video.playsInline = true; video.loop = false; video.src = fileUrl;
      // Ensure metadata is ready before playing to avoid silent failures
      if (video.readyState < 1) {
        await new Promise((res) => {
          const to = setTimeout(res, 2000);
          video.onloadedmetadata = () => { clearTimeout(to); res(); };
        });
      }
      video.currentTime = 0;
      await video.play();
    }catch(e){ reject(e); return; }

    // local emitter wiring for down/up
  const localHandler = (hand, handId)=> (e)=>{ if(e.type==='pinch:down'){ capDown(hand, handId, e.t, !!e.speculative); const key = (handId? ('id:'+handId): ('hand:'+hand)); ensureSeatFor(key); } else if(e.type==='pinch:up'){ capUp(hand, handId, e.t); } };

    // temp cores map so we don't disturb existing
    const tempCores = new Map();
  function ensureTempCore(hand, handId){ if(tempCores.has(hand)) return tempCores.get(hand); const core = createPinchCore({ enterThresh:+byId('enter').value||0.40, exitThresh:+byId('exit').value||0.70, palmConeDeg:+byId('cone').value||30, palmGate: byId('palmGate')?.checked!==false, enableSpeculative: byId('speculative')?.checked!==false, oneEuro: { minCutoff:+byId('minCutoff').value||2.2, beta:+byId('beta').value||0.04, dCutoff:+byId('dCutoff').value||1.2 } }); const handler = localHandler(hand, handId || null); const unsub = core.on(handler); const entry = { core, unsub }; tempCores.set(hand, entry); return entry; }

    const mpLocal = createMediaPipeSource(video, f=>{
      capTelemetryFrame();
      const entry = ensureTempCore(f.hand, f.handId || null);
      const res = entry.core.update(f);
      const { state, norm, rawNorm, gate, ang, vRel, aRel, toiPredAbsV, toiPredAbsA, toiActualStopAbs, toi, toiA, debug } = res;
      // Include hand to allow per-hand transition derivation
      locGolden.push(JSON.stringify({ t:f.t, hand:f.hand, handId:f.handId||null, controllerId:f.controllerId||null, norm: (norm!=null && isFinite(norm))? +norm.toFixed(4): null, state, gate }));
      locLand.push(JSON.stringify({ t:f.t, hand:f.hand, indexTip:f.indexTip, thumbTip:f.thumbTip, wrist:f.wrist, indexMCP:f.indexMCP, pinkyMCP:f.pinkyMCP }));
      if(richEnabled){
        const handKey = f.handId!=null? ('id:'+f.handId) : ('hand:'+ (f.hand||'Unknown'));
        const seat = seatMap[handKey] || null;
        // Map debug smoothing fields and predictive timing (absolute) plus instantaneous kinematics
        richFrames.push({
          t: f.t,
          hand: f.hand,
          handId: f.handId||null,
          controllerId: f.controllerId||null,
          seat,
          state,
          norm: (norm!=null && isFinite(norm))? +norm.toFixed(6): null,
          rawNorm: (rawNorm!=null && isFinite(rawNorm))? +rawNorm.toFixed(6): null,
          gate: !!gate,
          palmAngleDeg: (ang!=null && isFinite(ang))? +ang.toFixed(2): null,
          velocity: (vRel!=null && isFinite(vRel))? +vRel.toFixed(6): null,
          acceleration: (aRel!=null && isFinite(aRel))? +aRel.toFixed(6): null,
          toiPredAbsV: (toiPredAbsV!=null && isFinite(toiPredAbsV))? Math.round(toiPredAbsV): null,
          toiPredAbsA: (toiPredAbsA!=null && isFinite(toiPredAbsA))? Math.round(toiPredAbsA): null,
          toiActualStopAbs: (toiActualStopAbs!=null && isFinite(toiActualStopAbs))? Math.round(toiActualStopAbs): null,
          toiZeroMsVel: (toi!=null && isFinite(toi))? Math.round(toi): null,
          toiZeroMsAccel: (toiA!=null && isFinite(toiA))? Math.round(toiA): null,
          smoothed: debug ? { indexTip:[debug.ixSm, debug.iySm, debug.izSm], thumbTip:[debug.txSm, debug.tySm, debug.tzSm] } : null,
          raw: debug ? { indexTip:[debug.ixRaw, debug.iyRaw, debug.izRaw], thumbTip:[debug.txRaw, debug.tyRaw, debug.tzRaw] } : null
          // Future: jointAngles:{ index:{mcpDeg, pipDeg, dipDeg}, thumb:{cmcDeg, mcpDeg, ipDeg} } from fingerGeometryCore integration
        });
      }
    });

  try{ await mpLocal.start(); }catch(e){ /* continue */ }
  let finished = false;
  function deriveTransitions(){
      try{
        if(!locGolden.length) return;
        const prevByHand = new Map();
        const counts = new Map(); // hand -> {downs, ups}
        for(const line of locGolden){
          try{
            const o = JSON.parse(line);
            const s = o && o.state;
            const h = (o && o.handId) || (o && o.hand) || 'Unknown';
            const prev = prevByHand.get(h);
            if(prev!=null){
              if(prev==='Idle' && s==='Pinched'){
                const c = counts.get(h) || { downs:0, ups:0 }; c.downs++; counts.set(h, c);
              }
              if(prev==='Pinched' && s==='Idle'){
                const c = counts.get(h) || { downs:0, ups:0 }; c.ups++; counts.set(h, c);
              }
            }
            prevByHand.set(h, s);
          }catch{}
        }
        // Aggregate only if we didn't already capture real events
        if(rec.downs===0 || rec.ups===0){
          let aggDown=0, aggUp=0; for(const [hand,c] of counts.entries()){ aggDown+=c.downs; aggUp+=c.ups; rec.perHand.downs[hand]=(rec.perHand.downs[hand]||0)+c.downs; rec.perHand.ups[hand]=(rec.perHand.ups[hand]||0)+c.ups; }
          if(rec.downs===0 && aggDown>0) rec.downs = aggDown;
          if(rec.ups===0 && aggUp>0) rec.ups = aggUp;
        }
      }catch{}
    }
  function finalize(){ if(finished) return; finished = true; try{ mpLocal.stop(); }catch{} deriveTransitions(); applyFirstPinchPolicy(); for(const [_,obj] of tempCores){ try{ obj.unsub && obj.unsub(); }catch{} } resolve({ golden: locGolden, landmarks: locLand, telemetry: snapshot(), rich: richEnabled? { frames: richFrames, summary: { frames: richFrames.length, seats: seatMap } } : null }); }
  const onEnd = async ()=>{
      try{ mpLocal.stop(); }catch{}
      if (rec.frames === 0) {
        await runImageDetectorFallback();
      }
  deriveTransitions();
  applyFirstPinchPolicy();
      for(const [_,obj] of tempCores){ try{ obj.unsub && obj.unsub(); }catch{} }
  resolve({ golden: locGolden, landmarks: locLand, telemetry: snapshot(), rich: richEnabled? { frames: richFrames, summary: { frames: richFrames.length, seats: seatMap } } : null });
    };
  video.onended = onEnd;
  // Watchdog: resolve after timeout if 'ended' never fires (e.g., codec/loop issues)
  const timeoutMs = (typeof window.__hexProcessTimeoutMs === 'number' && window.__hexProcessTimeoutMs > 0) ? window.__hexProcessTimeoutMs : 180000;
  setTimeout(async ()=>{ if (rec.frames === 0) { try{ mpLocal.stop(); }catch{} await runImageDetectorFallback(); } finalize(); }, timeoutMs);

  // Early fallback: if no detections in first 3s of playback, try image-detector path
  setTimeout(async ()=>{ try{ if(!finished && rec.frames===0){ try{ mpLocal.stop(); }catch{} await runImageDetectorFallback(); if (!finished) finalize(); } }catch{} }, 3000);
  });
}

// Automated capture helper: process a sequence of frame URLs (images) in order
async function processFrameUrls(urls){
  const locGolden = []; const locLand = [];
  const rec = { downs:0, ups:0, spec:0, specCancel:0, downLat:[], frames:0 }; let lastDownT=null;
  function capFrame(){ rec.frames++; }
  function capDown(t, s){ if(s) rec.spec++; rec.downs++; lastDownT=t; }
  function capUp(t){ rec.ups++; if(lastDownT!=null){ const d=t-lastDownT; if(d>=0&&d<2000) rec.downLat.push(d); } }
  function snapshot(){ return { downs: rec.downs, ups: rec.ups, specCancelRate: rec.spec? (rec.specCancel/Math.max(1,rec.spec)) : 0, meanDownLatency: rec.downLat.length? Math.round(rec.downLat.reduce((a,b)=>a+b,0)/rec.downLat.length) : 0, frames: rec.frames }; }

  // temp cores map
  const tempCores = new Map();
  function ensureTempCore(hand){ if(tempCores.has(hand)) return tempCores.get(hand); const core = createPinchCore({ enterThresh:+byId('enter').value||0.40, exitThresh:+byId('exit').value||0.70, palmConeDeg:+byId('cone').value||30, palmGate: byId('palmGate')?.checked!==false, enableSpeculative: byId('speculative')?.checked!==false, oneEuro: { minCutoff:+byId('minCutoff').value||2.2, beta:+byId('beta').value||0.04, dCutoff:+byId('dCutoff').value||1.2 } }); const unsub = core.on(e=>{ if(e.type==='pinch:down') capDown(e.t, !!e.speculative); else if(e.type==='pinch:up') capUp(e.t); }); const entry = { core, unsub }; tempCores.set(hand, entry); return entry; }

  const detector = await createMediaPipeImageDetector();
  const img = new Image(); img.crossOrigin = 'anonymous';
  let t0 = performance.now();
  for(let i=0;i<urls.length;i++){
    const u = urls[i];
    await new Promise((resolve, reject)=>{ img.onload=resolve; img.onerror=reject; img.src=u; });
    const t = t0 + i * (1000/30); // assume 30 FPS if unknown
    detector.detect(img, t, f=>{
      capFrame();
      const entry = ensureTempCore(f.hand, f.handId || null);
      const res = entry.core.update(f);
      const { state, norm, gate } = res;
      locGolden.push(JSON.stringify({ t:f.t, norm:+norm.toFixed(4), state, gate }));
      locLand.push(JSON.stringify({ t:f.t, hand:f.hand, indexTip:f.indexTip, thumbTip:f.thumbTip, wrist:f.wrist, indexMCP:f.indexMCP, pinkyMCP:f.pinkyMCP }));
    });
    await new Promise(r=>setTimeout(r,0));
  }
  try{ detector.close(); }catch{}
  for(const [_,obj] of tempCores){ try{ obj.unsub && obj.unsub(); }catch{} }
  return { golden: locGolden, landmarks: locLand, telemetry: snapshot() };
}

// Signal readiness for automation scripts
try { window.__hexReady = true; } catch {}

