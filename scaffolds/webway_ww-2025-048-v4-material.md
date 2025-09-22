---
id: ww-2025-048
owner: @tommy
status: active
expires_on: 2025-10-09
guard: v4 UI smoke test
flag: FEATURE_V4_MATERIAL
revert: remove folder/flag
---
# Webway: v4 Material baseline demo

Goal: Clone v3 demo to v4 and apply a clean Material-esque baseline, fix empty panel by wiring live state updates, and keep the Kalman tray.

Proven path: Tailwind utility + tokenized colors; minimal component polish; puppeteer smoke.

Files touched:

- September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v4_material.html
- September2025/TectangleHexagonal/tests/golden-master/v4_ui_smoke.screenshot.test.js
- package.json (hex:ui:smoke:v4)

Markers: WEBWAY:ww-2025-048:

Next steps:

- Introduce a small design token module and CSS variables for themes.
- Replace toolbar/buttons with consistent components and density.
- Add pixel-diff snapshot on the v4 UI smoke image.
