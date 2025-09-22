---
id: ww-2025-017
owner: @system
status: active
expires_on: 2025-10-08
guard: test:rich_snapshot_fields + seat_stability
flag: FEATURE_HAND_CONSOLE_V9
revert: remove folder/flag
---
# Webway: Telemetry Gap (V8 vs V7/V9)
Goal: Diagnose & restore continuous pinch/orientation/joint telemetry in V8; establish V9 as stable baseline.
Proven path: V7 implementation (loop with vmCore.tick + overlay ops + direct pinch/orient events) cloned into V9 (ww-2025-016).
Files touched: integrated_hand_console_v8.html, integrated_hand_console_v9.html, createHandConsoleViewModel.js, pinchCore.js, appShell.js
Markers: WEBWAY:ww-2025-017

Root Cause Summary:
1. Missing vmCore.tick() in V8 frame loop → no per-frame advancement; only discrete pinch events logged.
2. ViewModel lacks derived gap/velocity fallback when pinch event absent for several frames; relies solely on last pinch:* event payload.
3. Rich snapshot path (appShell lastRichByHand) produces norm/raw/v/a but V8 UI favored vmCore (which had stale pinch objects) and did not merge values.
4. No overlayOps sampling in V8 → less frequent shell/hsm side-effects surfaced visually, hiding absence of updates.

Planned Fix (parity steps):
- (Done) Add vmCore.tick() in V8 loop.
- Add overlay ops + renderer (copy from V7) to stimulate same per-frame flow & visual confirmation.
- Enhance createHandConsoleViewModel to synthesize a lightweight pinch continuity record each tick if last pinch event > N ms old (carry forward normalizedGap & velocity damped to 0).
- Merge rich snapshot fields into UI when vmCore.pinch.normalizedGap is null.
- Add diagnostic counters: framesSinceLastPinchEvent, lastPinchUpdateMs.

Verification:
- Load V8 + pinch sequence clip: gap & velocity populate within 2 frames; chart/hysteresis shows history > 50 samples; diag shows hands=2.
- Tests rich_snapshot_fields + seat_stability still pass after modifications.

Next steps:
- Add orientation vector visualization (arrow) to V8 & V9.
- Add mirror + debug toggles to V8 (already in V7/V9).
- Quarantine legacy failing tests.

Cleanup (on graduation): remove fallback synthesis if pinchCore starts emitting periodic heartbeat events.

---