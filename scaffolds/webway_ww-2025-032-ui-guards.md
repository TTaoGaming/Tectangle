---
id: ww-2025-032
owner: @ttao
status: active
expires_on: 2025-10-09
guard: npm run -s hex:verify:fast
flag: FEATURE_UI_GUARDS_V1
revert: remove folder/flag
---

# Webway: UI Guards + Pinch Telemetry Scaffold
Goal: Standardize Tailwind-based UI guard states (ready|experimental|placeholder|disabled), mark legacy controls pending manual review, and capture minimal pinch telemetry for post-mortem.
Proven path: Prior v3 demo, added guards+telemetry with clear markers.
Files touched: `dev/src/ui/guards.js`, `dev/src/telemetry/pinch_telemetry.js`, `dev/demo_fullscreen_sdk_v3_kalman.html`.
Markers: WEBWAY:ww-2025-032:
Next steps:

- Tag remaining demos with guards.
- Add exporter to download telemetry as JSONL.
- Add auto-tune script to propose updated thresholds from telemetry.
