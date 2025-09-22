---
id: ww-2025-009
owner: @you
status: active
expires_on: 2025-10-08
guard: test:fastOverlaySimplify
flag: FEATURE_FAST_OVERLAY_SIMPLIFY
revert: remove folder/flag
---

# Webway: Fast Overlay Scaling Simplify

Goal: Single-pass, deterministic overlay scaling with normalized ops -> one renderer transform.
Proven path: Normalize at source; renderer handles fit+mirror only.
Files touched: src/ui/fastOverlay.js, src/ports/overlayOpsPort.js, src/ui/canvasOverlayRenderer.js, tests/unit/fastOverlay.simplify.test.mjs
Markers: WEBWAY:ww-2025-009:
Next steps: (1) Enable flag in page for validation (2) Compare legacy vs simplified output visually (3) Remove legacy branches after TTL if stable.
