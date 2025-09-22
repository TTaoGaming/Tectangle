<!--
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
- [ ] Re-evaluate this artifact against current Hexagonal goals
- [ ] Log decisions in TODO_2025-09-16.md
-->

# TODO Today — Tectangle Hex (2025-09-16)

- [x] Design: Hold Deadzone to suppress small flutters while held
  - UI: checkbox + range (norm units), defaults off
  - Core: capture anchor norm on down; require norm > max(exit, anchor+deadzone) for up
  - Wiring: pass config from dev page to cores
- [ ] Verify with clips (PALMGATE on/off) and check downs/ups stability
  - Run smoke on: right_hand_palm_facing_camera_index_pinch_v1.mp4
  - Run smoke on: two_hands_stationary_right_then_left_index_pinch_hold_1s_v1.mp4
  - Record specCancel%, downs/ups, and any flicker
- [ ] Consider span EMA+clamp next (foreshortening guard)
  - Smooth knuckle span; clamp to median window to avoid inflated norm under foreshortening
  - Add CI threshold: ≤1 ghost flip per 300ms window while gate=true

Notes
 
- [ ] Prototype pinch-hold spatial anchor joystick
  - Reuse HandSessionManager events to detect pinch-hold start (no new FSM yet)
  - Map hold vector using existing normalized fingertip gap + wrist pose (2D first)
  - Evaluate portability to existing overlay/telemetry without bespoke wiring

---

## TODO Today — Tectangle Hex (2025-09-19)

Focus: TDD-first path to Dino Runner pinch with Kalman lookahead and telemetry-tuned triple-check.

- [ ] Tests first: Dino pinch adapter (P1)
  - Unit: emits Space keydown on FSM Triggered, keyup on Released
  - Integration: binds to current Pinch FSM; no double-fires; debounces held state
  - Smoke: palm-forward JSONL triggers exactly N downs/ups

- [ ] TOI telemetry wiring
  - Compute TOI_pred from velocity convergence; capture TOI_actual at pinch peak
  - Export JSONL; Side Panel shows TOI_pred vs TOI_actual and delta

- [ ] Triple-check fusion thresholds
  - Distance ratio hysteresis; velocity/accel gate; joint-angle delta
  - Configurable thresholds + One-Euro/Kalman slider (deterministic scale)

- [ ] P2 adapter + dual Dino
  - Second adapter instance listens to P2; two visible panels
  - Tests: P1 doesn’t affect P2 and vice versa

- [ ] Gated negative smoke
  - Palm-away JSONL never triggers
  - CI guard counts must match goldens

- [ ] Side Panel UX cleanup
  - Single Start/Stop/Export button; Pinch Stats table; remove floating HUD remnants

---

## TODO Today - Tectangle Hex (2025-09-20)

Focus: Stand up the Gesture->Touch controller under the new TDD playbook before wiring any UI shell.

- [ ] Phase A: scaffold `/controllers/{gateFSM,predictor,touchSynth}.js` with Vitest suites covering the playbook red tests 1-7 (`pnpm test`).
- [ ] Phase B: define XState machines for clutch/predictor/touch synth and add model tests that match IDLE->PRIMED->ARMED and predictor confirm/cancel paths.
- [ ] Phase C: build the Playwright MP4 replay harness (tap_1p.mp4, hold_drag_1p.mp4) and diff against initial `.golden.jsonl` exports (`pnpm test:golden`).
- [ ] Fixtures: add placeholder MP4 and golden JSONL under `/fixtures`; wire Ajv schemas (`telemetry.schema.json`, `controller.schema.json`).
- [ ] Demo hook: expose bus events in `gesture_tasks_offline_v3.html` via FEATURE_DINO_PINCH flag so the new controller can be smoke-tested without touching Dino yet.
- [ ] Retro fit: document knobs in `/docs/CONTROLS.md` once defaults land; update Blackboard when phases move to green.

## TODO Today - Tectangle Hex (2025-09-20T19:43:31Z)

Focus: Fast-path smoke of the Gesture->Touch controller skeleton so we can feel PREPARE/DOWN/HOLD events in the offline demo.

- [ ] Phase A snapshot: stub /controllers/{gateFSM,predictor,touchSynth}.js exporting no-op handlers but instrumented Vitest suites (skip flagged) to confirm file layout.
- [ ] Playwright harness shell: create 	ests/golden/tap_1p.spec.ts that loads gesture_tasks_offline_v3.html and logs frame events (assert TODO placeholders for now).
- [ ] Fixture prep: drop placeholder MP4s + empty .golden.jsonl into /fixtures, wire them into package.json scripts (pnpm test:golden:tap, etc.).
- [ ] Demo logging: add feature-flagged console hooks in gesture_tasks_offline_v3.html to print PREPARE/DOWN/HOLD once adapters emit them.
- [ ] Update docs: in docs/TDD.md, annotate Phase A/B status with "in progress" notes once stubs exist.
