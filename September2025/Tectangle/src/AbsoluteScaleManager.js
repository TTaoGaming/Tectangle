/**
 * TLDR: AbsoluteScaleManager — Phase‑0: Knuckle‑Scale 3‑Slice (per-controller numeric calibration: controllerId + knuckleSpanCm).
 *
 * Executive summary:
 *  - Who: Calibration manager used by PredictiveLatencyManager, QuantizationManager, TelemetryManager, VisualManager and onboarding flows.
 *  - What: Phase‑0 simplified model: a single numeric calibration entry per controller (controllerId) mapping to a physical knuckle span in centimeters (physicalKnuckleCm). Compute scaleCm = physicalKnuckleCm / measuredNormalizedDistance between two configured knuckle landmarks.
 *  - When: During onboarding or explicit user calibration per controllerId; capture gated snapshots to build a sparse 3‑slice z mapping (near/primary/far).
 *  - Where: Mobile (mid-range smartphone) & Chromebook demos. Persists calibrations scoped to device + camera pose to allow multiple calibrations per physical setup.
 *  - Why: Provide a deterministic, device+angle-scoped physical scale to stabilize prediction/quantization across devices while keeping Phase‑0 implementation minimal.
 *  - How: Accept numeric input (controllerId and physicalKnuckleCm) via UI; compute scaleCm from measured normalized distance; persist under device/camera/controller-scoped key; publish EventBus events ('calibration:eligible', 'calibration:updated', 'calibration:failed').
 *
 * Phase‑0 design constraints:
 *  - Single-number-per-controller UX: controllerId + knuckle span (cm). No per-frame complex estimation.
 *  - Z‑slice anchors: capture three gated snapshots (near, primary, far) using palm-facing + low-motion checks; store { zProxy, normalizedDistance, scaleCm } and use interpolation for runtime z→scale mapping.
 *  - Lightweight: minimal processing to run well on mid-range smartphones; prefer single-frame math & simple interpolation.
 *
 * Controller concept:
 *  - Controllers are persistent per-device inputs (controllerId 1–4), similar to Switch Joy‑Con: onboarding assigns a controllerId via pinch-and-hold and stores a small biomech hash for later identification.
 *
 * Future phases (notes):
 *  - Phase‑1 (triangulation): consider 2–3 frame two‑view geometry (recoverPose + triangulatePoints) via OpenCV.js to triangulate knuckle points and compute a higher-fidelity metric scaleFactor.
 *  - Phase‑2 (monocular depth): consider lightweight monocular depth models (MiDaS‑tiny / TF Lite / TFJS) per snapshot and rescale depth maps to metric units using knuckle span for denser z anchors.
 *  - Rationale: Phase‑1/2 provide higher metric fidelity at cost of extra compute (WASM/model weights) and engineering complexity; keep Phase‑0 minimal and document these as future upgrades in the spec.
 *  - See design notes in the spec: [`August Tectangle Sprint/tectangle-gesture-keyboard-mobile/docs/TECTANGLE_SPEC_UPDATED_EARS_2025-08-27T141227Z.md`](August Tectangle Sprint/tectangle-gesture-keyboard-mobile/docs/TECTANGLE_SPEC_UPDATED_EARS_2025-08-27T141227Z.md:1)
 *
 * EARS / Acceptance (summary):
 *  - TREQ-111 — AbsoluteScaleManager.per_controller_calibration — When calibrate(frame, { controllerId }) is invoked with required knuckle landmarks and a numeric physicalKnuckleCm for that controllerId, compute scaleCm = physicalKnuckleCm / measuredNormalizedDistance, persist under a device/camera/controller-scoped key, and publish 'calibration:updated' with payload { scaleCm, controllerId, measuredNormalizedDistance, physicalKnuckleCm }.
 *  - TREQ-111a — Snapshot eligibility: captureSnapshot(frame, { controllerId }) shall publish 'calibration:eligible' when palm-facing score >= palmFacingThreshold for palmFacingConsecutiveFrames AND mean landmark velocity <= maxSnapshotVelocity.
 *  - TREQ-111b — Failure modes: publish 'calibration:failed' with an explicit reason when landmarks are insufficient or measurements invalid.
 *  - TREQ-111c — Telemetry: when a calibration snapshot is accepted and persisted, include a deterministic telemetry envelope containing { scaleCm, measuredNormalizedDistance, physicalKnuckleCm, controllerId, lastMeasurement }.
 *
 * UI_METADATA: { tabId: 'calibration', title: 'Calibration / Scale', order: 4, controls: [{ key:'controllerId', type:'number', label:'Controller id', min:1, max:4, step:1 }, { key:'physicalKnuckleCm', type:'number', label:'Knuckle span (cm)', min:4, max:12, step:0.5 }] }
 *
 * Placement note: This manager is intended to run before CameraManager and propagate calibration downstream (device/location/camera-angle scoped). Treat this as a small, deterministic source manager (src-like) that publishes calibration envelopes consumed by downstream managers.
 *
 * Header generated from: [`August Tectangle Sprint/tectangle-gesture-keyboard-mobile/docs/TECTANGLE_SPEC_UPDATED_EARS_2025-08-27T141227Z.md`](August Tectangle Sprint/tectangle-gesture-keyboard-mobile/docs/TECTANGLE_SPEC_UPDATED_EARS_2025-08-27T141227Z.md:1)
 */
