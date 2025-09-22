---
id: ww-2025-012
owner: @ttao
status: active
expires_on: 2025-10-08
guard: unit:test (joint angles + seat assign) & page:size <= +3KB
flag: FEATURE_HAND_CONSOLE_V8
revert: remove folder/flag
---
# Webway: Hand Console V8 Scaffold
Goal: Expand V7 console into per-seat (P1/P2) deep panels exposing full pinch, orientation, flexion, TOI & hysteresis metrics plus runtime config & presets; prepare for P3/P4.
Proven path: Builds on unified ViewModel (WEBWAY:ww-2025-008) + overlay normalization & camera constraints (WEBWAY:ww-2025-011).
Files touched: dev/integrated_hand_console_v8.html (new), src/app/appShell.js (future: updateMediaPipeConfig stub), src/core/fingerGeometryCore.js (thumb angles add), tests/unit/fingerThumbAngles.test.mjs, tests/unit/seatAssignOnPinch.test.mjs.
Markers: WEBWAY:ww-2025-012
Next steps:
- Implement joint angle feature flag (FEATURE_FINGER_GEOM_THUMB) & events.
- Add page scaffold w/ feature flags & minimal per-seat cards.
- Extend appShell with updateMediaPipeConfig stub (no-op w/ marker + TODO).
- Add tests (angles calc, seat assignment on first pinch).
- Iterate metrics (TOI predictions, hysteresis tube) behind V8 flag.
