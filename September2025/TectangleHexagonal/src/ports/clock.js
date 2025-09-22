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

// Clock port: minimal scheduler with high-resolution time (no deps). Swap in WAAClock later if desired.
export function createClock(opts = {}) {
  const cfg = { now: () => performance.now(), useAudio: true, ...opts };
  let audioCtx = null;
  const ensureAudio = () => {
    if (!cfg.useAudio) return null;
    if (!audioCtx && typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  };

  const nowMs = () => cfg.now();
  const acNowMs = () => {
    const ac = ensureAudio();
    return ac ? ac.currentTime * 1000 : nowMs();
  };

  let idSeq = 1;
  const pending = new Map();
  const scheduleAt = (fn, atMs) => {
    const delay = Math.max(0, atMs - nowMs());
    const id = idSeq++;
    const handle = setTimeout(() => {
      pending.delete(id);
      try { fn({ tNow: nowMs(), acNow: acNowMs() }); } catch {}
    }, delay);
    pending.set(id, handle);
    return id;
  };
  const cancel = (id) => {
    const h = pending.get(id);
    if (h) { clearTimeout(h); pending.delete(id); }
  };

  // Small helper: schedule on a grid from origin time
  const scheduleNextOnGrid = ({ originMs = 0, gridMs = 125, fn }) => {
    const t = nowMs();
    const k = Math.floor((t - originMs) / gridMs) + 1;
    const next = originMs + k * gridMs;
    return scheduleAt(fn, next);
  };

  return { nowMs, acNowMs, scheduleAt, cancel, scheduleNextOnGrid };
}

export default { createClock };
