---
id: ww-2025-078
owner: @TTaoGaming
status: active
expires_on: 2025-10-10
guard: hex:telemetry:golden:* must report handIdNullFrames == 0
flag: FEATURE_TELEM_HANDID_GUARD
revert: remove folder/flag
---

# Webway: HandId telemetry guard + unbiased seat fallback

Goal: Make handId dropouts visible and remove handedness fallback to avoid seat flapping.
Proven path: Expose __hexHandIdNullFrames from MediaPipe port and fail runner when >0; router falls back to default seat when no handId.
Files touched: src/ports/mediapipe.js, src/adapters/hand_event_router.mjs, tests/smoke/run_v3_kalman_telemetry.mjs
Markers: WEBWAY:ww-2025-078
Next steps:

- Add a tiny unit test to assert resolveSeat() returns default when no handId.
- Consider logging lastDetections[*].handId continuity stats in demo UI.
