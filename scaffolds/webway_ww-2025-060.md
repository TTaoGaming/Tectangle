---
id: ww-2025-060
owner: @spatial
status: active
expires_on: 2025-10-10
guard: e2e: v5 dino iframe echo ≥ 1 within 20s
flag: FEATURE_SIDECAR_DINO_V5
revert: remove folder/flag
---
# Webway: Dino iframe Space echo + ready sentinel tighten
Goal: Make pinch→Space gameplay reliable by ensuring Space key reaches the Dino iframe and the v5 demo flips #e2eReady only when video+rich+strips are live.
Proven path: Use postMessage→KeyboardEvent bridge with echo counter; focus/click retries until echo observed. Tighten sentinel as in similar CI flake fixes.
Files touched: September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v5_material.html
Markers: WEBWAY:ww-2025-060, WEBWAY:ww-2025-061
Next steps: Normalize test base URLs; add e2e asserting __diag.dinoEcho > 0; gate readiness with FEATURE_V5_READY_SENTINEL in tests.
