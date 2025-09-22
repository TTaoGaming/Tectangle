# PinchFSM Golden Landmarks

Outputs: JSONL per-frame at `data/goldens/*.human.landmarks.jsonl`.

Each line is one frame: `{ frameIndex, timestampMs, hands: [{ handedness, landmarks: [{x,y,z} x21] }] }`.

Local run:

- npm run verify
- npm run human:extract
- npm test

CI:

- GitHub Actions runs verify → extract → test on push/PR affecting this folder and uploads the JSONL artifacts.

## PinchFSM - Deterministic Trace Generator (MediaPipe Node WASM)

This subproject creates offline, deterministic landmark traces from MP4s using MediaPipe HandLandmarker (WASM) in Node. It emits JSON goldens and meta for gating PinchFSM behavior in CI.

Highlights

- Deterministic timestamps: tMs = round((frameIndex / fps) * 1000)
- No smoothing in outputs; raw per-frame landmarks are recorded
- Vendored model and WASM; file:// paths to avoid CDN drift

Folders

- src/                Code (trace generator CLI)
- vendor/mediapipe/   Vendored MediaPipe model + WASM
  - models/           HandLandmarker .task file
  - wasm/             Wasm and simd/threads variants
- data/goldens/       Output landmark JSON traces
- reports/            Comparison reports
- artifacts/          Optional overlay videos/images

Usage

- Install deps: run `npm install` in this folder
- Run trace-gen on an input video:
  - `npm run trace-gen -- --input "../../right hand ... pinch.mp4"`
  - Outputs: `data/goldens/{basename}.landmarks.json`, `data/goldens/{basename}.meta.json`, `data/goldens/{basename}.golden_times.json`

Vendored assets (manual step)

- Place the HandLandmarker model and WASM here before running:
  - vendor/mediapipe/models/hand_landmarker.task
  - vendor/mediapipe/wasm/vision_wasm_internal.wasm
  - vendor/mediapipe/wasm/vision_wasm_internal_simd.wasm (optional)
  - vendor/mediapipe/wasm/vision_wasm_internal_threaded_simd.wasm (optional)
  - vendor/mediapipe/wasm/hand_landmarker.task.license (if applicable)

Determinism policy

- Decode frames with ffmpeg at a fixed fps; derive timestamps from frame index and fps
- No temporal filters in detection; run HandLandmarker in VIDEO mode with given timestampMs
- Record exact package versions and asset checksums in meta.json

Notes

- Requires ffmpeg in PATH. If recently installed, restart the shell before running.
- Node 18+ recommended; tested on Node 22.

## Golden Freezing Workflow

Purpose: lock a canonical snapshot of landmark inputs so unintended drift fails fast.

Key artifacts

- Live goldens: `data/goldens/*.human.landmarks.jsonl`
- Frozen snapshots: `data/goldens/frozen/<UTC_STAMP>/...`
- Manifest pointer: `data/goldens/manifest.current.json` (references latest frozen manifest)

Commands

- Regenerate (Human extract): `npm run human:extract`
- Freeze current goldens: `npm run goldens:freeze`
- One-shot regenerate + freeze: `npm run goldens:curate-freeze`
- Verify working goldens still match frozen snapshot: `npm run goldens:verifyFrozen`

Manifest fields

- sha256, size (bytes), frames (JSONL line count), commit, dependency versions.

Update policy (recommended)

1. Make code change.
2. Run `npm run human:extract && npm test` (ensure shape is valid).
3. If behavior intentionally changed: `npm run goldens:curate-freeze`.
4. Commit new `frozen/<stamp>/` + updated `manifest.current.json` in a PR titled `Update goldens: <short rationale>`.
5. Reviewer checks diff & rationale before merge.

CI integration

- Workflow re-generates and tests goldens, then (if a manifest pointer exists) runs `goldens:verifyFrozen` to confirm no accidental drift.
- Fails if checksum / size / frame count differs from frozen manifest.

## Developer & AI Agent Quickstart

Core scripts

- `npm run verify` → environment prerequisites.
- `npm run human:extract` → produce JSONL landmark traces.
- `npm test` → schema & structure validation.
- `npm run goldens:verifyFrozen` → ensure no drift vs frozen manifest.

Determinism pillars

- Fixed fps=30, timestamps from frameIndex.
- Human v3.3.6 pinned; local models & dist served via local HTTP.
- No smoothing / temporal filters during extraction.
- JSONL for line-by-line diffability and streaming.

When to freeze

- After intentional behavioral change OR adding a new scenario video.
- NOT for refactors that do not change landmark outputs (CI will confirm).

Do / Do Not (Agents)

- DO run `npm run verify` before extraction.
- DO keep manifests additive; never overwrite an existing frozen directory.
- DO document rationale in commit / PR title when updating goldens.
- DO NOT delete prior frozen snapshots.
- DO NOT auto-freeze inside general refactor PRs.
- DO NOT modify landmark values post-extraction (treat them as immutable inputs).

Escalation

- If verification fails unexpectedly: capture failing file hashes, open an issue or PR with diff context, avoid forcing a new freeze without root cause.

Related docs

- `docs/two-pagers/CI_Foundations_TwoPager_2025-09-05.md`
- `docs/two-pagers/Golden_Master_Testing_TwoPager_2025-09-05.md`
- `docs/two-pagers/GitHub_Actions_Best_Practices_TwoPager_2025-09-05.md`

## Upcoming: OneEuro Landmark Smoothing (Roadmap)

We will introduce an optional post-extraction smoothing layer (OneEuro filter) that operates on raw landmark streams prior to feeding a future `PinchFSMRunner`.

Principles:

- Raw extraction remains unchanged & frozen (source of truth).
- Smoothing is a derived artifact: `data/goldens/derived/*.oneeuro.landmarks.jsonl`.
- Filter params versioned (minCutoff, beta) in a small JSON config committed with changes.
- Any change to smoothing params or algorithm triggers regeneration + possible freeze of derived outputs (never overwriting raw goldens).

Initial Implementation Plan:
 
1. Define TypeScript interface: `LandmarkPoint { x:number; y:number; z:number }` and `HandFrame` schema reuse.
2. Implement reusable OneEuro filter class (per axis) with deterministic floating math (no Date.now; use frame timestamps).
3. Script: `npm run smooth:oneeuro` reads each raw JSONL, emits smoothed JSONL with same frame/timestamp.
4. Extend manifest to optionally record derived file hashes under `derived.oneEuro` key.
5. Add test: first & second frame passthrough behavior; monotonic timestamp retention.
 

Guardrails:

- Never pipe smoothed results back into extraction; treat as a separate stage.
- Fail fast if raw and smoothed line counts diverge.
- Keep smoothing deterministic (no adaptive randomness).

After Smoothing:

- Build pinch metric (distance thumb-index, velocity) on either raw or smoothed depending on experiment flag.
- Introduce FSM state sequence tests using a short clip.

Agent Reminder: Work in small slices—implement filter class + unit test before wiring CLI script; verify & freeze only when behavior intentionally changes.

---
 
## Phased Roadmap (Singleton Source of Truth)

Focus: deterministic gesture pipeline evolving from raw landmarks → smoothed → pinch events → predictive TOI (time-of-impact) → musical / haptic alignment.

| Phase | Goal | Core Outputs | Freeze Scope | Exit Criteria |
|-------|------|-------------|--------------|---------------|
| 0 | Foundational smoothing + controller identity | `derived/*.oneeuro.landmarks.jsonl` with `controllerId`, kinematic clamp flags | Raw unchanged; derived optional | Smoothed trace deterministic; tests green; no unintended drift |
| 1 | Pinch event engine + gating & hysteresis | `events/*.pinch.events.jsonl` (state transitions) | Event goldens | Stable pinch ON/OFF with no flapping on sample clips |
| 2 | Visualization layer (full-screen) | Dev UI overlay (landmarks, palm normal, gating status) | UI not frozen; underlying traces still | Live demo reproduces event sequence identical to offline processing |
| 3 | Predictive TOI & early trigger | `events/*.pinch.predictive.jsonl` with `predictedTOI`, `leadMs` | Predictive events | Early trigger reduces perceived latency without extra false positives |
| 4 | Music quantization integration | Quantized event stream aligned to grid | Quantized timeline artifact | Quantization latency profiles documented |
| 5 | Optimization & agent automation | Multi-agent (LangGraph) tasks, drift diffs | Process docs | Automated PR agent passes all gates |

### Phase 0 (Current) – Detailed Plan

Scope: Implement OneEuro smoothing + controller ID + basic kinematic sanity clamp. Keep change surface minimal & test-first.

Deliverables:

- `src/filters/oneEuro.ts` pure class (no IO) implementing standard OneEuro (minCutoff, beta, dCutoff=1.0, adaptive alpha).
- `src/identity/controllerTracker.ts` mapping incoming hands to stable `controllerId` (e.g. `L0`, `R0`) using greedy nearest distance of wrist (landmark 0) with persistence + time tolerance.
- `src/kinematics/clamp.ts` small utility that rejects or flags frames with impossible wrist jumps (threshold in world units; configurable).
- `scripts/oneeuro-smooth.mjs` → reads raw `.human.landmarks.jsonl`, writes `derived/<basename>.oneeuro.landmarks.jsonl` preserving frame/timestamp.
- Tests:
  - OneEuro: constant input stays constant; ramp input filtered but monotonic.
  - Identity: swapping order of hands between frames preserves IDs.
  - Clamp: synthetic jump flagged; normal motion passes.
  - Parity: smoothed file line count == raw, timestamps identical.

Data Contract (Derived Frame Extension):

```jsonc
{
  "frameIndex": 42,
  "timestampMs": 1400,
  "hands": [
    {
      "handedness": "Left",
      "controllerId": "L0",
      "landmarks": [{"x":0.1,"y":0.2,"z":-0.03}, ...],
      "meta": { "clamped": false }
    }
  ]
}
```

Freezing Rules (Phase 0):

- Do NOT freeze derived outputs until filter + identity behavior declared stable (after initial review cycle).
- Once stable, extend manifest to include derived hashes under `derived.oneEuro` (additive).
- Never overwrite existing derived freeze directories; treat them versioned parallel to raw.

Kinematic Clamp Heuristic (Initial):

- Compute Euclidean delta of wrist landmark vs previous frame (same controllerId).
- If delta > `maxWristDelta` (start with 0.15 normalized units) mark `meta.clamped=true` and either (a) copy previous position or (b) flag for downstream ignore (choose strategy A for simplicity initially).

Controller Identity Strategy:

1. For first frame: assign IDs based on handedness ordering (Left → L0, Right → R0).
2. For each subsequent frame: compute distance matrix between current wrists and last-known wrists; greedily match minimal distances below `swapThreshold` (start 0.10). If both distances exceed threshold, treat as new (not expected in current videos—log warning).
3. Maintain last seen timestamp for each controller; if gap > `staleMs` (e.g. 1000ms) allow re-assignment.

OneEuro Parameter Defaults:

- `minCutoff = 1.0` (adjust later), `beta = 0.0` initially (then tune), `dCutoff = 1.0`.
- Use per-axis filter instance per landmark coordinate (x,y,z) to keep code simple; optimize later.

Testing Strategy Recap:

- Unit tests for math & identity.
- Integration test: run smoothing on a short raw trace fixture → assert parity + stable IDs.
- Golden verify remains on raw only for now.

Future Hooks (Preview):

- Phase 1 will consume smoothed OR raw (flag-controlled) to derive pinch metrics: distance thumb tip ↔ index tip, velocity, hysteresis thresholds (onThreshold > offThreshold).
- Palm gating: compute palm normal; only allow pinch ON if palm orientation criteria satisfied (reduces accidental triggers when hand side-on).

Predictive TOI (Coming Later):

- Fit linear model to recent approach velocity of finger pinch distance; project crossing time of ON threshold; trigger early if confidence > threshold.
- Provide metrics: `predictedLeadMs`, `confidence`.

Quantization (Later Phase):

- Map event (actual or predicted) to nearest musical grid line considering swing / groove; supply both raw and quantized timestamps.

Working Style Reminder:

- SMALL SLICES: Implement OneEuro class + tests → commit → review → next file.
- Always run: `npm run verify && npm test` after each slice; only run extraction if raw logic changed (not expected in Phase 0).
- Do not freeze derived yet.

Phase 0 Exit Checklist (Must be ALL true):

- [ ] OneEuro filter implemented & unit tested.
- [ ] Identity tracker implemented & tested with order swap scenario.
- [ ] Clamp utility implemented & tested for jump flagging.
- [ ] Smoothing script produces derived JSONL identical timestamps & count.
- [ ] Readme updated (this section) – (DONE).
- [ ] CI passes with new tests.
- [ ] Decision made to (freeze / not freeze) derived outputs.

After exit → proceed to Phase 1 (Pinch Event Engine).
