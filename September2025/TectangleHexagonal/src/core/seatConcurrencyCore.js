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

// WEBWAY:ww-2025-006: seatConcurrencyCore (initial scaffold)
// Pure logic for tracking current concurrent hands, sliding-window peak, and sustained unlockSeats.
// TDD: tests expect createSeatConcurrencyCore(config) -> { update(frame)->state }

export function createSeatConcurrencyCore(config = {}){
  const cfg = Object.freeze({
    staleTimeoutMs: config.staleTimeoutMs ?? 600,
    peakWindowMs: config.peakWindowMs ?? 2500,
    sustainFramesForPeak: config.sustainFramesForPeak ?? 3,
  });

  // Internal state
  let lastT = 0;
  let unlockSeats = 1;              // monotonic non-decreasing
  let peakEver = 1;
  const frames = [];                // store {t, count}
  const handLastSeen = new Map();   // id -> t last seen
  let sustainTarget = null;         // candidate concurrency value pending sustain
  let sustainRun = 0;               // consecutive frames at candidate level

  function gc(t){
    // Drop old frames outside sliding window
    const cutoff = t - cfg.peakWindowMs;
    while(frames.length && frames[0].t < cutoff){ frames.shift(); }
    // Drop stale hands
      let staleOccurred = false;
      for(const [id, ts] of [...handLastSeen.entries()]){
        if(t - ts > cfg.staleTimeoutMs){ handLastSeen.delete(id); staleOccurred = true; }
      }
      if(staleOccurred && sustainTarget !== null){
        // A stale gap breaks continuity for sustaining a higher concurrency level
        sustainTarget = null; sustainRun = 0;
      }
  }

  function computePeakWindow(){
    let m = 0; for(const f of frames){ if(f.count > m) m = f.count; } return m || 0;
  }

  function update(frame){
    if(!frame) return state();
    const t = frame.t ?? (lastT + 16);
    lastT = t;
    const ids = new Set();
    for(const h of (frame.hands||[])){
      if(!h || h.id==null) continue;
      ids.add(h.id);
      handLastSeen.set(h.id, t);
    }
    const current = ids.size || 0;
    frames.push({ t, count: current });
    gc(t);
    const peakWindow = computePeakWindow();
    if(peakWindow > peakEver) peakEver = peakWindow;

    // Sustain logic: raise unlockSeats only after consecutive frames hitting new peakWindow
    if(peakWindow > unlockSeats){
      // Candidate must match both peakWindow and current to count toward sustain
      if(sustainTarget !== peakWindow){
        sustainTarget = peakWindow; sustainRun = (current === peakWindow ? 1 : 0);
      } else {
        sustainRun += (current === peakWindow ? 1 : 0);
      }
      if(sustainRun >= cfg.sustainFramesForPeak){
        unlockSeats = peakWindow; sustainTarget = null; sustainRun = 0;
      }
    } else {
      // If concurrency or peak drops below candidate level before promotion, abandon
      if(sustainTarget !== null && (peakWindow < sustainTarget || current < sustainTarget)){
        sustainTarget = null; sustainRun = 0;
      }
    }

    return state(current, peakWindow);
  }

  function state(currentOverride, peakWindowOverride){
    const activeIds = new Set();
    const t = lastT;
    for(const [id, ts] of handLastSeen.entries()){ if(t - ts <= cfg.staleTimeoutMs){ activeIds.add(id); } }
    const peakWindow = peakWindowOverride ?? computePeakWindow();
    return {
      t,
      current: currentOverride ?? activeIds.size,
      peakWindow,
      peakEver,
      unlockSeats,
      activeIds,
      sustainTarget,
      sustainRun,
      config: cfg,
    };
  }

  return { update, state: ()=>state() };
}

export default { createSeatConcurrencyCore };
