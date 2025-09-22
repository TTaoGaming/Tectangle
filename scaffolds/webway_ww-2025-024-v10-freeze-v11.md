---
id: ww-2025-024
owner: @spatial
status: active
expires_on: 2025-10-08
guard: smoke: v11 boots + seatLock adapter present
flag: FEATURE_HAND_CONSOLE_V11
revert: remove folder/flag
---
 
# Webway: Freeze V10, spawn V11

Goal: Freeze research console V10 with a partial-UI note; continue iteration on V11 without touching V10.
Proven path: Prior V8→V9→V10 evolution with seat-lock rich telemetry and per-frame updates.
Files touched: September2025/TectangleHexagonal/dev/integrated_hand_console_v10.html, September2025/TectangleHexagonal/dev/integrated_hand_console_v11.html
Markers: WEBWAY:ww-2025-024
Next steps: Stabilize side panel completeness in V11; keep gating and P1/P2 separation; port/exporter validations.
