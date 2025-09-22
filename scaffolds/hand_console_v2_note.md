---
id: hand-console-v2
status: active
created: 2025-09-16
flag: FEATURE_HAND_CONSOLE_V2
revert: remove v2 file & flag
legacy_file: September2025/TectangleHexagonal/dev/integrated_hand_console.html
v2_file: September2025/TectangleHexagonal/dev/integrated_hand_console_v2.html
---
# Hand Console V2 Scaffold

Purpose: Provide a clean, decoupled prototype for dual-seat (P1/P2) visualization and diagnostics without side-effects on telemetry capture.

## Differences vs Legacy

- Parallel seat panels (legacy conflated provisional P1 data).
- Overlay isolated (try/catch) so render errors cannot wipe telemetry state.
- Explicit feature flag `FEATURE_HAND_CONSOLE_V2` for runtime detection.
- Simpler state store: per-hand record with lastPinch/orient/vel/flex; seat mapping applied separately.

## Usage

Load `integrated_hand_console_v2.html` directly via static server (e.g. <http://localhost:8080/September2025/TectangleHexagonal/dev/integrated_hand_console_v2.html?clip=September2025/TectangleHexagonal/videos/two_hands_stationary_right_then_left_index_pinch_hold_1s_v1.mp4&autostart=1>).

## Revert Path

Delete `integrated_hand_console_v2.html` (or rename) and remove/ignore the `FEATURE_HAND_CONSOLE_V2` flag; continue using legacy file.

## Next Improvement Ideas

- Add controllerId / seat color-coding in overlay.
- Add latency & frame timing panel.
- Provide download button for current pinchLog as JSONL.
- Integrate test harness hook to auto-select v2 when flag present.
