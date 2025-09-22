---
id: ww-2025-061
owner: @TTaoGaming
status: active
expires_on: 2025-10-09
guard: e2e v5 dino tests load MP4 without 404 using env port (HEADLESS=0,E2E_PORT=8091)
flag: FEATURE_E2E_ENV_BASE
revert: remove folder/flag
---

# Webway: Normalize E2E base URLs to env port

Goal: Remove hardcoded :8080 in tests; use SITE_BASE/E2E_PORT/E2E_HOST; fix clip paths to absolute to prevent 404s.

Proven path: jest-puppeteer env-driven server reuse (repo jest-puppeteer.config.cjs).

Files touched:

- September2025/TectangleHexagonal/tests/e2e/v5_dino_sidecar_smoke.test.js
- September2025/TectangleHexagonal/tests/e2e/v5_dino_iframe_integration.test.js
- September2025/TectangleHexagonal/tests/e2e/v5_dino_p1_only_pinches.test.js
- tests/e2e/v3_kalman_sidecar_dino.test.js

Markers: WEBWAY:ww-2025-061

Next steps: run headful v5 tests with E2E_PORT=8091; if green, extend normalization to smoke/golden scripts as needed.
