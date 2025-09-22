// WEBWAY:ww-2025-103: ReplayLandmarks Hex — deterministic page/core replays
import { registerHexApp } from './hexRegistry.js';

function parseJsonl(text){
  const lines = (text||'').split(/\r?\n/).filter(l => l.trim().length>0);
  const out = []; for(const l of lines){ try{ out.push(JSON.parse(l)); }catch{} }
  return out;
}

function normalizeFrames(rows){
  // Accept either array of frames or JSONL rows with {landmarks:[...], t}
  const frames = [];
  for(const r of rows){
    if(!r) continue;
    if(Array.isArray(r.hands)){
      frames.push({ t: r.t ?? null, hands: r.hands });
    } else if (Array.isArray(r.landmarks)){
      frames.push({ t: r.t ?? null, hands: r.landmarks });
    }
  }
  return frames;
}

export function createReplayHex(){
  let current = { stop:false };
  async function loadFromUrl(url){
    const res = await fetch(url, { cache:'no-store' });
    const txt = await res.text();
    return parseJsonl(txt);
  }
  async function replay(framesOrRows, opts={}){
    const { stepMs=33, onFrame, onDone } = opts;
    current.stop = false;
    const rows = framesOrRows;
    const frames = Array.isArray(rows) && rows.length && typeof rows[0] === 'string'
      ? normalizeFrames(parseJsonl(rows.join('\n')))
      : normalizeFrames(rows);
    const t0 = performance.now();
    for(let i=0;i<frames.length;i++){
      if(current.stop) break;
      const f = frames[i];
      try{ if(typeof onFrame === 'function') await onFrame(f, i); } catch {}
      await new Promise(r => setTimeout(r, stepMs));
    }
    try{ if(typeof onDone === 'function') onDone({ dur: performance.now()-t0, frames: frames.length }); }catch{}
  }
  function stop(){ current.stop = true; }
  return { loadFromUrl, replay, stop };
}

export function registerReplayHex(){
  const appId = 'hex.replay.landmarks';
  const api = createReplayHex();
  registerHexApp(appId, api);
  // Expose quick access under __hex if present
  try{ if(window && window.__hex){ window.__hex.replay = api; } }catch{}
  return { appId, dispose: ()=>{} };
}

export default { createReplayHex, registerReplayHex };