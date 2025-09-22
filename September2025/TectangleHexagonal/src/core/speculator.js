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

// Predictive Speculator: early trigger via lookahead ("ghost"), with lock/cancel/switch semantics.
// Pure core: consumes per-frame metrics and emits events; no DOM/IO.
// Contract
// - input: { t, norm, ghost, plausible, tag? }
// - config:
//     enter: hysteresis enter threshold in norm units (0..1 typical)
//     ghostLead: how far inside enter must ghost be to speculate (e.g., 0.02)
//     sustainMs: plausibility sustain before spec (e.g., 40)
//     lockWindowMs: max time allowed to reach true enter after spec (e.g., 120)
//     cancelOn: { reverseGhost: true, plausDropMs: 60 }
// - events: { type: 'speculate'|'lock'|'cancel'|'switch', t, tag, detail }

export function createSpeculator(cfg = {}) {
  const C = Object.assign({
    enter: 0.45,
    ghostLead: 0.02,
    sustainMs: 40,
    lockWindowMs: 120,
    cancelOn: { reverseGhost: true, plausDropMs: 60 },
  }, cfg);

  let state = 'idle'; // idle | spec | locked
  let tSpec = null;
  let tagSpec = null;
  let last = { t: null, norm: null, ghost: null, plausible: false };
  let plausSustain = 0; // ms
  let plausDrop = 0; // ms since last plausible

  function update(frame) {
    const evts = [];
    const { t, norm, ghost, plausible, tag } = frame;
    const dt = last.t == null ? 0 : Math.max(0, t - last.t);
    // track plausibility windows
    if (plausible) { plausSustain += dt; plausDrop = 0; } else { plausDrop += dt; plausSustain = 0; }

    // helper predicates
    const ghostInside = (ghost != null) && (ghost <= (C.enter - C.ghostLead));
    const realEntered = norm != null && norm <= C.enter;
    const reversedGhost = (last.ghost != null && ghost != null) ? (ghost > last.ghost) : false;

    if (state === 'idle') {
      if (ghostInside && plausSustain >= C.sustainMs) {
        state = 'spec';
        tSpec = t;
        tagSpec = tag ?? 'default';
        evts.push({ type: 'speculate', t, tag: tagSpec, detail: { etaLockBy: t + C.lockWindowMs } });
      }
    } else if (state === 'spec') {
      // lock when actual crosses enter within window
      if (realEntered && (t - tSpec) <= C.lockWindowMs) {
        state = 'locked';
        evts.push({ type: 'lock', t, tag: tagSpec, detail: { dt: t - tSpec } });
      } else {
        // cancel conditions
        const timeout = (t - tSpec) > C.lockWindowMs;
        const plausDropTooLong = C.cancelOn?.plausDropMs ? (plausDrop >= C.cancelOn.plausDropMs) : false;
        const reverse = C.cancelOn?.reverseGhost ? reversedGhost : false;
        const shouldCancel = timeout || plausDropTooLong || reverse;
        if (shouldCancel) {
          evts.push({ type: 'cancel', t, tag: tagSpec, detail: { reason: timeout ? 'timeout' : (plausDropTooLong ? 'plaus-drop' : 'reverse') } });
          state = 'idle'; tSpec = null; tagSpec = null; plausSustain = 0; plausDrop = 0;
        }
        // switch to a new tag if provided and different while still inside ghost lead
        if (ghostInside && tag && tagSpec && tag !== tagSpec) {
          const old = tagSpec; tagSpec = tag;
          evts.push({ type: 'switch', t, tag: tagSpec, detail: { from: old } });
        }
      }
    } else if (state === 'locked') {
      // Once locked, caller should reset on gesture up; we don’t auto-cancel here.
      // Provide gentle safety: if norm exits far outside enter by margin, reset.
      if (norm != null && norm > (C.enter + 0.2)) {
        state = 'idle'; tSpec = null; tagSpec = null; plausSustain = 0; plausDrop = 0;
      }
    }

    last = { t, norm, ghost, plausible };
    return evts;
  }

  function reset() { state = 'idle'; tSpec = null; tagSpec = null; plausSustain = 0; plausDrop = 0; last = { t: null, norm: null, ghost: null, plausible: false }; }

  function getState() { return { state, tSpec, tagSpec }; }

  function setConfig(part) { Object.assign(C, part || {}); return C; }

  return { update, reset, getState, setConfig };
}

export default { createSpeculator };
