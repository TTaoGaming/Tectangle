<!--
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
- [ ] Re-evaluate this artifact against current Hexagonal goals
- [ ] Validate references against knowledge manifests
- [ ] Log decisions in TODO_2025-09-16.md
-->

# Tectangle managers roll‑up (not Hex)

Timestamp: 2025-09-12

## map

camera → landmark:raw → landmark:smoothed → kinematic clamp → pinch → quant/keyboard/visual/recording; telemetry/watchdog observe; registry wires.

## implemented

- EventBusManager: canonical envelopes, ring buffer, publish/publishFrom.
- ManagerRegistry: register/get/list; factories; wiring; lifecycle.
- CameraManager: camera:params, camera:frame; device/mirror events; synthetic/webrtc.
- LandmarkRawManager: consumes camera:frame/config; emits landmark:raw/config; MediaPipe or deterministic; confidence gating.
- LandmarkSmoothManager: OneEuro per keypoint; emits landmark:smoothed.
- KinematicClampManager: consumes smoothed; emits landmark:clamped, plausibility:physics.pass/fail, telemetry counters.
- PinchRecognitionManager: per-finger FSM; emits tectangle:gesture.
- TrackManager: nearest‑neighbor tracks; emits tracks:updated.
- OnboardingManager: fingerprint (knuckle span + bone ratios), lightweight mappings.

## scaffold / header‑only

AbsoluteScaleManager, PredictiveLatencyManager, QuantizationManager, RecordingManager, KeyboardManager, HandModelManager, UIManager, VisualManager, WatchdogManager, GestureLooperManager.

## empty placeholders

ControllerIdTracking, HandBoneChainManager, HandPalmManager, PalmOrientationManager, SpatialAnchorManager, WristQuaternion.

## next small slice

- Adopt: add TelemetryManager scaffold to export normalized envelopes.
- Adapt: KinematicClamp counters test (1 green + 1 red).
- Invent (later): minimal KeyboardManager delivery shim.

## code links

- TelemetryManager: `src/ports/telemetryManager.js`
- WatchdogManager: `src/ports/watchdogManager.js`
- Tests: `tests/unit/telemetry_watchdog.test.mjs`
