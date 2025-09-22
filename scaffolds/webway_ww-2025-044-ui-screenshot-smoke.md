---
id: ww-2025-044
owner: @tommy
status: active
expires_on: 2025-09-25
guard: npm run -s hex:ui:smoke:v3
flag: FEATURE_SEAT_CONFIG
revert: remove folder/flag
---

# Webway: Headful v3 UI smoke (screenshot)

Goal: Ensure critical controls are visible and Seat Config panel is present; capture deterministic screenshot at T=2s.
Proven path: puppeteer headful run + URL params (?seatcfg=1&autostart=1&clip=...)
Files touched: dev/demo_fullscreen_sdk_v3_kalman.html; tests/golden-master/v3_ui_smoke.screenshot.test.mjs; package.json
Markers: WEBWAY:ww-2025-044:
Next steps: add pixel-diff baseline (jest-image-snapshot or pixelmatch) and wire into CI.
