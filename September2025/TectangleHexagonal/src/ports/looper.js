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

// Simple gesture looper: record/overdub/playback frames/events; JSON export for post.

export function createLooper(){
  let recording=false, loop=[]; let startT=0; let playing=false; let playIdx=0; let lengthMs=0;
  function startRec(){ loop=[]; startT=performance.now(); recording=true; }
  function stopRec(){ recording=false; lengthMs = (loop.length? loop[loop.length-1].dt : 0); }
  function push(ev){ if(!recording) return; const dt=performance.now()-startT; loop.push({ dt, ev }); }
  function exportJson(){ return JSON.stringify({ lengthMs, events: loop }, null, 2); }
  function load(json){ try{ const o=JSON.parse(json); loop = o.events||[]; lengthMs=o.lengthMs||0; }catch{} }
  function play(onEvent){ if(!loop.length) return; playing=true; playIdx=0; const t0=performance.now(); function tick(){ if(!playing) return; const now=performance.now()-t0; while(playIdx<loop.length && loop[playIdx].dt<=now){ onEvent?.(loop[playIdx].ev); playIdx++; } if(playIdx<loop.length) requestAnimationFrame(tick); else playing=false; } tick(); }
  function stop(){ playing=false; }
  return { startRec, stopRec, push, exportJson, load, play, stop };
}
