---
id: ww-2025-011
owner: @you
status: active
expires_on: 2025-10-08
guard: test:cameraConstraints + lint:arch
flag: FEATURE_CAMERA_CONSTRAINTS
revert: remove folder/flag + revert appShell constraint additions
---
# Webway: Responsive Camera Constraints & Restart API

Goal: Allow live adjustment of camera resolution (width/height) and frameRate, and clean restart when constraints change so overlay normalization remains visually accurate across arbitrary video dimensions.
Proven path: Use `MediaStreamTrack.applyConstraints` when possible; fallback to full `getUserMedia` restart with explicit constraints (mirrors established patterns in web-based video conferencing apps like Jitsi/Meet) while keeping ports layer resolution-agnostic.
Files touched (planned):

- src/app/appShell.js (add `applyCameraConstraints(opts)` + optional `restartCamera(opts)`)  // WEBWAY:ww-2025-011:
- dev/integrated_hand_console_v7.html (UI controls: preset select + FPS + apply button)      // WEBWAY:ww-2025-011:
- tests/unit/camera.constraints.test.mjs (guard: simulate constraint call & restart path)   // WEBWAY:ww-2025-011:

Markers: WEBWAY:ww-2025-011:

Next steps:

1. Implement `applyCameraConstraints(videoEl, { width, height, frameRate })` using active track.
2. Detect unsupported constraint change -> invoke `restartCamera` with requested constraints.
3. Fire custom event `camera:constraints-applied` for UI & logging.
4. Add span heuristic log to `overlayOpsPort` (warn if landmark bounding span < 0.15 after change).
5. Add unit test with mock track applying constraints + restart fallback branch.
6. UI: add resolution presets (640x480, 960x540, 1280x720, 1920x1080) + FPS (30/60) + Apply.
7. TTL review: if stable, graduate flag -> merge into default camera init and retire legacy start path.

Revert path: remove added methods, UI controls, and flag & delete this note (system reverts to static camera start).

Stigmergy Notes:

- Single normalized overlay invariant already established (ww-2025-010); this webway extends adaptability without altering ports contract.
- DI for video dims (current) benefits immediately from higher intrinsic resolutions.
- Guard ensures architectural boundaries preserved (appShell only; no ui->ports reversal).
- Use minimal feature flag gating to allow safe A/B in V7.

Risks & Mitigations:

- Constraint rejection (older devices): fallback restart.
- Performance regression at high resolutions: future heuristic to auto downgrade if FPS < target - 5.
- User confusion: add debug overlay line listing active intrinsic dims.

Expiration: 21-day TTL; evaluate adoption & remove flag if stable.

## 2025-09-17 Diagnostic Append (Normalization Offset)

Symptoms: Hand dots visibly "shrunken" and offset relative to real hand across resolutions; improving with resolution but never aligning.

Findings:
- Overlay pipeline always treated any in-range values as potentially -1..1, shifting them to 0..1 even when they were already 0..1 (ROI or model output), producing systematic inward bias.
- Lack of raw range logging obscured whether upstream delivered pixel, 0..1, or -1..1 space.
- Span heuristic helped reveal unusually small spans (<0.15) confirming double normalization.

Fix:
- Replaced boolean normalization detector with tri-state `detectSpace` returning `neg1to1 | unit | pixel` to avoid double shift.
- Added raw range debug logging when `FEATURE_OVERLAY_DEBUG` set (one console.debug per frame per hand) to expose space assumptions.
- Added unit test `overlay.normalization.detect.test.mjs` verifying 0..1 landmarks unchanged and -1..1 correctly remapped.

Next Diagnostic Steps:
- Capture sample raw range logs at multiple resolutions; confirm space classification stable.
- If residual offset persists, compare Mediapipe demo by logging their transform inputs; inspect for internal ROI cropping requiring inverse transform.

WEBWAY markers: `overlayOpsPort.js` updated (normalization detection, spanWarn, rawRange log) under `WEBWAY:ww-2025-011`.
