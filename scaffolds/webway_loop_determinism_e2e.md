---
id: ww-2025-058
owner: @you
status: active
expires_on: 2025-10-10
guard: FEATURE_LOOP_E2E=1; E2E_PORT=8091; E2E_REUSE_HTTP=1; run: jest --testPathPattern=looped_clip_determinism.test.js
flag: FEATURE_LOOP_E2E
revert: remove folder/flag
---
 
# Webway: Looped golden determinism e2e

Goal: Ensure identical pinch:down counts per loop at 1.0x and 1.5x.
Proven path: Puppeteer server reuse gate + HTMLMediaElement.loop wrap detection.
Files touched: jest-puppeteer.config.cjs; September2025/TectangleHexagonal/tests/e2e/looped_clip_determinism.test.js
Markers: WEBWAY:ww-2025-058:

Next steps: Expand to 0.75x and 2.0x; add per-loop timing summaries; un-gate once v5 harness stabilizes.
