---
id: ww-2025-059
owner: @TTaoGaming
status: active
expires_on: 2025-10-10
guard: e2e waits for #e2eReady=1 and probe downs > 0
flag: FEATURE_V5_READY_SENTINEL, FEATURE_V5_AUTOPLAY_PROBE
revert: remove folder/flag
---

# Webway: v5 Ready Sentinel + rAF Kick

Goal: Make e2e assertions truthful by waiting for frames/strips before checks.
Proven path: Puppeteer waitFor readiness sentinel + rAF safety alongside rVFC.
Files touched: September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v5_material.html; tests/e2e/seat_mapping_consistency.test.js
Markers: WEBWAY:ww-2025-059:

Next steps:

- Gate tests on video readiness (readyState>=3 & currentTime>0) and #e2eReady=1.
- For determinism: run with probe=1 and assert __probe.downs>0.
- For Dino: add iframe echo counter + focus/click retry if zero keydowns after 3s.
