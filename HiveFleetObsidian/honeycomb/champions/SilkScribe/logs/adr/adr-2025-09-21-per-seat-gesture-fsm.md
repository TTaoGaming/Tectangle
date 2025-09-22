# ADR | 2025-09-21T00:00:00Z | ww-2025-098

Context: P1 HUD occasionally shows P2 gestures due to recognizer/detector reorderings; v2 added nearest-wrist alignment and caching, but gating per seat further reduces risk and enables telemetry.

Decision: Add a guarded per-seat XState FSM (FEATURE_SEAT_FSM_PER_TRACK). Create `src/hex/gestureFsmSeat.js` with a minimal idle↔active stub and wire a dynamic import in v2. Default flag OFF; no behavior change unless enabled. Place WEBWAY markers and logs.

Consequences: Safer path to extend with timers/guards and per-seat JSONL emission. Zero overhead by default. Allows seat isolation smokes. If issues arise, revert by removing flagged block and file.

Links: [Webway note](../../../../scaffolds/webway_ww-2025-098_gesture_fsm_per_seat.md)
