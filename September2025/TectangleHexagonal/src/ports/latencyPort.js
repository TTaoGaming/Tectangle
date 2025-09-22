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

// LatencyPort: measures end-to-end display lag and exposes a user offset knob.
// Domain-free: uses caller-provided timestamps (frame.t and now()).
export function createLatencyPort(opts={}){
  const N = opts.windowSize ?? 60;
  const samples = [];
  let userOffsetMs = opts.userOffsetMs ?? 0; // positive = lead UI ahead of now
  function addSample(frameT, now){
    const lag = now - frameT; // ms from frame timestamp to display now
    if(Number.isFinite(lag)){
      samples.push(lag); if(samples.length>N) samples.shift();
    }
    return lag;
  }
  function getLagMs(){ if(!samples.length) return 0; const a=[...samples].sort((a,b)=>a-b); return a[Math.floor(a.length/2)]; }
  function setUserOffsetMs(v){ userOffsetMs = Number(v)||0; }
  function getUserOffsetMs(){ return userOffsetMs; }
  function getEffectiveScheduleNow(now){ return now + userOffsetMs; }
  return { addSample, getLagMs, setUserOffsetMs, getUserOffsetMs, getEffectiveScheduleNow };
}
