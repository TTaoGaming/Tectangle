---
id: ww-2025-056
owner: @TTaoGaming
status: active        # active|ready|done|expired
expires_on: 2025-10-09   # auto-expire TTL (21 days)
guard: npm run -s hex:smoke:golden
flag: FEATURE_SIDECAR_DINO_V5
revert: remove folder/flag
---

# Webway: Floating Dino Window + Seat-first labels

Goal: Provide a simple floating window for the Dino sidecar and align UI labels to seats (P1/P2) to decouple handedness.
Proven path: v5 page uses iframe + sidecar with message→KeyboardEvent bridge; draggable header for window movement.
Files touched: September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v5_material.html
Markers: WEBWAY:ww-2025-056:
Next steps: Harden focus and trust for iframe input, add optional resize handle, and unify seat mapping in SDK state.
