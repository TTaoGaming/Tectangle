---
id: ww-2025-004
owner: @you
status: active
expires_on: 2025-10-09
guard: npm run hex:smoke:demo:v2 # smoke the page; later add v3-specific smoke
flag: FEATURE_SDK_V3_KALMAN
revert: remove folder/flag
---

# Webway: SDK v3 — Kalman lookahead + TOI

Goal: Replace EMA smoothing with a simple 1D Kalman filter over normalized pinch distance to expose predictive lookahead and time-of-impact (TOI) per event.

Proven path: Constant-velocity/acceleration Kalman models for hand/pose tracking; TOI estimation from predicted threshold crossings.

Files touched: (planned) src/sdk/v3/*, appShell passthroughs, demo wiring

Markers: WEBWAY:ww-2025-004:

Next steps: Implement v3 state {x,v,(a?)}, per-frame predict/update, TOI_pred at lead window, TOI_actual post mortem; add smoke that runs MP4 and logs per-event TOI.
