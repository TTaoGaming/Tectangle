<!--
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
- [ ] Re-evaluate this artifact against current Hexagonal goals
- [ ] Verify dependent modules and update factorization notes
- [ ] Ensure onboarding guidance is still accurate
- [ ] Log decisions in TODO_2025-09-16.md
-->

# Hand Event Router (tiny adapter)

- Purpose: Map pinch events to per-seat channels (P1/P2) without changing the core API.
- Location: src/adapters/hand_event_router.mjs
- Contract:
  - createHandRouter({ seats?: string[], defaultSeat?: string }) → { on, off, routePinchEvent, setSeat, getSeat, reset }
  - routePinchEvent(e) accepts core pinch events and re-emits them on seat-scoped EventTargets.
  - Seat selection:
    - If e.handId exists and was previously mapped → reuse that seat.
    - Else if e.handId exists → map using a heuristic (Right→P1, Left→P2).
    - Else heuristic by e.hand label.

Quick use

  import { createHandRouter } from '../src/adapters/hand_event_router.mjs';
  const router = createHandRouter({ seats: ['P1','P2'] });
  core.on(e => router.routePinchEvent(e));
  router.on('P1','pinch:down', ({detail}) => console.log('P1 down', detail));

Reversible slice: Remove the import and route call to revert. No other files rely on it.
