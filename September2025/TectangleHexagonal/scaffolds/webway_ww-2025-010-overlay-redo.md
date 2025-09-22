---
id: ww-2025-010
owner: @you
status: active
expires_on: 2025-10-09
guard: hex:lint-arch + test:overlayRedo
flag: FEATURE_OVERLAY_REDO
revert: remove folder/flag + restore prior overlayOpsPort
---
# Webway: Overlay Redo (Ports-Level Normalized Builder)

Goal: Remove ui dependency from ports and emit a single normalized coordinate space for overlays.
Proven path: Ports emit pure data in canonical space; renderer handles presentation transforms.
Files touched: src/ports/overlayOpsPort.js (rewritten), dev/integrated_hand_console_v7.html (flag), new test test/unit/overlay.port.redo.test.mjs
Markers: WEBWAY:ww-2025-010:
Next steps: Validate visual alignment; remove legacy simplify flag after TTL if stable; consider deleting fastOverlay.js if unused.
