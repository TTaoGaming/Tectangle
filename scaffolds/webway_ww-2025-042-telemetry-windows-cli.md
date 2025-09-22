---
id: ww-2025-042
owner: @tommy
status: active
expires_on: 2025-10-09
guard: npm run -s hex:telemetry:golden:twohands && npm run -s hex:telemetry:golden:idle
flag: FEATURE_SDK_V3_KALMAN_TOI
revert: remove folder/flag
---
# Webway: Reliable v3 telemetry runs on Windows
Goal: Run golden idle and pinch MP4s through the v3 Kalman demo reliably on Windows and capture seat info.
Proven path: Use cross-env npm scripts and expose hand/handId/seat in telemetry events.
Files touched: package.json; September2025/TectangleHexagonal/tests/smoke/run_v3_kalman_telemetry.mjs
Markers: WEBWAY:ww-2025-042:
Next steps: If seats remain empty, surface seat map from sdk.getState() directly or add __seatSnapshot on page.
