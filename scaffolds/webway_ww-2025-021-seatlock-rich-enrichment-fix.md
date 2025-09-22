---
id: ww-2025-021
owner: @system
status: active
expires_on: 2025-10-10
guard: smoke: v10 seat-lock rows present
flag: FEATURE_RICH_SEAT_LOCK_V10
revert: remove seat propagation patch + adapter robustness block
---
# Webway: SeatLock Rich Enrichment Fix
Goal: Ensure V10 seat-lock metrics populate once a seat locks (previously always `(no seats)`).
Proven path: Propagate seat onto vm hand snapshots + normalize rich snapshot array in adapter (similar patterns in prior telemetry adapters).
Files touched: September2025/TectangleHexagonal/src/ui/createHandConsoleViewModel.js, src/ui/seatLockRichAdapter.js
Markers: WEBWAY:ww-2025-021
Next steps: Run smoke `tests/smoke/verify_v10_boot.mjs`; if rows appear, graduate change or tighten stability threshold logic; if not, inspect router seat assignment timing.
