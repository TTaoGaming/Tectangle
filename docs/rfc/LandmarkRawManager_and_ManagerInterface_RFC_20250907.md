# RFC — LandmarkRawManager DeepDive + Manager Interface Finalization — 2025-09-07

Purpose

- Short: produce a DeepDive for LandmarkRawManager and finalize the Manager Interface into a short RFC with timeline, risk matrix, and acceptance criteria to prepare work for implementation.
- This RFC references the Camera deep dive [`docs/deepdives/DeepDive_CameraManager_20250907.md:1`] and the Manager Interface spec [`docs/specs/manager_interface.md:1`].

Context and constraints

- LandmarkRawManager is the canonical pipeline input manager that takes frames from CameraManager and emits canonical landmark:raw envelopes consumed by LandmarkSmoothManager and downstream systems. See implementation: [`September2025/Tectangle/src/LandmarkRawManager.js:33`].
- Prototypes and tests already wire the manager: see prototype usage [`September2025/Tectangle/prototype/landmark-raw/index.html:261`] and unit tests [`September2025/Tectangle/tests/unit/landmarkraw.red.test.mjs:1`].
- Existing ManagerRegistry and guidelines: [`September2025/Tectangle/src/ManagerRegistry.js:4`], Manager Interface: [`docs/specs/manager_interface.md:1`], Camera deep dive: [`docs/deepdives/DeepDive_CameraManager_20250907.md:1`].

DeepDive — LandmarkRawManager (Executive summary)

- Responsibility: ingest camera frames (real or synthetic), run MediaPipe or deterministic fallback, normalize outputs (frameId, videoParams, model metadata), apply basic plausibility and low-confidence filtering, and emit `landmark:raw` envelopes with deterministic frameId aligned to camera frames.
- Why: deterministic `landmark:raw` with canonical metadata is required for reproducible golden-trace replay, deterministic smoke tests, and robust downstream pinch detection.
- Shortcoming observed: MediaPipe initialization and browser globals can cause silent failures; import-time side effects and inconsistent envelope shapes reduce test determinism.

5W1H

- Who: Owners: frontend/platform engineer (lead), QA for smoke; Consumers: LandmarkSmoothManager, PinchRecognition, TelemetryManager.
- What: produce a Manager Interface–conformant `LandmarkRawManager` implementation, sidecar meta, AJV schemas, and golden-trace smoke tests.
- When: Prioritize P0 quick fixes (today); full refactor and CI integration within 3 working days.
- Where: code paths: [`September2025/Tectangle/src/LandmarkRawManager.js:33`], prototype: [`September2025/Tectangle/prototype/landmark-raw/index.html:261`].
- How: refactor to Manager interface, add tests, AJV schemas, synthetic replay mode, and integrate into ManagerRegistry.

Evidence & current state

- Unit and smoke tests are present that import LandmarkRawManager: see tests in [`September2025/Tectangle/tests/unit/landmarkraw.red.test.mjs:1`] and others under `tests/unit/` referencing `LandmarkRawManager`.
- Logs show runtime messages and filters: see test report snippets [`September2025/Tectangle/tests/reports/test-health-20250902.log:81`] where the manager logs low-confidence filtering and frame emission.
- Prototype exports and simulation tooling available: `prototype/landmark-smooth/simulate_presets.cjs` and golden extraction guidance in [`August Tectangle Sprint/tectangle-gesture-keyboard-mobile/docs/tectangle_golden_master_checklist_2025-08-30T052336Z.md:44`].

Gaps and risks

- Import-time side effects and unguarded top-level awaits (causing module evaluation abort) — observed in src-backed prototypes.
- MediaPipe dependency and browser-only globals (Hands) — need deterministic fallback for CI/Node.
- Missing or inconsistent envelope shape validation (no AJV validation in emit path).
- Potential frameId drift between CameraManager and LandmarkRawManager.

Recommended remediation (priority-ordered)

P0 — Quick guard and registry (0.5 day)
- Wrap bootstrap `await ready` with try/catch in prototypes to avoid aborting module evaluation and add `prototype/common/manager-bootstrap.js` to expose `window.__MANAGERS__` (see camera deep dive: [`docs/deepdives/DeepDive_CameraManager_20250907.md:1`]).

P1 — Manager Interface conformance (1 day)
- Refactor `LandmarkRawManager` to implement Manager interface methods: start(config), stop(), on/off/emit, getMeta(), diagnostics(). Add sidecar `LandmarkRawManager.meta.json` as described in [`docs/specs/manager_interface.md:1`].
- Ensure no import-time side effects; constructor must be pure.

P2 — AJV schemas + unit tests (0.5 day)
- Add `schemas/landmark.raw.schema.json` and `schemas/video.params.schema.json`. Validate envelopes before emit and add unit tests under `tests/unit/` that check AJV validation.

P3 — Synthetic replay mode + golden traces (0.5–1 day)
- Add a synthetic mode to accept golden JSONL traces and replay frames deterministically (`prototype/landmark-smooth/golden/`).
- Extract canonical 2s windows and commit them as goldens; add replay smoke harness that asserts envelope shape and counters.

P4 — CI integration & header-check (0.5 day)
- Add CI job to validate manager meta files, AJV schemas, and run smoke harness replay against golden traces (reference: [`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:54`]).

Acceptance criteria (definitive)

1) API and meta
- `LandmarkRawManager` exports default class and conforms to Manager interface; `LandmarkRawManager.meta.json` exists and passes header-check CI.

2) Deterministic output
- Replaying `prototype/landmark-smooth/golden/<trace>.jsonl` through CameraManager synthetic + LandmarkRawManager produces identical `landmark:raw` envelopes (within deterministic tolerances) and passes AJV validation.

3) Tests
- Unit tests for filtering logic pass; `tests/unit/landmarkraw.red.test.mjs` passes on CI and locally.

4) No import-time side effects
- Importing manager module in Node/ESM runner must not start cameras or throw; start must only occur when start() is called.

5) Telemetry
- diagnostics().counters contains frames_emitted and errors, and synthetic replay increments synthetic_runs.

Timeline (recommended, short)

- Day 0 (0–4h): Apply P0 quick guard to prototypes and add ManagerRegistry exposure.
- Day 1: Implement Manager Interface conformance for LandmarkRawManager and add meta file + basic unit tests.
- Day 2: Add AJV schemas, extract goldens, and implement synthetic replay mode; run smoke harness locally.
- Day 3: Add CI jobs for header-check, schema validation, and golden replay; fix CI failures and merge.

Owners & roles

- You (architect): approve RFC and PR scope.
- Frontend/Platform engineer: implement refactor and tests.
- QA/automation: author smoke harness and CI workflows.

Risk matrix (summary)

- Risk: MediaPipe global missing or breaking in CI. Likelihood: Medium. Impact: High. Mitigation: synthetic deterministic fallback mode for Node replay.
- Risk: Golden trace brittleness causing false negatives. Likelihood: Medium. Impact: Medium. Mitigation: define envelope tolerances; pairwise acceptance thresholds; nightly full-run for exhaustive checks.
- Risk: Import-time side effects reintroduced. Likelihood: Low (after code review). Impact: High. Mitigation: header-check CI and unit tests that import modules and assert purity.
- Risk: FrameId alignment drift. Likelihood: Low. Impact: High. Mitigation: canonical frameId policy (derived from CameraManager) and alignment tests.

Manager Interface Finalization — short RFC (summary)

Decision

- Accept [`docs/specs/manager_interface.md:1`] as the canonical Manager Interface. Move from spec to RFC and require core managers in Phase‑0 to adopt within a single sprint.

RFC items

1) Require meta sidecars for phase‑0 managers: CameraManager, LandmarkRawManager, LandmarkSmoothManager, EventBusManager. Example meta: see [`September2025/Tectangle/src/LandmarkRawManager.meta.json:1`] and spec [`docs/specs/manager_interface.md:1`].

2) CI enforcement: add a header-check workflow that validates meta files and referenced schemas before merging PRs that modify manager files.

3) ManagerRegistry adoption: all prototype pages must register manager instances on `window.__MANAGERS__` during start() for discovery by smoke harnesses (see registry: [`September2025/Tectangle/src/ManagerRegistry.js:4`]).

4) Acceptance: Manager Interface RFC is accepted when:
- Header-check CI exists and passes.
- Three core managers (Camera, LandmarkRaw, LandmarkSmooth) have meta files and pass AJV validation locally and on CI.
- ManagerRegistry is present and used by prototypes.

Backwards compatibility

- Provide thin shims for legacy prototype pages that expect import-time behavior (shim in `prototype/common/manager-bootstrap.js`): shim will defer to start() and emit warnings; PR should include deprecation note.

Open questions

- Tolerance policy for golden parity: what numerical envelope tolerance to accept for floating point differences (proposal: relative error <= 1e-3 for normalized coordinates; configurable per-test).
- Scope of nightly full variant runs for adapters (pairwise reduction strategy recommended).

Next steps (concrete)

1) Approve this RFC.
2) I will create the DeepDive_LandmarkRawManager PR stub and implement P0 quick fixes if you approve; confirm and I will switch to code mode to implement the changes.
3) Add header-check CI job and AJV schema tests in a follow-up PR.

Key references

- Manager Interface spec: [`docs/specs/manager_interface.md:1`]
- Camera deep dive: [`docs/deepdives/DeepDive_CameraManager_20250907.md:1`]
- LandmarkRaw implementation: [`September2025/Tectangle/src/LandmarkRawManager.js:33`]
- LandmarkRaw tests: [`September2025/Tectangle/tests/unit/landmarkraw.red.test.mjs:1`]
- ManagerRegistry: [`September2025/Tectangle/src/ManagerRegistry.js:4`]
- Golden master checklist: [`August Tectangle Sprint/tectangle-gesture-keyboard-mobile/docs/tectangle_golden_master_checklist_2025-08-30T052336Z.md:44`]

End of RFC