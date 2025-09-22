/*
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
 - [ ] Re-evaluate this artifact against current Hexagonal goals
 - [ ] Run this test with the latest September2025 build
 - [ ] Log decisions in TODO_2025-09-16.md
*/

// Minimal deterministic pinch core for unit tests: emits pinch:down when norm <= enter, pinch:up when norm >= exit.
export function createMinimalPinchCore(cfg={}){
  const C = Object.assign({ enterThresh:0.5, exitThresh:0.7 }, cfg);
  let state='Idle';
  const subs=new Set();
  function emit(e){ subs.forEach(h=>{ try{ h(e); }catch{} }); }
  function update(frame){
    const { t, indexTip, thumbTip, indexMCP, pinkyMCP } = frame || {};
    if(!indexTip||!thumbTip||!indexMCP||!pinkyMCP) return;
    const span = Math.hypot(indexMCP[0]-pinkyMCP[0], indexMCP[1]-pinkyMCP[1]);
    if(!span) return;
    const dist = Math.hypot(indexTip[0]-thumbTip[0], indexTip[1]-thumbTip[1]);
    const norm = dist / span;
    if(state==='Idle' && norm < C.enterThresh){ state='Down'; emit({ type:'pinch:down', t, speculative:false }); }
    else if(state==='Down' && norm > C.exitThresh){ state='Idle'; emit({ type:'pinch:up', t }); }
  }
  return { update, on(h){ subs.add(h); return ()=>subs.delete(h); } };
}
