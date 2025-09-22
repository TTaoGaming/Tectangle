<!-- WEBWAY:ww-2025-008: Adaptive TOI Kalman (session-calibrated) -->

# Webway: Adaptive TOI Kalman (session-calibrated)

---
id: ww-2025-008
owner: @TTaoGaming
status: active        # active|ready|done|expired
expires_on: 2025-10-09   # auto-expire TTL
guard: hex:verify:fast + golden: pinch+idle smokes; toi_pred_vs_actual maxAbs<=20ms
flag: FEATURE_SDK_V3_KALMAN_TOI
revert: remove folder/flag
---
Goal: Promote 1D CV Kalman as primary TOI predictor; learn per-session, per-seat calibration from post‑mortem actuals to hit user‑chosen lookahead.

Proven path: src/ports/toiKalmanPort.js + tests/unit/toiKalmanPort.test.mjs; event wiring in src/core/pinchCore.js (toiActualEnterAbs) and replay validators in tests/replay/validate_toi_pred_actual.mjs; v3 demo: dev/demo_fullscreen_sdk_v3_kalman.html.

Files touched: this note; integration points planned in src/app/appShell.js (flag path), src/sdk/hexInputFacade.js (optional getTelemetry), tests/replay/* (guard).

Markers: WEBWAY:ww-2025-008:

Next steps:

- Wire Kalman TOI into app shell behind FEATURE_SDK_V3_KALMAN_TOI; surface toiPredAbsK and toiActualEnterAbs on events and in rich snapshots.
- Add per-seat session calibration store: error = actual - predicted; maintain bias/EMA and apply toward user lookahead target.
- Expose minimal telemetry accessor (session stats) for tuning UIs.
- Add e2e guard: replay pinch/idle goldens; enforce maxAbsToiErr<=20ms; record mean/jitter.
- When stable, flip default to Kalman; keep legacy speculative path as fallback.
