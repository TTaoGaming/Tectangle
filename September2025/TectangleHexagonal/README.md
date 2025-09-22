<!--
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
- [ ] Re-evaluate this artifact against current Hexagonal goals
- [ ] Ensure onboarding guidance is still accurate
- [ ] Log decisions in TODO_2025-09-16.md
-->

# Tectangle Hexagonal

A hexagonal-architecture pinch input demo (index–thumb) with predictive TOI, palm gating, and deterministic test pages.

<!-- WEBWAY:ww-2025-049: UI Canon (Material Design 3) active for v4+ demos; legacy pages must be marked LEGACY_UI until migrated. -->

## UI Canon: Material Design 3 (M3)

- Canon baseline: v4 page `dev/demo_fullscreen_sdk_v4_material.html` imports `dev/design/m3.tokens.css` and uses `--m3-*` vars.
- Automation (CI):
  - Token schema/vars: `npm run -s hex:design:tokens`
  - UI canary: `npm run -s hex:design:canary` ensures active dev pages either use M3 tokens and include `WEBWAY:ww-2025-049` or are explicitly tagged `LEGACY_UI`.
  - Visual audit: `npm run -s hex:design:audit` runs Puppeteer smoke for v4 and uploads visuals.
- Marking legacy: add a top-of-file comment `<!-- LEGACY_UI: to migrate to M3 tokens -->` to dev pages not yet migrated.
- Revert path: remove WEBWAY markers, delete `dev/design/*tokens*`, `scan_ui_m3_canon.mjs`, and CI step.

## Structure
- Core (pure): `src/core/*`
- Ports: `src/ports/*`
- Adapters: `src/adapters/*`
- UI helpers: `src/ui/*`
- Demos: `dev/*`
- Tests: `tests/*`


## External Libraries
- State machines: src/ports/xstatePort.js wraps xstate for hex-friendly imports.
- Material components: src/ui/materialWeb.js registers @material/web elements on demand; call preloadMaterialDefaults() before rendering complex UI.
- Window manager: src/ui/winBoxHost.js lazy-loads WinBox and injects the default stylesheet for floating tool panes.

## Run
- Static serve anywhere (Chrome):
  - Windows PowerShell:
    - Start server (example): `npx http-server . -p 8080`
    - Open: `http://127.0.0.1:8080/September2025/TectangleHexagonal/dev/toi_demo.html`
- Demos accept query:
  - `?video=/tests/clip.mp4` or `?mock=1`
  - `?process=frame&stepMs=60` for deterministic runs
  - `?enter=0.5&exit=0.8&palm=1&cone=30`

## Tests
- Unit: `npm run hex:test:unit` (deterministic wrists, pinch core, telemetry scaffolds)
- E2E (jest-puppeteer):
  - Set port to avoid conflicts:
    - PowerShell: `$env:E2E_PORT='8097'; npm run test:e2e`
  - Uses toi_demo deterministic signals (`__processingDone`, `__analysisLines`)
  - Option C fallback: tests attempt real MP4 first; if frames ≤ 25 after ~10s, they restart in deterministic simulator mode (`process=frame&stepMs=60&durMs=12000`). In simulator mode, assertions require ≥ 120 frames; otherwise ≥ 25.
  - Env knobs: `USE_SIM=1` forces simulator; `NO_PINCH_CLIP` overrides the default hand‑ID clip; `E2E_PORT` selects the server port.

Progress (2025-09-18, WEBWAY:ww-2025-061)

- Tests now derive base URL from SITE_BASE/E2E_PORT/E2E_HOST; avoid hardcoded :8080.
- Golden clip paths referenced as absolute to eliminate relative resolution issues under /dev.

### Legacy / Skipped Specs

- `controller_router_lockin.test.js` (LEGACY, skipped 2025-09-16): superseded by integrated console P1/P2 lock-in test while minimal `router_min_lab.html` harness is under reconstruction. Re‑enable only after router_min_lab reliably emits pinch events (remove `describe.skip`).


### E2E helper utilities

- `tests/e2e/helpers/hexPage.js` centralizes Puppeteer wiring so every spec captures the same `hex-pinch` events (no ad-hoc globals).
- Call `installRecorder(page)` before navigation and `ensureRecorder(page)` immediately after `page.goto(...)` so listeners are live before the clip auto-plays.
- `waitForPinchDowns(page, expected, timeoutMs)` throws with a quick snapshot (`downs=..., controllers=...`) when it times out, which makes MediaPipe flake triage less mysterious.
- The shared timeout default is `45s`; feel free to override in individual specs once your lab rig is stable.
### Headed-only guidance (repo policy)

- Prefer headed (non-headless) for MP4/MediaPipe e2e. Headless often produces no detections due to codec/permission limits.
- This repo’s jest-puppeteer launches Chromium with a dev server; for fewer flakes, run locally and keep the browser visible.
- If you must run headless:
  - Force simulator: in PowerShell
    - `$env:USE_SIM='1'; npm run test:e2e`
  - Or pass deterministic page params (`?process=frame&stepMs=60&durMs=12000`).
  - Increase jest timeouts if needed (JEST_PUPPETEER_CONFIG).

## Multiplayer


Run the controller router lab (headed)

## Integrated Hand Console (Prototype)

  - V7 (unified overlay + panels, experimental): `dev/integrated_hand_console_v7.html` (enable `FEATURE_HAND_CONSOLE_VM` + optional `FEATURE_HAND_CONSOLE_V7`). Provides canvas overlay + structured signal grid via unified ViewModel (WEBWAY:ww-2025-008). Usage: serve repo, open page, click Camera or supply `?clip=...&autostart=1`.
  1. Serve repo (e.g. `npx http-server . -p 8091`).
  2. Open: `http://127.0.0.1:8091/September2025/TectangleHexagonal/dev/integrated_hand_console.html`
  3. Click "Start Camera" (or play sample MP4) and perform a pinch with the hand you want to claim P1.
  - 2025-09-16 Refocus: orientation & flexion now visible pre‑P1 claim (no pinch latch); palm gate toggle applies runtime via `handSessionManager.updatePinchConfig`.
  - WEBWAY:ww-2025-008: Unified Hand Console ViewModel behind `FEATURE_HAND_CONSOLE_VM` consolidates pinch/orient/flex/vel/seats aggregation for V4–V6 (revert by removing flag & `createHandConsoleViewModel.js`).

V11→V12 status (WEBWAY:ww-2025-026)

- V11 is now FROZEN as a stable research console; V12 is ACTIVE and currently mirrors V11 markup while we iterate under flags.
- Open pages:
  - V11 frozen: `dev/integrated_hand_console_v11.html`
  - V12 active: `dev/integrated_hand_console_v12.html`
- Rich per-seat fields (post-lock, per frame): `norm`, `rawNorm`, `velocity`, `acceleration`, `palmAngleDeg`, `jointAngles.index.{mcpDeg,pipDeg,dipDeg}`, `historyLen`.
- Exporter (JSONL): `npm run hex:export:rich` writes `September2025/TectangleHexagonal/out/enriched.v11.jsonl` and a `*.summary.json`. Guard: `npm run hex:guard:rich`.

Planned Enhancements:

### V8 (Rich Telemetry Scaffold) – WEBWAY:ww-2025-012 & ww-2025-013

Status: Experimental. Adds per-seat live velocity, palm angle, smoothed vs raw tip gap plus optional rich frame export.

Page: `dev/integrated_hand_console_v8.html`

Serve then open (example):
  <https://127.0.0.1:8080/September2025/TectangleHexagonal/dev/integrated_hand_console_v8.html>

Usage:

1. Page auto-injects flags: `FEATURE_HAND_CONSOLE_V8`, `FEATURE_RICH_TELEM_V1`.
2. Enter or accept default MP4 path (dual‑hand stationary → R pinch hold → L pinch hold) in the clip box.
3. Click "Start Clip" to play through; P1 claims on first pinch:down, P2 on second.
4. Live seat cards show norm, velocity, palm angle as frames stream.
5. Tuning: adjust thresholds in legacy demo or (upcoming) call `appShell.updatePinchConfig({ enterThresh:0.42 })` in console.

Rich Programmatic Capture:

Inside a page context (e.g., automation harness) call:

```js
window.FEATURE_RICH_TELEM_V1 = true;
__hex.processVideoUrl('September2025/TectangleHexagonal/videos/two_hands_stationary_right_then_left_index_pinch_hold_1s_v1.mp4')
  .then(r => console.log('rich frames', r.rich && r.rich.frames.length, r.rich.frames.slice(0,4)));
```

Returned each frame (if flag): `{ t, hand, state, norm, rawNorm, gate, palmAngleDeg, velocity, acceleration, toiPredAbsV, toiPredAbsA, toiActualStopAbs, smoothed:{ indexTip, thumbTip }, raw:{ indexTip, thumbTip } }`.

Revert Path:
Remove: V8 HTML file, flag injections, `FEATURE_RICH_TELEM_V1` references, and webway scaffold notes `scaffolds/webway_ww-2025-012-hand-console-v8.md` & `WEBWAY:ww-2025-013` markers.

Upcoming:

- Joint angle integration (index & thumb flexion) into rich frames
- Per-hand OneEuro live preset apply via shell update API
- Seat-stable landmark smoothing parameter sweeps & export

### Predictive Lookahead Triad (proposal) — WEBWAY:ww-2025-028

Goal: Achieve robust, low-latency pinch with multiple redundant predictors, following a V-Model engineering approach (design→verify; integrate→validate) and Saturn/NASA mindset.

- Physics predictor: derive onset by modeling fingertip approach with kinematics (v, a, jerk) over index↔thumb distance; estimate TOI via motion equations and threshold crossing.
- Biomechanical predictor: track finger joint angle velocities (index MCP/PIP/DIP, thumb IP/CMC when available) and wrist orientation; detect plausible flexion patterns toward contact.
- Musical quantization predictor: snap speculative events to rhythmic subdivisions (e.g., 1/8, swing) for stability in musical contexts; applied only when a tempo grid is provided.

Consensus & Postmortem:
- Fuse predictors with weighted confidence; emit speculative downs with bounded EMA; record predicted vs actual timestamps and errors to JSONL for offline tuning.
- Postmortem tool: compute per-clip TOI error distributions and cancel rates per predictor; output comparative plots/tables.

Current pieces in repo: per-frame norm/vel/accel, palmAngleDeg, index angles; exporter (`hex:export:rich`); replay/validators; sidecar diagnostics. Next: add angle velocity, jerk, and quant grid hooks behind flags.

V12→V13 UI standardization (WEBWAY:ww-2025-029)

- V12 is FROZEN. V13 is now FROZEN as the Tailwind-based, responsive UI shell baseline. V14 is ACTIVE and inherits V13 while we iterate research flags.
- Pages:
  - V12 frozen: `dev/integrated_hand_console_v12.html`
  - V13 frozen (Tailwind shell baseline): `dev/integrated_hand_console_v13.html`
  - V14 active (research head): `dev/integrated_hand_console_v14.html`
- Rationale: faster iteration on layout/typography/responsiveness; Tailwind keeps CSS bundle lean and utilities composable; can be compiled locally later if needed.
- Migration plan: port V11 metrics/table and controls into Tailwind components; keep logic identical and behind flags; measure interaction ergonomics on touch devices.

Quick V13 smokes

- Quicker telemetry presence (no strict seat-lock wait):
  - Run: `npm run -s hex:smoke:v13:quick`
  - Env: `SITE_BASE` to change server (default `http://127.0.0.1:8080`), `CLIP` to override default idle clip.
- MP4 enriched validation (seat-lock + per-frame fields with summary JSON):
  - Run: `npm run -s hex:smoke:v13:mp4`
  - Default clip targets two-hands sequence (Right pinch then Left) and asserts both P1 and P2 lock.
  - Env: `CLIP` input MP4, `OUT` summary path (default `September2025/TectangleHexagonal/out/enriched.v13.smoke.summary.json`).

V14 research head

- Page: `dev/integrated_hand_console_v14.html` (active). Inherits V13 logic/UI and introduces gated research flags (angle velocity, jerk, predictor fusion). All new work must keep the two-hands P1→P2 lock-in acceptance invariant green.

Golden videos & smokes

- Prepare canonical goldens (copies into `videos/golden/`):
  - PowerShell:
    ```powershell
    npm run -s hex:videos:prepare-goldens
    ```
- Run golden smokes (headed recommended for reliable MP4 decode):
  - Two-hands pinch (expects P1/P2 lock and rich telemetry):
    ```powershell
    $env:HEADLESS='0'; npm run -s hex:smoke:golden:twohands
    ```
  - Idle (expects no locks):
    ```powershell
    $env:HEADLESS='0'; npm run -s hex:smoke:golden:idle
    ```
  - Both:
    ```powershell
    $env:HEADLESS='0'; npm run -s hex:smoke:golden
    ```
  - Enforced in daily verify:
    ```powershell
    npm run -s hex:verify:daily
    ```
    This runs the hex goldens (headed) and fails on drift (no P1/P2 on pinch, or any lock on idle).

Status note (prototype truth)

- The core concept is working: post-lock per-frame rich telemetry (gap/vel/accel/palm angle/index angles) is present and varies over time. Exporter JSONL validates field presence and change.
- Expect ongoing tuning and occasional bugs as we add angle velocity/jerk, predictor fusion, and responsive UI. Use the flags and revert paths to keep risk scoped.

Exporter and guards

- Export recent clip rich frames (V11 harness) and compute field-change summary:
  - `hex:export:rich` writes JSONL + `*.summary.json` under `September2025/TectangleHexagonal/out/`.
  - Set PowerShell env then run:
    - `$env:CLIP='September2025/TectangleHexagonal/videos/right_hand_palm_left_index_pinch_v1.mp4'`
    - `$env:OUT='enriched.v11.pinch_left.jsonl'`
    - `npm run -s hex:export:rich`
  - Guard: `npm run -s hex:guard:rich` ensures required fields are present across samples.



## Tests (added)

- Controller router core unit: `September2025/TectangleHexagonal/tests/unit/controllerRouterCore.test.mjs` covers P1→P2 assignment and proximity re‑acquire.
- P1/P2 integration test (headed recommended): `September2025/TectangleHexagonal/tests/e2e/p1p2_lockin.test.cjs` loads the lab and asserts two downs map to P1/P2.

1) Generate/validate goldens: `npm run hex:analyze && npm run hex:validate && npm run hex:validate:goldens`
2) Freeze expectations (HFO harness): `npm run hive:freeze:verify`
  - This will replay frozen artifacts and stamp canon.
3) Commit with message: `feat(hex): freeze P1/P2 lock‑in and goldens`

## Troubleshooting

- Port in use: change `E2E_PORT` env
- Short clip hangs: prefer `process=frame` mode
- No confirm: relax thresholds or disable palm gate during tests

## Automation & Quality Gates (WEBWAY:ww-2025-004)

Tiered Hooks

- Pre-commit (fast): cached hex boundary lint (`hex:lint-arch:cached`), focused unit tests (maps changed src files → matching test filenames, falls back to full), soft contract (non-blocking; set `QUICK_CONTRACT=0` to skip).
- Pre-push (full): full boundary lint, full unit suite, strict contract (blocking). Skip only with `SKIP_FULL=1` (avoid habitual use).
- Daily CI: `hex-daily` workflow runs fast verify + full + golden validation + artifact upload (03:15 UTC).

Caching Strategy


Scripts

- `hex:lint-arch` (raw depcruise) — always used in pre-push & daily.
- `hex:lint-arch:cached` — used in pre-commit.
- `hex:verify:fast` / `hex:verify:full` / `hex:verify:daily` — composed pipelines.

Environment Flags

- `FEATURE_TIERED_HOOKS=0`: disable fast path and run legacy full checks on commit.
- `QUICK_CONTRACT=0`: skip soft contract on commit.
- `STRICT_CONTRACT=1`: escalate contract to blocking outside the hooks.
- `SKIP_FULL=1`: (temporary) bypass pre-push full verify.
- `FORCE_HEX_LINT=1`: ignore cache for one run.

Drift Detection

- Daily full run + goldens ensures contract & envelopes stay healthy even if developers use only fast commits.
- Future (planned): weekly trend aggregation (latency, specCancelRate) + golden diff %; monthly stability score.

Revert Path

- Remove WEBWAY markers, delete `.husky/pre-push`, restore original `.husky/pre-commit` block, delete `run_focused_tests.mjs` & caching script.
- Delete `scaffolds/webway_ww-2025-004-tiered-hooks.md`.

Rationale

- Keeps architectural purity always enforced while cutting iterative loop time.
- Soft contract surfaces early anomalies without blocking creativity.
- Daily CI acts as safety net against prolonged silent drift.


- Pattern: Treat Hex ports as seams. Record canonical JSONL (golden/landmarks) and replay deterministically in CI.

- Success envelopes (examples):
  - pinch clip: downs≥1, ups≥1, order: down→up, specCancelRate≤0.10, meanDownLatency 60–400 ms
  - gated clip: downs=0, ups=0
- Replay CLI (page):
  - `node September2025/TectangleHexagonal/tests/replay/replay_page_from_trace.mjs September2025/TectangleHexagonal/dev/index.html HiveFleetObsidian/landmarks/right_hand_normal.landmarks.jsonl`
- Param sweeps: vary enter/exit/cone via URL query `?enter=0.40&exit=0.60&cone=30` and rerun replay to tune.

Telemetry and Watchdog (adapters)

- TelemetryManager (port): builds low-PII envelopes from page hooks and enforces schema before sink.
- WatchdogManager (port): evaluates telemetry against envelopes; returns violations for CI gating.
- Both are scaffolds under `src/ports/*` with unit tests in `tests/unit`.

Tuning (toward 0 ms perceived latency)

- TOI (Time-to-Impact): core estimates predicted TOI from relative speed of index–thumb norm; page records `toi` per frame and last TOI error.
- One Euro knobs: `minCutoff` (more smoothing vs more lag), `beta` (dynamic response to speed), `dCutoff` (derivative filter).
- Playbook:
  1) Enable Speculative; set enter/exit (e.g., 0.40/0.60), cone 30°.
  2) Sweep `minCutoff` 0.8–1.6 and `beta` 0.005–0.030 while watching last TOI error trend → aim near 0 ms.
  3) Confirm envelopes: pinch clip downs/ups present; gated clip 0/0; spec cancel ≤10%; mean down latency 60–400 ms.
- Defaults: minCutoff=1.4, beta=0.020, dCutoff=1.0; enter=0.40, exit=0.60, cone=30°.
- Perceived “zero”: fire UI/audio on speculative down (already wired) and tune to keep TOI error ≈ 0 ms. Increase enter threshold slightly if you see early false downs; widen exit only if stickiness needed.

---
 
## SDK adoption: layered primitives → anchors → TUI (directional)

WEBWAY:ww-2025-031: facade v0 & directional plan — Keep it simple now, extend cleanly later.

Layers you can adopt incrementally:

1. Base — Raw landmarks in, minimal primitives out

- Input: MediaPipe 21 landmarks (0..1), handedness, t.
- Output (per frame): tipGapNorm (index↔thumb), vRel/aRel, palmAngleDeg, isGated, knuckleSpanNorm (EMA+clamps).
- Events: pinch:down/up/confirm/cancel; finger:index:angles; optional wrist:*. Stable via SDK facade (DI-only).

1. Secondary — Absolute measures via knuckle span

- Default assumption: 8 cm ±1.5 for adult index–pinky MCP span.
- Optionally let the user enter/confirm their span during “seat claim” (controller pairing) to personalize cm scaling.
- Available today: abs.distCm in pinchCore; helper `normalizeIndexBoneChain` returns index MCP/PIP/DIP and tipGapCm.

1. Tertiary — Spatial Anchors and Tool UI (TUI)

- Spatial Anchors: bind gestures to world-stable anchors (screen or world coords) for reliable tool manipulation.
- TUI: map gestures to tools and training flows (education, medical, engineering). Goal: one-to-one skill transfer.
- Roadmap: load domain models (incl. CAD) and manipulate with anchored gestures (pinch, drag, rotate), with per-seat calibration.

SDK Facade (v0)

- `HexInput.create({ factories:{ createAppShell } })` → `{ startCamera, startVideoUrl, stop, on, onAction, updatePinchConfig, getRichSnapshot }`.
- Boundary: SDK does not import app layer; use DI or a `window.HexAppShell.create` host shim.

Calibration & Pairing (near-term)

- During seat claim (P1/P2 selection), prompt for a short calibration: confirm knuckle span (cm), quick palm-cone demo.
- Store per-seat calibration; use for abs distances and plausibility checks.

Why this structure

- Base stays cheap and universal; Secondary adds clarity (cm, angles); Tertiary unlocks rich anchored tooling.
- Each layer is append-only and flaggable; revert path is to disable flags/remove the SDK note.

Revert Path

- Remove WEBWAY markers and facade note; consumers can continue using pages/dev harnesses.

Status

- Base and Secondary primitives are live behind the facade and helpers; Tertiary (anchors/TUI) is roadmap-only.

## Silk Scribe Review Log (SRL)

| ID | Date (UTC) | Area | Change | Intent | Revert |
|----|------------|------|--------|--------|--------|
| SRL-2025-09-16-01 | 2025-09-16 | Tests | Mark `controller_router_lockin.test.js` legacy (skipped) | Reduce noise; focus on integrated console harness | Remove `describe.skip` |
| SRL-2025-09-16-02 | 2025-09-16 | Console | Pre-claim visibility for orient/flex + runtime palmGate toggle | Faster tuning & threshold observation | Revert diff in `dev/integrated_hand_console.html` |

| SRL-2025-09-17-01 | 2025-09-17 | Hex/V13 | Freeze V13 (Tailwind shell), add V13 MP4 smoke asserting P1→P2 lock on two-hands clip; spawn V14 | Stable UI baseline; clear acceptance path | Reopen V13 or run smokes against V11 if needed |
| SRL-2025-09-17-02 | 2025-09-17 | Tests/Goldens | Standardize two-hands pinch + idle goldens; add hex-only smokes and daily enforcement | Enforce P1/P2 lock on pinch and 0 locks on idle; detect drift early | Remove golden scripts and verifier; rely on manual runs |

Silk Scribe Notes:

- Scope focus pivot: single authoritative harness = integrated hand console for P1/P2 order during prototype phase.
- Pending (not executed): resurrect minimal router harness or fold its deterministic needs into a replay mode on the console.
- TTL: Reassess legacy skip by 2025-10-01; if still skipped, either delete the file or convert it into a deterministic replay spec.


## Status report (single-pinch readiness)

- Latest analysis: downs=1, ups=1, cancels=0, frames>0; no envelope violations.
- Predicted TOI values present on frames; down event was non-speculative in sample (no predicted TOI on event), which is acceptable for baseline.
- Gate (palm cone + kinematics) behaved; no false triggers in gated trace (per earlier goldens).
- Conclusion: backend is healthy for a solid single-pinch. Safe to drive 1-button outputs.

Next accuracy step (optional, not yet wired): apply a small negative-latency offset to predicted TOI and maintain it with a bounded EMA (see README.calibration.md).

## Planned: Joint-angle plausibility check (not yet implemented)

- Rationale: It’s physically implausible to keep index/thumb perfectly straight while pinching; flexion increases approaching contact.
- Inputs: existing landmarks (wrist, MCPs, index/thumb tips). Add PIP/DIP/CMC if available for higher fidelity.
- Method:
  - Compute finger segment vectors and joint angles (MCP flexion for index, CMC/IP for thumb).
  - Require increasing flexion velocity on approach (for down) and decreasing on release (for up) within a short window.
  - Export a confidence metric to telemetry; use as an optional gate alongside palm cone and velocity direction.
- Status: Design only. No runtime changes yet.

## Try it: wire to a 1‑button game

- Easiest path: embed a simple 1-button web game (e.g., Clumsy Bird fork) in an iframe on the dev page and map Right-hand pinch to the game’s jump key.
- In this app, a pinch already dispatches a KeyboardEvent ('Z' for Right, 'X' for Left). Load the game in an iframe that has focus, or map to the game’s expected key.
- Alternatives: use WebMIDI (already supported) if the game or a small bridge listens to a note-on as “jump.”

Yeah we're going let's go brush your teeth first Come on let's go push it outside That's just two minutes remember two minutes Remember one side 30 seconds the other side and the other side and the other side girl Tectangle • Pinch Piano (Hexagonal)

Overview

- Pure domain core in `src/core/pinchCore.js` (OneEuro smoothing, palm gate, hysteresis FSM, speculative down, optional debounce) with no DOM dependencies.
- Adapters (ports) in `src/ports/*`: MediaPipe (landmarks), WebAudio beep, WebMIDI, Golden recorder.
- UI in `src/ui/*`: HUD + overlay drawing utilities.
- App shell in `src/app/main.js`: wires ports to core(s) and the dev UI.
- Dev page in `dev/index.html`: static HTML you can serve locally.

Quick Start

Quick Start

1. Serve statically from repo root or this folder.
2. Open `http://localhost:8080/September2025/TectangleHexagonal/dev/index.html` (Chrome recommended).
3. Click Start camera; adjust thresholds; use Load video to process an MP4 offline.

Extras

- Serve: `npx http-server . -p 8080`
- Ghost/negative-latency lab: `http://localhost:8080/September2025/TectangleHexagonal/dev/ghost_hysteresis.html` (actual vs ghost rings; telemetry includes Δt enter/exit).
- WEBWAY:ww-2025-003: Hysteresis Tube (ghost tuning): `http://localhost:8080/September2025/TectangleHexagonal/dev/ghost_hysteresis_tube.html` — tune lookahead and confirmation windows with palm-cone gating and a ghost band.
- WEBWAY:ww-2025-003: Hysteresis Tube (ghost tuning): `http://localhost:8080/September2025/TectangleHexagonal/dev/ghost_hysteresis_tube.html` — tune lookahead and confirmation windows with palm-cone gating and a ghost band.
- WEBWAY:ww-2025-005: Parry Sidecar Adapter (feature‑flag integration path) — promote Parry sidecar logic behind `FEATURE_PARRY_ADAPTER` via a hex port adapter and enriched event bus (see `scaffolds/webway_ww-2025-005-parry-adapter.md`). <!-- WEBWAY:ww-2025-005: marker -->

Hand ID Lab

- Demo: `dev/hand_id_lab.html` shows webcam/MP4 on the left and 21-landmark visualization on the right with a simple two-track hand ID (H1/H2) based on nearest wrist + inertia.
- Query: `?src=/path/to/clip.mp4` (or `?video=`) and `?noauto=1` to prevent auto start.
- Exposes hooks: `window.__hex.{ startCam, startVideoUrl, getStats }`.

Renamed clip (crossover annotated): `right_hand_crossover_exit_occlusion_no_pinch_v1.mp4` (was `right_hand_exit_occlusion_reset_no_pinch_v1.mp4`). See `videos/README.md` for manifest details.

### Hand Calibrate Sidecar — First pinch-hold ⇒ U1 (WEBWAY:ww-2025-002)

- Page: `dev/hand_calibrate_sidecar.html`
- Purpose: Lock a controller mapping by intent — the first sustained index pinch-hold claims U1. This runs as a sidecar over the canned prototype and does not depend on Hand ID Lab.
- How to use:
  1) Serve the repo, then open:
     - `http://127.0.0.1:8080/September2025/TectangleHexagonal/dev/hand_calibrate_sidecar.html?src=September2025/TectangleHexagonal/videos/right_hand_pinch_anchor_drag_left_v1.mp4`
     - Or open without query and click “Start MP4” (defaults to the same clip).
  2) During a sustained index pinch-hold (~500ms) the overlay will show `H1 / U1` or `H2 / U1` plus a green U1 pill and wrist ring.
- Notes:
  - Uses the T1 tracker locally in the sidecar, reading landmarks from the prototype’s base iframe seam (`__hexLastHands`).
  - Hand ID Lab is not required; we explicitly stub it by embedding `canned_hand_id_test_prototype.html`.
  - Revert path: delete the page and remove WEBWAY markers.

### Canned Hand ID Test Prototype (T1 Sidecar) (WEBWAY:ww-2025-001)

Purpose: Safely exercise the Tier‑1 wrist+inertia tracker against the proven pinch demo without modifying the core page.

Path: `dev/canned_hand_id_test_prototype.html` — embeds `dev/index.html` in an iframe (left) and runs an independent overlay tracker (right) that polls `window.__hexLastHands` landmarks exposed by the MediaPipe port to validate persistent IDs across occlusions & frame exit/return.

Quick Start:

1. Serve repo: `npx http-server . -p 8080`
2. Open: `http://localhost:8080/September2025/TectangleHexagonal/dev/canned_hand_id_test_prototype.html`
3. Click “Start Camera (iframe)” then perform: slow cross, occlusion (one hand covers other), leave frame & re-enter.

Displayed Stats:

- Frames: processed landmark frames
- Teleports: large wrist jumps (> teleport threshold ≈0.42)
- Reassigns: confirmed label flips after labelConfirmMs
- Alive: active track count (≤2)

Why iframe? Acts as a sidecar harness (hexagonal port observer) → zero risk to existing pinch pipeline; easy revert (delete the lab page) and enables future A/B (legacy vs new ID) diff.

Revert: Remove feature flag usage and `dev/canned_hand_id_test_prototype.html` plus WEBWAY markers; core pinch path unaffected.

Next (planned): Param knobs (maxJump, teleport, memoryMs) + dual-run comparator to show divergence vs legacy `hand_id_lab`.

Hand/Controller ID tiers

- Tier 1 (default, shipped): Nearest‑neighbor + inertia + side prior. Assigns stable `handId` (H1/H2) using wrist distance with a max‑jump and short occlusion memory (≈200 ms), biased by screen‑space left/right. Wire `handId → controllerId` in `src/adapters/hand_event_router.mjs` (e.g., Left→P2, Right→P1; overridable).
- Tier 2 (upgrade, planned): Biomechanical fingerprint from gesture‑invariant features (bone‑length ratios, palm span) captured during a palm‑open calibration. Use cosine similarity to re‑identify a hand after long occlusions or crossings. Adds confidence, no new deps.
- Test it: `tests/e2e/hand_id_lab.test.js` expects 0/0 pinches, low teleports/reassigns on a no‑pinch crossover clip; page self‑times out (`maxMs`) so runs won’t hang.

Working now (2025‑09‑14)

- Ghost Predictive Pinch Dino demo: `dev/ghost_predictive_pinch_dino.html` bridges ghost down/up → Space in BSD‑3 Dino. Verified locally.
- MP4 e2e smoke harness injects `?noauto=1&src=<mp4>` and page timeout; short clips finish promptly. Counts now include ghost: `{ downs, ups, gdowns, gups }`.
- Clip `right_hand_palm_facing_camera_index_pinch_v1.mp4` yields 1/1 (actual) and 1/1 (ghost); golden saved under `out/`.

Known gaps

- dEnterMs/dExitMs are 0 for this clip (ghost and actual cross on same frame); need more aggressive lookahead for measurable negative latency.
- No postMessage from ghost page; iframe bridge observes DOM counters (simple, but brittle). Low‑risk improvement: emit `pinch-key` messages.

Automated MP4 → Frames → JSONL (CI-safe)

- Why: Avoid headless H.264/COOP/COEP/CDN issues by processing image frames deterministically.

- Inputs live under `videos/`:
  - MP4 samples: `videos/right_hand_normal.mp4`, `videos/right_hand_gated.mp4`
  - Frame folders (PNG):
    - `videos/right hand hand oriented towards the camera and wrist to middle knuckle pointing up index to thumb pinch/`
    - `videos/right hand palm oriented to my left index and thumb pinch should be GATED/`

- Outputs: `out/` in this package (`September2025/TectangleHexagonal/out`).

Run (frames → JSONL)

- Pinch:
  - PowerShell: `$env:LABEL='pinch'; node tests/smoke/run_video_collect_golden.js "September2025/TectangleHexagonal/videos/right hand hand oriented towards the camera and wrist to middle knuckle pointing up index to thumb pinch"`

- Gated:
  - PowerShell: `$env:LABEL='gated'; node tests/smoke/run_video_collect_golden.js "September2025/TectangleHexagonal/videos/right hand palm oriented to my left index and thumb pinch should be GATED"`

Run (MP4 → JSONL)

- `node tests/smoke/run_video_collect_golden.js "September2025/TectangleHexagonal/videos/right_hand_normal.mp4"`
- Notes: MP4 path may require system Chrome or WebM for CI; frame path is preferred for automation.

What gets recorded

- Golden JSONL (`*.jsonl`): per-frame `{ t, norm, state, gate }` only. Note: event lines are NOT persisted here by default.
- Landmarks JSONL (`*.landmarks.jsonl`): per-frame `{ t, hand, wrist, indexMCP, pinkyMCP, indexTip, thumbTip }` (5 keypoints used by the core).
- Analysis JSONL (`analysis.*.jsonl`): produced by replay; contains frames plus `event` rows (`down/up`) and timing fields for validation.

Architecture Invariants

- Events: `pinch:down`, `pinch:hold`, `pinch:up` (shape `{type, t, speculative?, dur?}`) emitted by the core.
- Headless replay: `replayGolden(frames)` in `main.js` and `window.__hex.replayGolden` remain stable.
- Golden JSONL: first line `{meta}`, subsequent frames include `t`, `norm`, `state`, `gate`. Event rows are materialized in `analysis.*.jsonl` after replay, not in goldens.

What’s Implemented

- Per-hand cores (Left/Right) with OneEuro filter per channel, palm cone gating, kinematic plausibility, enter/exit hysteresis.
- Defaults tuned to enter=0.40, exit=0.60; update via sliders.
- Debug panel (per hand): index/thumb raw vs smoothed coords, norm (raw/sm), palm angle, gate, hysteresis bar (solid enter tick, dashed exit tick).
- Video-file processing in the browser; golden JSONL collection.

Next Steps (from Consolidated report goals)

- Enforce enter/exit debounce ms across transitions (config fields are already present in core).
- Add KF/EMA TOI option (`enableKF`) and expose as a toggle.
- Add error UX around MediaPipe loads; allow local model bundling for offline demos.
- Persist per-hand calibration spans to `localStorage` and honor them in the core config.
- CI golden replay: wrap Puppeteer runner to gate PRs on golden envelopes (downs/ups order, spec cancel %, latency bands).

Truth: artifacts and validations (what to trust)

- Goldens (`out/*.jsonl`) carry frame states and gate; use them for deterministic inputs and state inspection.
- Events and timing live in `out/analysis.*.jsonl` generated via replay; use these for envelopes (downs/ups order, TOI error, cancel rate).
- NPM helpers:
  - `npm run hex:analyze` → make `out/analysis.right_hand_normal.jsonl`
  - `npm run hex:validate` → check envelopes on the analysis file
  - `npm run hex:validate:goldens` → sanity-check pinch vs gated golden clips
  - `npm run hex:assert:docs` → assert README claims vs current `out/pinch.jsonl`

TOI (Time-to-Impact) plan — predicted vs actual

- Predicted TOI (now): estimated from relative speed/accel of index↔thumb distance; available during approach.
- Actual TOI (needed): post‑event estimate when fingertips stop approaching (velocity crosses zero / reverses); compute per down→up cycle.
- Negative latency offset: apply bounded EMA over (actual − predicted) to bias speculative downs by ~30 ms while keeping cancel rate ≤ 10%.
- Per‑finger calibration: metronome‑guided captures per finger to tune One‑Euro (`minCutoff/beta/dCutoff`) and TOI offset per user/device.

Pieces: what exists vs what to add

- Exists
  - Core: `src/core/pinchCore.js` (distance ratio + hysteresis, One‑Euro smoothing, palm cone gate, speculative down stub)
  - Replay harness: `tests/replay/*` (landmarks→analysis, validators)
  - Telemetry/Watchdog ports (scaffolds) + unit test
  - Dev page hooks: `window.__hex.replayLandmarks(frames)`, `__getAnalysis()`, `__getTelemetry()`
- Add
  - Actual TOI estimator: detect zero‑crossing/reversal of approach velocity to timestamp contact
  - Speculative offset controller: bounded EMA/KF producing a safe negative latency bias
  - Metronome calibration harness: guided capture + persistence (localStorage) per hand/finger
  - Per‑event telemetry fields: `toiPred`, `toiActual`, `toiErr`, `speculative?`, `latencyMs`
  - Config persistence: per‑hand thresholds and One‑Euro knobs; import/export
  - CI gates: fail if TOI abs error > 20 ms, spec cancel rate > 10%, down/up order violated

Tuning playbook (quick)

1) Generate analysis from landmarks (pinch/gated). Validate envelopes.
2) Set enter/exit (e.g., 0.50/0.80), cone 30°. Enable Speculative.
3) Sweep One‑Euro: `minCutoff` 0.8–1.6, `beta` 0.005–0.030; aim mean TOI error ≈ 0 ms.
4) Apply small negative offset (≈30 ms) if cancels remain ≤10%.
5) Re‑validate pinch (downs/ups present) and gated (0/0) envelopes.

---

Deterministic Replays (CI-friendly)

- Landmark traces: `out/*.landmarks.jsonl` (per-frame `t`, `hand`, and 5 key landmarks)
- Core replay (deterministic):
  - Use your own harness or page hook `window.__hex.replayLandmarks(frames)` to drive the core with recorded landmarks.
- Page replay (deterministic wiring; no MediaPipe/video):
  - `npx http-server . -p 8080`
  - `DEMO_URL=http://localhost:8080/September2025/TectangleHexagonal/dev/index.html node tests/replay/replay_page_from_trace.cjs tests/landmarks/right_hand_normal.landmarks.jsonl`

CI

- Workflow: `.github/workflows/pinch-ci.yml`
  - Installs Node tools (http-server, puppeteer)
  - Serves the dev page
  - Runs frames → JSONL for both `pinch` and `gated`
  - Optionally replays core from `out/*.landmarks.jsonl`
  - Uploads `September2025/TectangleHexagonal/out` artifacts

  ## Wrist Orientation (Planar) (WEBWAY:ww-2025-007)

  Purpose

  Provide a pure, per-hand planar wrist orientation signal (0–360°) derived from the vector wrist→indexMCP with both raw and smoothed (EMA) angles plus cardinal buckets (UP/RIGHT/DOWN/LEFT) for low-cost downstream mapping (game events, telemetry) while gated by `FEATURE_WRIST_ORIENT_V1`.

  Event Contract

  `wrist:orientation` events:

  ```js
  {
    type: 'wrist:orientation',
    t,                 // frame timestamp
    angleDeg,          // raw angle 0–360
    smoothAngleDeg,    // EMA-smoothed angle
    bucket,            // 'UP' | 'RIGHT' | 'DOWN' | 'LEFT'
    flags: { up,right,down,left }, // convenience booleans
    handKey            // internal hand identifier
  }
  ```

  Integration

  - Constructed per hand inside `handSessionManager` when flag enabled.
  - `gameEventBridge` (if active) reads latest bucket to annotate action events.
  - Demo: `dev/wrist_orientation_demo.html` visualizes raw vs smooth, arrow, bucket color.

  Smoothing

  - EMA on unit direction vector (default alpha 0.25) then atan2; avoids 359→0 wrap jump.
  - Tune by passing `smoothAlpha` in core creation (future UI knob planned).

  Usage Example

  ```js
  appShell.onEvent(ev => {
    if(ev.type === 'wrist:orientation' && ev.bucket === 'UP') {
      // e.g. prepare jump charge
    }
  });
  ```

  Feature Flag

  - Enable with environment: `FEATURE_WRIST_ORIENT_V1=1`.
  - Disabled → no orientation events (consumers must treat optional).

  Testing

  - `wristOrientationCore.test.mjs` (bucket transitions & suppression)
  - `wristOrientationSmoothing.test.mjs` (EMA behavior)
  - `wristOrientationDemoHarness.test.mjs` (independent instances)

  Revert Path

  - Delete `src/core/wristOrientationCore.js`, demo page, tests, and orientation branches in `handSessionManager`, `appShell`, `gameEventBridge`.
  - No golden/schema changes required (pinch unaffected).

  Planned Extensions

  - Quaternion pitch/roll variant behind `FEATURE_WRIST_ORIENT_3D`.
  - Angular velocity (`wrist:orientationVel`) for flick gestures.
  - Dwell histograms per bucket (telemetry) and adaptive alpha.

  Rationale

  - Early directional semantics without 3D math; mirrors pinch core purity for easy testing & safe flag-gated rollout.






## Game Bridge Macro Profiles (2025-09-16)

The game bridge now loads pluggable macro profiles (see `docs/game_bridge_profiles.md`). Swap mappings by passing `profile` options when creating the shell, or register custom profiles via `registerGameProfile`. AppShell captures per-profile telemetry when `FEATURE_SEAT_TELEM_V1` is enabled so arcade harnesses can inspect seat/action rates.
