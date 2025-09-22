---
id: ww-2025-076
owner: @TTaoGaming
status: active
expires_on: 2025-10-10
guard: hex:tier:commit must show non-empty handId usage in telemetry and stable seat mapping
flag: FEATURE_T1_TRACKER_REQUIRED
revert: remove folder/flag
---

# Webway: Require HandTracker T1 and prefer handId/seat

Goal: Stabilize seat assignment by ensuring T1 tracker is enabled and its handId is propagated; eliminate handedness fallbacks.
Proven path: Force-enable tracker import, assert on failure, and replace `seatFromHand()` with explicit seat/handId checks.
Files touched: `src/ports/handTrackerT1.js`, `src/app/controllerRouterCore.js`, `dev/sidecars/dino_sidecar.mjs`.
Markers: WEBWAY:ww-2025-076:
Next steps:

- Enable tracker on boot; log/throw if unavailable.
- Pipe handId into events; route by seat/handId; remove label-based fallbacks.
- Add telemetry counter when handId is null to make dropouts visible.
