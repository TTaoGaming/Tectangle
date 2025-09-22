---
id: ww-2025-008
owner: @TTaoGaming
status: active
expires_on: 2025-10-09
guard: e2e:sidecar summary stats <= thresholds
flag: FEATURE_SIDECAR_DINO
revert: remove folder/flag
---

# Webway: Negative-latency Dino Sidecar

Goal: Emulate a keyboard "Digit1" key for pinch events with predictive vs actual TOI, self-calibrating toward perceived 0ms latency.
Proven path: v3 Kalman demo + rich JSONL exporter + MP4 goldens.
Files touched: dev/sidecars/dino_sidecar.mjs; dev/demo_fullscreen_sdk_v3_kalman.html; tests/e2e/v3_kalman_sidecar_dino.test.js
Markers: WEBWAY:ww-2025-008:
Next steps: Promote Kalman TOI in runtime behind flag; add session EMA store; add TOI replay guard thresholds.
