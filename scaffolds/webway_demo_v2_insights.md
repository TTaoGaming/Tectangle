---
id: ww-2025-002
owner: @you
status: active        # active|ready|done|expired
expires_on: 2025-10-09   # auto-expire TTL (21 days)
guard: npm run hex:smoke:demo:v2
flag: FEATURE_FLAG_DEMO_V2_INSIGHTS
revert: remove folder/flag
---
# Webway: Demo v2 Tier-0 insights
Goal: Add a minimal, parseable insights layer (hysteresis strip + event rail) to the fullscreen demo with a safe flag and a small e2e smoke.
Proven path: Puppeteer e2e smoke on static http-server with Jest-Puppeteer; object-fit aware overlay mapping.
Files touched: 
- September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v2.html (new)
- September2025/TectangleHexagonal/tests/e2e/demo_v2_insights.smoke.test.mjs (new)
- package.json (script: hex:smoke:demo:v2)
Markers: WEBWAY:ww-2025-002:
Next steps: Extend to Tier-1 (ghost lookahead, wrist compass) and add golden MP4 count/assertions.
