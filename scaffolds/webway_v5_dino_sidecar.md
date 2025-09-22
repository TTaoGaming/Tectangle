---
id: ww-2025-055
owner: @tommy
status: active        # active|ready|done|expired
expires_on: 2025-10-10   # auto-expire TTL (21 days)
guard: test:e2e v5_dino_sidecar_smoke.test.js
flag: FEATURE_SIDECAR_DINO_V5
revert: remove folder/flag
---
# Webway: v5 Dino sidecar harness
Goal: Feel predictive pinch hysteresis driving a simple game (Dino) without touching v4 canon.
Proven path: v3 Kalman + Dino sidecar (ww-2025-008); v4 M3 canon page; TTI recorder fix (ww-2025-048/050).
Files touched: dev/demo_fullscreen_sdk_v5_material.html; tests/e2e/v5_dino_sidecar_smoke.test.js
Markers: WEBWAY:ww-2025-055:
Next steps: Expose lookahead and bias controls in-panel; add HUD with live TTI stats; route only P1 seat to sidecar by default.
