---
id: ww-2025-018
owner: @agent
status: active
expires_on: 2025-10-08
guard: jest:seat_lock_rich_telem
flag: FEATURE_RICH_SEAT_LOCK_V9
revert: remove folder/flag
---
# Webway: Seat-Lock Rich Telemetry (V9)
Goal: Show full enriched metrics only after seat stability (reduces noise & boot clutter).
Proven path: Adapter-first gating (prior feature-flagged console increments V4→V7→V9).
Files touched: src/ui/seatLockRichAdapter.js, September2025/TectangleHexagonal/dev/integrated_hand_console_v9.html, tests/seatlock/seat_lock_rich_telem.test.cjs
Markers: WEBWAY:ww-2025-018:
Next steps: refine enrichment fields; add negative test; later wrap with OTEL spans & OpenFeature flags.
