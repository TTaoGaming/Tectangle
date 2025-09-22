---
id: ww-2025-015
owner: @ttao
status: active
expires_on: 2025-10-08
guard: unit:rich_snapshot_fields + unit:seat_stability
flag: FEATURE_DUAL_SEAT_TELEM
revert: remove folder/flag
---

# Webway: Dual Seat Telemetry Panels

Goal: Add independent P1/P2 telemetry panels (norm, rawNorm, gate, thresholds, velocity, acceleration, palmAngle, joint finger & thumb angles, hysteresis history) without cross-seat contamination.
Proven path: Extends Hand Console V8 scaffold (ww-2025-012) and rich snapshot enrichment (ww-2025-014), leveraging existing harness RICH export.
Files touched: dev/integrated_hand_console_v8.html, tests/unit/rich_snapshot_fields.test.mjs, tests/unit/seat_stability.test.mjs.
Markers: WEBWAY:ww-2025-015
Next steps: Optional orientation vector render, add P2 angle sparkline parity, performance trim of history arrays, doc README update.
