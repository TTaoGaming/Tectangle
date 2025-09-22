# DeepDive — Camera Manager — 2025-09-07

Executive summary

- The Camera Manager provides camera initialization, frame capture, camera:params and camera:frame envelope emission, and synthetic mode for smoke/golden capture. It must be a small, deterministic manager that can run inside prototypes and as an injectable `adapter` in the hexagonal core.
- Immediate problem: the repo's prototype bootstrap pattern relies on managers being available at startup; an unguarded top-level await can block UI wiring when CameraManager fails to initialize. See [`September2025/Tectangle/prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224).
- Recommendation: standardize the CameraManager to a deterministic interface, add a small meta header and AJV schemas for emitted envelopes, implement start/stop lifecycle and telemetry hooks, and wire a minimal ManagerRegistry so prototypes and smoke harnesses can discover canonical instances. This reduces brittle bootstrap failures and enables CI golden-trace replay.

5W1H

- Who: Owners are frontend engineers and the core maintainers; consumers are LandmarkRawManager, LandmarkSmoothManager, smoke harness, and the queen orchestrator in future.
- What: A deterministic CameraManager API that exposes start(), stop(), on(event, handler), and getMeta() plus event envelopes for camera:params and camera:frame.
- When: Short sprint (1–2 days) in parallel with the Exploit quick fix (guard bootstrap). Full refactor as part of the 3–7 day hexagonal sprint.
- Where: Code lives under prototype/ and src/ depending on refactor stage; prototypes referenced: [`prototype/camera-manager/index.html`](prototype/camera-manager/index.html:1) and modular index implementation [`prototype/landmark-smooth/modular-index/src/camera-manager.js`](September2025/Tectangle/prototype/landmark-smooth/modular-index/src/camera-manager.js:1).
- Why: Prevent module bootstrap failures, enable deterministic replay and golden-trace CI, and make CameraManager interchangeable as an adapter in a hexagonal architecture.
- How: Replace top-level side effects with lifecycle methods, expose meta header (JSON), add AJV envelope schemas, add small unit tests to validate camera:frame envelope, and add a ManagerRegistry stub `window.__MANAGERS__` to support discovery during prototype runs.

Observations (evidence)

- Prototypes and docs repeatedly reference CameraManager and golden traces: see [`September2025/Tectangle/prototype/landmark-smooth/modular-index/README.md`](September2025/Tectangle/prototype/landmark-smooth/modular-index/README.md:12) and the golden checklist [`August Tectangle Sprint/tectangle-gesture-keyboard-mobile/docs/tectangle_golden_master_checklist_2025-08-30T052336Z.md`](August Tectangle Sprint/tectangle-gesture-keyboard-mobile/docs/tectangle_golden_master_checklist_2025-08-30T052336Z.md:44).
- Manager bootstrap issues cause `index-src.html` to abort evaluation: [`September2025/Tectangle/prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224).
- Simulation and replay tooling exists: [`prototype/landmark-smooth/simulate_presets.cjs`](August Tectangle Sprint/tectangle-gesture-keyboard-mobile/prototype/landmark-smooth/simulate_presets.cjs:1) and exports such as `prototype/landmark-smooth/landmark_export_20250829T202407.jsonl`.
- The TDD checklist already recommends a ManagerRegistry / `window.__MANAGERS__` for discovery: see [`August Tectangle Sprint/tectangle-gesture-keyboard-mobile/docs/tectangle_tdd_checklist_2025-08-28T163452Z.md`](August Tectangle Sprint/tectangle-gesture-keyboard-mobile/docs/tectangle_tdd_checklist_2025-08-28T163452Z.md:34).

Gaps and risks

- Unguarded bootstrap: top-level awaits cause module evaluation to abort — immediate cause of demo failures (see above).
- Missing standardized manager header/meta: inconsistent metadata complicates automated discovery and header validation in CI.
- Lack of AJV schemas for runtime envelopes (`camera:frame`, `landmark:raw`, `landmark:smoothed`) — tests are brittle and require manual inspection.
- Event envelope shapes vary across prototypes and src implementations, causing fragile consumers.
- Manager lifecycle not explicit (start/stop) and side effects at import time.
- Integration tests / smoke harness need canonical golden traces checked into `prototype/landmark-smooth/golden/` but some are missing.

Code audit summary (CameraManager)

- Positive:
  - Prototype code emits `camera:params` and `camera:frame` and supports synthetic mode for offline golden capture; a modular-index implementation is present [`prototype/landmark-smooth/modular-index/src/camera-manager.js`](September2025/Tectangle/prototype/landmark-smooth/modular-index/src/camera-manager.js:1).
  - Simulation tooling for presets and exports exists (`simulate_presets.cjs`).
- Issues / smells:
  - Side effects at module import (top-level starts) — brittle for ESM import in Node/E2E test runners.
  - No AJV or JSON Schema validation of emitted envelopes.
  - Inconsistent or missing header metadata (no canonical `meta.json` alongside the manager).
  - Event emitter API is ad-hoc (stringly typed event names without types or enums).
  - No clear telemetry hooks (counters, failures, diagnostics) exposed by the manager.

Recommended remediation (actionable)

1) Apply quick fixes (0.25–2h)
   - Guard top-level await in [`September2025/Tectangle/prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224) with try/catch and add dynamic fallback import of CameraManager inside Start().
   - Add `window.__MANAGERS__` registration in `prototype/common/manager-bootstrap.js` so smoke pages can discover canonical instances.

2) Manager standardization (1–2 days)
   - Add canonical meta file: [`August Tectangle Sprint/tectangle-gesture-keyboard-mobile/src/CameraManager.meta.json`](August Tectangle Sprint/tectangle-gesture-keyboard-mobile/src/CameraManager.meta.json:1).
   - Refactor manager to export a class with explicit lifecycle:
     - start(config): Promise<void>
     - stop(): Promise<void>
     - on(event: string, handler: Function)
     - emit(event: string, envelope: object)
     - getMeta(): object
   - Replace any import-time side effects with explicit start calls.

3) Add AJV schema and runtime validators (low friction)
   - Create `schemas/camera.frame.schema.json` and `schemas/camera.params.schema.json`, validate envelopes before emit and in tests.
   - Add unit tests that assert envelope shape and sample values.

4) Telemetry and observability
   - Add telemetry hooks: counters (frames emitted, errors, synthetic mode runs), and an optional telemetry adapter to report to local Prometheus/Loki in dev.
   - Expose a `diagnostics()` method returning current pipeline state for smoke harness to snapshot.

5) Smoke harness and golden traces
   - Extract 2s golden windows into `prototype/landmark-smooth/golden/` and commit.
   - Add node replay harness to run in CI: `node tests/smoke/replay_camera_trace.mjs` that feeds golden JSONL into CameraManager in synthetic mode and asserts telemetry and envelope outputs.

Manager header template (suggested)

Use a sidecar JSON meta for each manager to simplify header validation and avoid heavy in-file headers.

[`json()`](docs/deepdives/DeepDive_CameraManager_20250907.md:1)
```json
{
  "name": "CameraManager",
  "version": "0.1.0",
  "author": "team",
  "description": "Deterministic browser camera manager with synthetic mode and frame envelope emission.",
  "lifecycle": ["start","stop","diagnostics"],
  "events": {
    "camera:params": "object",
    "camera:frame": "object"
  },
  "schema_files": {
    "camera:params": "schemas/camera.params.schema.json",
    "camera:frame": "schemas/camera.frame.schema.json"
  },
  "telemetry": ["frames_emitted","errors","synthetic_runs"]
}
```

Manager API quick reference

- start(config) → Promise: initializes camera device or synthetic source and registers to ManagerRegistry.
- stop() → Promise: stops capture and releases resources.
- on(event, handler) → subscribe to events.
- emit(event, envelope) → internal use to push envelopes.
- getMeta() → return meta object from sidecar JSON.
- diagnostics() → return current counters and last error.

Validation & tests

- Add AJV-based unit tests for camera.frame and camera.params schemas.
- Add a red/green TDD test for `LandmarkRawManager` consuming `camera:frame`.
- Add CI smoke replay against golden traces as in `prototype/landmark-smooth/golden/`.

Timeline & effort estimate

- Quick bootstrap guard + manager registry: 0.25–2 hours.
- Manager refactor + meta + AJV: 1–2 days.
- Golden trace extraction + smoke harness in CI: 0.5–1 day.

Next steps (recommended)

1. Approve this DeepDive.
2. I will write the Manager Interface spec at `docs/specs/manager_interface.md` (detailed API, header template, AJV schema examples, and VS Code header checker). Confirm and I will create the file.
3. After spec approval, create PR with quick fixes (bootstrap guard + manager registry) and run CI smoke locally.

References (selected)

- Prototype index-src cliff: [`September2025/Tectangle/prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224)
- Modular camera manager: [`September2025/Tectangle/prototype/landmark-smooth/modular-index/src/camera-manager.js`](September2025/Tectangle/prototype/landmark-smooth/modular-index/src/camera-manager.js:1)
- Golden Master checklist: [`August Tectangle Sprint/tectangle-gesture-keyboard-mobile/docs/tectangle_golden_master_checklist_2025-08-30T052336Z.md`](August Tectangle Sprint/tectangle-gesture-keyboard-mobile/docs/tectangle_golden_master_checklist_2025-08-30T052336Z.md:44)
- Simulation tool: [`August Tectangle Sprint/tectangle-gesture-keyboard-mobile/prototype/landmark-smooth/simulate_presets.cjs`](August Tectangle Sprint/tectangle-gesture-keyboard-mobile/prototype/landmark-smooth/simulate_presets.cjs:1)

End of DeepDive