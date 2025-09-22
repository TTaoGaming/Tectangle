---
id: ww-2025-007
owner: @tommy
status: active
expires_on: 2025-10-09
guard: npm run -s hex:verify:fast
flag: FEATURE_SDK_V3_KALMAN_TOI
revert: remove folder/flag
---

# Webway: v3 Kalman demo page

Goal: Visualize 1D Kalman lookahead (ghost) on a simple strip per hand; toggle via feature flag; keep demo isolated and reversible.
Proven path: v2 demo pattern with feature-flagged insights, extended for Kalman.
Files touched: September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v3_kalman.html
Markers: WEBWAY:ww-2025-007:
Next steps: Add TOI e2e smoke on goldens with thresholds (median/p95/jitter), surface TOI_pred/TOI_actual in facade.
