---
id: ww-2025-006
owner: @TTaoGaming
status: active
expires_on: 2025-10-07
guard: hex:verify:fast
flag: FEATURE_MULTISEAT_V2
revert: remove folder/flag
---
# Webway: HandSessionManager + AppShell Extraction

Goal: Establish a minimal orchestration layer (HandSessionManager + AppShell) separating domain pinch cores from frame sources and seat routing, enabling deterministic multiseat verification and future game event bridging.

Proven path: Refactored from monolithic `main.js` into small services following prior pure-core pattern (`pinchCore`, `seatConcurrencyCore`, `controllerRouterCore`).

Files touched:

- `September2025/TectangleHexagonal/src/app/handSessionManager.js` (new) – per-hand core lifecycle, event fan-out.
- `September2025/TectangleHexagonal/src/app/appShell.js` (new) – wiring frame source -> HSM -> controller router.
- `September2025/TectangleHexagonal/src/app/controllerRouterCore.js` (modified) – optional `autoSeatOnPresence` & presence-based pairing (opt-in) + WEBWAY marker.
- `September2025/TectangleHexagonal/tests/unit/handSessionManager.test.mjs` – deterministic test via injected minimal pinch core.
- `September2025/TectangleHexagonal/tests/unit/helpers/minimalPinchCore.js` – test-only core.
- `September2025/TectangleHexagonal/dev/appshell_demo.html` – manual inspection harness.
- `September2025/TectangleHexagonal/tests/smoke/run_video_appshell_check_seats.mjs` – MP4-driven seat validation.

Markers: WEBWAY:ww-2025-006 present in new/modified source files.

SRL (Silk Scribe Rollup) – distilled knowledge:

1. Separation: Hand session lifecycle (identity, stale GC) was entangled in `main.js`; extraction enables independent seat logic & future multi-game adapters.
2. Determinism for Tests: Production `pinchCore` debounce & gating complicated simple down/up verification; injecting a minimal core isolates orchestration correctness from gesture heuristics.
3. Seat Stability: Added opt-in `autoSeatOnPresence` to satisfy idle two-hand baseline videos without regressing proximity reacquire semantics in legacy tests.
4. Concurrency Scaling: Controller router still honors `FEATURE_MULTISEAT_V2` / concurrency core; HSM provides clean stream for potential predictive metrics & latency instrumentation.
5. Revert Simplicity: Delete new files + remove WEBWAY lines + drop presence option; no schema migrations or external state.
6. Next Bridge: Introduce `GameEventBridge` translating seat pinch events into generic arcade actions (PINCH_DOWN -> BUTTON_A). Guard via new feature flag.
7. Telemetry Hook: HSM is the ideal insertion point for per-seat pinch latency (toiPred vs actual), duplicate seat detection, and churn metrics.

Next steps:

- Implement `GameEventBridge` (flag `FEATURE_GAME_BRIDGE`) with unit + smoke tests.
- Add telemetry adapter (flag `FEATURE_SEAT_TELEM_V1`) capturing seat assignment transitions & pinch durations.
- Extract hysteresis visualization into `HysteresisPresenter` fed by pinch events for UI demos.
- Add e2e test ensuring no seat flip-flop over 60s idle multi-hand video.

Progress update (added):

- FEATURE_GAME_BRIDGE implemented with `gameEventBridge.js` (orientation buckets: UP/RIGHT/DOWN/LEFT) + unit test.
- FEATURE_SEAT_TELEM_V1 scaffold integrated in `appShell.js` (captures per-seat pinch durations + orientation distribution).
- AppShell now exposes action stream via `onAction` when bridge enabled.
- FEATURE_WRIST_ORIENT_V1: Added `wristOrientationCore` (planar wrist->middleMCP angle buckets) integrated via HandSessionManager optional orientation config and flag gating in AppShell; GameEventBridge now prefers `middleMCP`.

Orientation extension details moved to dedicated note (WEBWAY:ww-2025-007) covering raw+smoothed angle rationale, EMA strategy, buckets, and upgrade path to quaternion.

Expiration handling: On or before 2025-10-07 either (a) promote to stable (remove expires_on & flag) or (b) revert if downstream bridges unused.

Revert: Remove listed files + delete WEBWAY markers; ensure pre-commit passes (`npm run hex:verify:fast`).
