---
id: ww-2025-028
owner: @dev
status: active
expires_on: 2025-10-08
guard: npm run hex:guard:rich
flag: FEATURE_PREDICTIVE_TRIAD_V1
revert: remove folder/flag
---

# Webway: Predictive Lookahead Triad
Goal: Combine physics, biomechanical, and musical-quant predictors for robust low-latency pinch.
Proven path: Extend existing per-frame rich fields (norm/vel/accel, palmAngleDeg, index angles) and exporter; reuse replay validators.
Files touched: README (predictive triad section), future: cores/ports under flags
Markers: WEBWAY:ww-2025-028
Next steps: Add angle velocity/jerk, tempo grid hooks, predictor fusion with confidence, and postmortem reports.
