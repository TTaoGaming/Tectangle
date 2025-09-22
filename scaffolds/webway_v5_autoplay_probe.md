---
id: ww-2025-057
owner: @tommy
status: active
expires_on: 2025-10-10
guard: e2e: v5_dino_p1_only_pinches observes downs>0 within 60s
flag: FEATURE_V5_AUTOPLAY_PROBE
revert: remove folder/flag
---

# Webway: v5 autoplay + pinch probe

Goal: Make v5 demo reliably emit pinch events under headless automation so Dino sidecar can observe P1 downs.
Proven path: Autoplay nudges used in prior v2/v3 demos and test harnesses with `--autoplay-policy=no-user-gesture-required`.
Files touched: dev/demo_fullscreen_sdk_v5_material.html, src/app/appShell.js
Markers: WEBWAY:ww-2025-057:
Next steps: If downs still zero, add MP source readiness log and first-frame sentinel; optionally gate dino.attach until first pinch event.
