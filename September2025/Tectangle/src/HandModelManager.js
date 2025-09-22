/**
 * TLDR: HandModelManager — Phase‑0 lightweight canonical hand model: bone chains + normalized joint angles + biomechanical hash per controllerId; gate uncalibrated/hardware-invalid controllers.
 *
 * Executive summary:
 *  - Who: Consumes smoothed landmarks (from [`August Tectangle Sprint/tectangle-gesture-keyboard-mobile/src/LandmarkSmoothManager.js`](August Tectangle Sprint/tectangle-gesture-keyboard-mobile/src/LandmarkSmoothManager.js:1)
 *         and kinematic-clamp outputs (e.g., [`August Tectangle Sprint/tectangle-gesture-keyboard-mobile/src/KinematicClampManager.js`](August Tectangle Sprint/tectangle-gesture-keyboard-mobile/src/KinematicClampManager.js:1)),
 *         and uses calibration from [`August Tectangle Sprint/tectangle-gesture-keyboard-mobile/src/AbsoluteScaleManager.js`](August Tectangle Sprint/tectangle-gesture-keyboard-mobile/src/AbsoluteScaleManager.js:1).
 *  - What: Produce a standardized, compact hand model per controllerId containing:
 *      * boneChains — ordered vectors between configured landmark pairs,
 *      * jointAngles — per-finger arrays (MCP, PIP, DIP approximations) in normalized radians,
 *      * palmNormal & palmFacing score,
 *      * plausibility flags & reason codes (e.g., 'angle_out_of_range', 'self_collision'),
 *      * biomechHash (saved during onboarding snapshots): compact normalized bone‑ratio vector + knuckleSpanCm.
 *  - When: Runs per-frame on smoothed input (lightweight math), and on gated onboarding snapshots (palm-facing + low-motion) writes biomechHash to persistent storage.
 *  - Where: Mobile & Chromebook demos; optimized for mid-range phones (Phase‑0).
 *  - Why: Provide deterministic, normalized kinematic inputs to downstream managers (PredictiveLatencyManager, PinchRecognitionManager, VisualManager) and to filter impossible hand configurations early.
 *  - How: Subscribes to 'landmark:smoothed' events, computes bone vectors and signed joint angles using vector math (dot/cross), applies per-joint plausibility thresholds, and publishes 'handmodel:updated' or 'handmodel:invalid'. On onboarding snapshot events compute and persist biomechHash under device+camera+controller keys and publish 'handmodel:snapshot_saved'. Onboard flows are coordinated with [`August Tectangle Sprint/tectangle-gesture-keyboard-mobile/src/OnboardingManager.js`](August Tectangle Sprint/tectangle-gesture-keyboard-mobile/src/OnboardingManager.js:1).
 *
 * Phase‑0 constraints:
 *  - Single-frame, lightweight computation only (no global IK/optimizer).
 *  - Joint angle estimation via simple vector math from configured landmark pairs (proximal→medial→distal).
 *  - Biomech hash: normalized bone-length ratios (compact) + knuckleSpanCm; stored per controllerId and device/camera pose.
 *  - Plausibility checks: per-joint min/max thresholds, total finger extension limits, palm-facing gating; publish 'handmodel:invalid' when violated and suppress gesture outputs for that controllerId.
 *
 * PARAMS_SCHEMA (schema-only + commented EXAMPLE_DEFAULTS):
 *  HANDMODEL_PARAMS_SCHEMA:
 *   {
 *     biomechHash: "array[number] // normalized bone-length ratios in canonical order",
 *     knuckleSpanCm: "number // physical knuckle span in cm (used for scale fallback)",
 *     plausibilityThresholds: { jointMaxRad: "number (radians)", fingerExtensionMax: "number (normalized)", palmFacingMin: "number [0..1]" },
 *     persistKey: "string (storage key prefix)"
 *   }
 *  // EXAMPLE_DEFAULTS (commented):
 *  // { persistKey:'tectangle:biomechHash', plausibilityThresholds:{ jointMaxRad:2.0, fingerExtensionMax:1.8, palmFacingMin:0.7 } }
 *
 * Interfaces & events (Phase‑0):
 *  - Subscribes: 'landmark:smoothed', 'calibration:updated', 'onboarding:request_snapshot'
 *  - Publishes: 'handmodel:updated' (payload: { controllerId, joints, boneChains, palmNormal, plausibility }), 'handmodel:invalid', 'handmodel:snapshot_saved'
 *  - Public API: getHandModel(controllerId), isHandCalibrated(controllerId), computeJointAngles(landmarks)
 *
 * EARS / Acceptance (summary):
 *  - TREQ-121 — HandModelManager.standardized_output — When 'landmark:smoothed' for a calibrated controller is received, publish 'handmodel:updated' with standardized jointAngles and boneChains. Acceptance: downstream consumers receive the envelope and can rely on consistent field names/types.
 *  - TREQ-121a — Plausibility gating — When landmarks produce impossible poses (per-joint angle > configured max or collision), publish 'handmodel:invalid' including reason and suppress gesture outputs for that controllerId.
 *  - TREQ-121b — Biomech snapshot persistence — On onboarding snapshot (palm-facing, low-motion), compute biomechHash and persist under a device+camera+controller-scoped key; publish 'handmodel:snapshot_saved' with the key.
 *
 * UI_METADATA: { tabId: 'handModel', title: 'Hand Model', order: 3, configSchema: 'HANDMODEL_PARAMS_SCHEMA', controls: [{ key:'enabled', type:'boolean', label:'Enabled' }, { key:'logPlausibility', type:'boolean', label:'Log plausibility failures' }] }
 *
 * Future phases (notes):
 *  - Phase‑1: Lightweight per-controller IK/fabric smoothing (WebWorker/WASM) to enforce kinematic consistency and improve predictions; expose small corrective offsets for downstream managers.
 *  - Phase‑2: Integrate metric z refinement (triangulation or monocular depth) to improve bone-length estimates and biomechHash fidelity.
 *  - Phase‑3: Add small learned regressor to correct landmark bias, plus multi-session biomechHash matching for re‑identification / cloud sync.
 *
 * Placement note: HandModelManager sits after LandmarkSmoothManager/KinematicClampManager and after calibration (AbsoluteScaleManager). It supplies a standardized kinematic representation to PredictiveLatencyManager, PinchRecognitionManager, VisualManager and telemetry.
 *
 * Header generated from: [`August Tectangle Sprint/tectangle-gesture-keyboard-mobile/docs/TECTANGLE_SPEC_UPDATED_EARS_2025-08-27T141227Z.md`](August Tectangle Sprint/tectangle-gesture-keyboard-mobile/docs/TECTANGLE_SPEC_UPDATED_EARS_2025-08-27T141227Z.md:1)
 */