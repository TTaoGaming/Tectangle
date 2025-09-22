---
id: ww-2025-051
owner: @you
status: active
expires_on: 2025-10-10
guard: npm run -s hex:tti:collect
flag: FEATURE_TTI_SMOKE
revert: remove folder/flag
---

# Webway: TTI recorder + smoke validation

Goal: Ensure v4 demo produces pinch TTI samples and report median/p90 err vs lookahead; fix prediction units.
Proven path: Puppeteer smoke runs demo_fullscreen_sdk_v4_material.html on golden clip and reads window.__tti.getSamples().
Files touched: src/telemetry/pinch_tti.js; September2025/TectangleHexagonal/tests/smoke/collect_tti_from_v4.test.js
Markers: WEBWAY:ww-2025-051:
Next steps: add HUD with rolling stats; gate future PID/CMA-ES under a feature flag; persist JSONL for offline tuning.
