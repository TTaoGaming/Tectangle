---
id: ww-2025-006
owner: @TTaoGaming
status: active
expires_on: 2025-10-09
guard: e2e TOI smoke (median |latencyErrorMs| ≤ 25; p95 ≤ 50; jitter_p95 ≤ 15; false+missed = 0)
flag: FEATURE_SDK_V3_KALMAN_TOI
revert: remove folder/flag
---
 
# Webway: SDK v3 — 1D CV Kalman TOI

Goal: Predict Time-of-Impact on pinch using 1D CV Kalman over normalized tip distance.
Proven path: Constant-velocity Kalman (state [x,v]) applied to scalar pinch norm.
Files touched: src/ports/toiKalmanPort.js; tests/unit/toiKalmanPort.test.mjs; dev demo toggle
Markers: WEBWAY:ww-2025-006:
Next steps: Integrate behind flag in appShell and facade; emit TOI_pred/TOI_actual; add e2e smoke on golden MP4s.
