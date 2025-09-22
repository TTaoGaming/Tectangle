# PinchFSM — Two‑Pager (Games now → Medical later)

Timestamp: 2025-09-04T23:45:00Z
Location: `September2025/PinchFSM/docs/PinchFSM_TwoPager_2025-09-04T23-45-00Z.md`

---

## Page 1 — Complete 1‑pager (current mission)

Purpose
Deliver a reliable, low‑latency thumb–index pinch with predictive look‑ahead that maps to keyboard/game actions and Strike/Lift velocities today, while laying foundations for robust MPE and medical‑grade usage.

Success metrics

- False‑trigger rate ≤ 5% in normal use; end‑to‑end latency ≤ 100 ms (target 40–60 ms perceived).
- Deterministic behavior (no learned timing in Phase‑1).
- Clear UI feedback for Possible → Pinch → Anchored; stable feel with tuneable hysteresis and quantization.

Core loop

- Human hands enabled; read landmarks (thumb_tip=4, index_tip=8, index_mcp=5, pinky_mcp=17).
- Normalize: P = dist(4,8) / dist(5,17). Palm gate required.
- FSM (Open → Possible → Pinch → Anchored) with hysteresis:
	- Enter when P < T_enter (debounced); emit keyDown (Strike) with velocity from dP/dt near entry.
	- After hold ≥ H, Anchored enables continuous control.
	- Exit when P > T_exit or palm gate fails; emit keyUp (Lift) with velocity from dP/dt near exit.

Predictive look‑ahead (deterministic)

- One Euro / 2D Kalman smoothing; TOI prediction with 1‑frame look‑ahead to bias Strike timing so feedback aligns with physical touch (near‑zero perceived latency on smooth motion).
- Musical quantization (optional) for Strike scheduling only: bpm, grid (1/32→1/2), quantStrength, swing, humanizeMs, snapWindowMs.

Redundant pinch validity (lightweight)

- Ratio gate: P < T_enter / > T_exit with hysteresis.
- Velocity gate: fingertip approach speed toward contact (trigger) vs away (release).
- Joint‑angle gate: finger bend change around entry; low bend → down‑weight confidence.

Controls & config (low cognitive load)

- controllerId (pairing), hand (L/R), knuckleSpanCm.
- cameraProfile presets (backend/resolution/fps).
- filterPreset (One Euro: fast/normal/conservative; advanced {minCutoff, beta}).
- hysteresis slider (drives T_enter/T_exit), timing {debounceMs, anchorHoldMs, heldIntervalMs}, quantization block.
- feedback.haptics flag for downstream rumble.

Phase‑1 acceptance

- Emits Strike/Lift with velocities; optional held stream; wrist orientation selects keybank.
- Tests: unit (hysteresis, debounce, palmGate), replay harness for landmark traces; CI: deterministic.

Outputs now

- Keyboard events for games. WebMIDI for Strike/Lift velocities. (Continuous MPE dims behind feature flag until validated.)

---

## Page 2 — Notes, future phases, and curated options

Near‑term backlog (curated from notes)

- 4 pinches per hand; wrist‑quaternion keybank mapping; user‑custom keyboard map.
- Dead zones: around spatial anchor and screen edges; configurable.
- Multi‑hand overlap filter: disallow two hands occupying identical 2D/3D space; add wrist/hand “no‑merge zone.”
- Telemetry: false positives, missed pinches, anchor jitter, fps, pipeline latency; single Start/Stop/Export button in sidepanel; remove floating HUD.
- UI cleanup: fix sidepanel; bottom bar minimal and configurable; landmarks overlay alignment checks; camera manager logs settings at startup.

Manager architecture (standardize now)

- Each Manager = deterministic I/O black box with common interface: init(config) → start() → stop() → getState() → on(event).
- Headers per file: TL;DR, inputs/outputs, errors, usage snippet, verification notes.
- First targets: CameraManager, LandmarkManager, PhysicsPlausibilityManager, AnatomyManager, PinchFSMManager, QuantizationManager, MappingManager, TelemetryManager, UIManager.

Testing strategy

- Smoke harness: fast deterministic replay of recorded landmark JSONs to assert event timelines (pinch at t, anchor at t+H), counters, and UI state flags.
- Unit tests for math/FSM/gates; nightly regression replay; optional Playwright video golden masters.

Emulator outputs (future)

- Touchscreen/mouse/multitouch/VR‑hand emulators driven by gestures; map reliable poses to clicks/drags.

MPE note (future)

- Day‑1: Strike/Lift velocities only (deterministic). Later: map 3D anchored axes and vectors to MPE (Pressure, Pitch, Timbre) plus path metrics (distance/velocity/accel/jerk) with curves.

Phases ladder

- P0 Stabilize: tests + replay + logging; fix sidepanel/HUD; baseline thresholds.
- P1 Game‑ready: Strike/Lift, look‑ahead, quantization opt‑in, wrist keybank, 4 pinches/hand.
- P2 Robustness: triply‑gated pinch (ratio/velocity/joint‑angle), multi‑hand overlap filter, dead zones, telemetry.
- P3 SDK/API: publish Manager interfaces, mapping API, plugin points, config schema; ship examples.
- P4 Offline & rural: PWA with local models, safe mode, calibration workflow, USB/SD updates, export logs.
- P5 Medical‑ready: traceability, immutable goldens, stricter gates, audit logs, privacy posture.

Three options you can approve now

1) Phase‑1 Minimal+ (fastest path to playable)
	- Include: 4 pinches/hand, wrist keybank, Strike/Lift velocities with look‑ahead, quantization settings, sidepanel Start/Stop/Export, camera manager boot logs.
	- Defer: triply‑gated detection and overlap filter to P2.

2) Detection‑First (robustness now)
	- Include: triply‑gated pinch (ratio+velocity+joint‑angle), overlap/no‑merge filter, dead zones, telemetry counters; keep Strike/Lift + wrist keybank; quantization optional.
	- Defer: SDK/API formalization to P3.

3) SDK/API‑First (platformize early)
	- Include: Manager interface standard, config schema, mapping SDK (keyboard/WebMIDI), examples; keep simple ratio+velocity gating for now.
	- Defer: advanced overlap filter and dead zones to P2.

Open questions (quick)

- Accept Strike/Lift‑only for MPE in P1?
- Which option (1/2/3) should I implement first?
- Keyboard map format preference (JSON schema) and default wrist‑bank layout?

End.
// archived copy — original kept for reference
