<!--
STIGMERGY SUMMARY HEADER
Source: August Tectangle Sprint/
Generated: 2025-09-18T02:05Z
-->

# August Tectangle Sprint Summary (Shareable Demo + Mid-MVP)

## Sprint Vision
- Mission: gesture-only spatial computing platform replacing physical instruments/tools, starting with a PWA demo and converging on offline Android deployments.
- Minimum shippable: persistent left/right skeleton (Three.js) driven by MediaPipe, pinch detection with hysteresis, and MPE/keyboard/macro mapping layer.
- Long arc: progress from web demo ? mid-MVP ? offline APK ? educator field kit ? projector/drone multimodal rigs.

## Integration Spec Highlights
- **Skeleton schema** with wrist quaternion, per-joint confidence/velocity, and optional metadata tags.
- **Pinch event contract** (`pinch_start/end/hold`) including normalized distance, world position, velocity, duration.
- **Smoothing defaults**: One-Euro filter (minCutoff 1.0, beta 0), quaternion SLERP factor ~0.6.
- **Strangler approach**: reuse `foundation/game.js` + `hand-tracking-tutorial/HandControls.js`; provide shim for classic MediaPipe vs Tasks API output.

## Roadmap (Phase 0 ? Phase 4)
1. **Phase 0 PWA demo** (1–2 weeks): deliver shareable skeleton + pinch + WebMIDI/Tone.js mapping.
2. **Phase 1 Mid-MVP** (4–8 weeks): stable skeleton with pinch accuracy >85%, optional Rapier colliders, QR-exportable settings.
3. **Phase 2 Offline Android**: quantized TFLite, NNAPI/GPU delegate, adaptive FPS, calibration wizard.
4. **Phase 3 Field Pilot**: teacher guides, solar-powered kit, usage metrics and presets.
5. **Phase 4 Advanced**: projector/drone rigs, Unity migration, multimodal sensors.

## Decision Prompts
- Choose distribution priority (PWA vs APK vs both) before sprint execution.
- Identify monolith sections to port (pinch heuristics, tag metadata) via selective extraction.

## Action Hooks
- Add skeleton schema + pinch contract into `blackboards/pinch_stability.md` and `telemetry_sync.md`.
- Draft ADR `ADR-2025-08-AugustSprintRoadmap` summarizing phased rollout and distribution choices.
- Update import manifest row to note sprint summary in hub.
