<!--
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
- [ ] Re-evaluate this artifact against current Hexagonal goals
- [ ] Log decisions in TODO_2025-09-16.md
-->

# Tectangle Hexagonal — Agent Runbook

Purpose

- Keep the hex boundaries intact (core, ports, adapters, UI)
- Make tests deterministic and CI-friendly

Map (one line)

- Core (pure domain): `src/core/*`
- Ports (I/O): `src/ports/*` (MediaPipe, latency, analysis)
- Adapters (glue): `src/adapters/*` (e.g., hand_event_router)
- UI: `src/ui/*`
- App/Dev: `dev/*` (demos), `tests/*` (replay, e2e)

Quick start

- Serve (dev): http-server anywhere (8080/8081/8091 ok)
- Demos: `September2025/TectangleHexagonal/dev/*.html` (supports `?video=...`, `?mock=1`, `?process=frame`).

Versions

- V11 (frozen research console): `dev/integrated_hand_console_v11.html` — stable for puppeteer and exporter sampling.
- V12 (frozen): `dev/integrated_hand_console_v12.html` — snapshot of V11 with banner.
- V13 (active UI standardization): `dev/integrated_hand_console_v13.html` — Tailwind shell with the same data path; target smartphones/Chromebooks/tablets.
   - Status: frozen as baseline for UI shell and enriched seat-lock telemetry.
- V14 (research head): will inherit V13 and carry angle dynamics/predictor fusion work.

Testing

- Unit (hex only): `npm run hex:test:unit` (controller router concurrency tests now use deterministic wrist fallbacks)
- E2E (jest-puppeteer): `E2E_PORT=8097 npm run test:e2e` (Windows PowerShell: `$env:E2E_PORT='8097'; npm run test:e2e`)
- Deterministic page signals: `window.__processingDone`, `window.__analysisLines`, `window.__summary`
- Helper: `tests/e2e/helpers/hexPage.js` keeps Puppeteer specs aligned (`installRecorder`, `ensureRecorder`, `waitForPinchDowns`). Timeouts now echo `downs`/`controllers` so you instantly see when MediaPipe failed to produce detections.

V13 quick smokes (developer loop)

- Quick telemetry presence (no strict seat-lock wait):
  - `npm run -s hex:smoke:v13:quick`
  - Env: `SITE_BASE` to point to your local server (default `http://127.0.0.1:8080`), `CLIP` to override idle clip.
- MP4 enriched validation (waits for seat lock, samples enriched, writes summary JSON):
  - `npm run -s hex:smoke:v13:mp4`
  - Default uses two-hands sequence (Right then Left pinch) and asserts both P1 and P2 lock.
  - Env: `CLIP` input MP4, `OUT` summary path (default `September2025/TectangleHexagonal/out/enriched.v13.smoke.summary.json`).

Exporting rich telemetry

- JSONL exporter: `npm run -s hex:export:rich`
   - Env: `CLIP` (video path), `OUT` (filename), optional `SITE_BASE` (default `http://127.0.0.1:8080`)
   - Output: `September2025/TectangleHexagonal/out/*.jsonl` + `*.summary.json`
- Guard check: `npm run -s hex:guard:rich` (per-field presence smoke)
   - Note: Exporter currently uses the V11 harness for stability. V13 smokes above validate the same enriched fields through the Tailwind shell.

Golden videos & drift detection

- Prepare standardized golden MP4s (copies under `videos/golden/`):
   - `npm run -s hex:videos:prepare-goldens`
- Golden smokes (headed recommended):
   - Two-hands pinch acceptance (locks P1 and P2, enriched present): `npm run -s hex:smoke:golden:twohands`
   - Idle negative (no locks): `npm run -s hex:smoke:golden:idle`
   - Both: `npm run -s hex:smoke:golden`
- Outputs are written under `September2025/TectangleHexagonal/out/*.summary.json`; wire into freeze verification as needed.
 - Enforcement: included in `npm run -s hex:verify:daily` via `hex:goldens:headed`—fails on drift (missing P1/P2 on two-hands or any lock on idle).

Triple-check predictors (proposal)

- Physics: predict TOI from distance/velocity/acceleration; add jerk.
- Biomechanical: index MCP/PIP/DIP (and thumb when available) angle velocity signatures.
- Musical quantization: optional tempo grid to stabilize speculative downs in rhythmic contexts.
- Fuse with weighted confidence; log predicted vs actual times to JSONL; postmortem tools compute error distributions.

E2E Option C (real MP4 first → simulator fallback)

- Strategy: tests try to acquire frames from the real MP4 for up to ~10s; if frames ≤ 25, they restart with the deterministic simulator (`process=frame&stepMs=60&durMs=12000`).
- Assertions: if simulator used, require ≥ 120 frames; else require ≥ 25. This avoids headless decode flakes while still exercising real assets when available.
- Env knobs:
   - `USE_SIM=1` forces simulator from the start.
   - `NO_PINCH_CLIP=<relative path>` overrides the default hand‑ID clip.
   - `E2E_PORT` chooses the server port.

Renamed clip (crossover annotated)

- `right_hand_exit_occlusion_reset_no_pinch_v1.mp4` → `right_hand_crossover_exit_occlusion_no_pinch_v1.mp4`
- Update any references to the new name. Manifest in `videos/README.md` updated.

Flake guards

- E2E server uses `E2E_PORT||PORT||8091`; `usedPortAction: 'kill'`
- Videos: prefer `process=frame&stepMs=60` for reproducible results
- Disable palm gate in tests unless explicitly verifying gating

Multiplayer prep

- Adapter: `src/adapters/hand_event_router.mjs` re-emits seat-scoped events (P1/P2)
- Next: forward `hand`/`handId` from ports to router, then bind seats to consumers

Calibration sidecar (WEBWAY:ww-2025-002)

- Harness: `dev/hand_calibrate_sidecar.html` embeds the canned prototype and assigns U1 to the first hand that holds an index pinch for ~500 ms.
- Visual confirmation: overlay label shows `H?/U1`, plus a green U1 pill and wrist ring on the mapped hand.
- Use in tests: Prefer MP4-first, then simulator fallback if decode is flaky. Assert that `window.__hex.getU1Mapping()` becomes `H1` or `H2` within a timeout.
- Revert: remove the page/markers if this flow is not desired.

Troubleshooting

- Port in use on CI: choose a new `E2E_PORT`
- Short clip hangs: use `process=frame` + wall timeout (toi_demo handles this)
- No confirm: check thresholds (`enter`, `exit`) and `palm` gate

## Pinch Piano (Hexagonal) — Extended Agent Guide

Purpose

- This is the single source of truth for AI agents working on the hexagonal pinch app in this repository. The repo has many projects; scope your changes to this folder unless the task explicitly spans others.

Vision / North Star

- Deliver a reliable, palm-gated index+thumb pinch input primitive with low latency and predictable behavior, validated by golden-master traces and basic telemetry envelopes. Keep the domain core pure and adapters thin.

Architecture

- Core (pure, no DOM): `src/core/pinchCore.js`
  - OneEuro smoothing per scalar, hysteresis FSM (enter/exit), optional debounce, palm-gate cone, kinematic plausibility check, speculative TOI.
  - Emits events: `pinch:down`, `pinch:hold`, `pinch:up`, `pinch:cancel`.
- Ports (adapters): `src/ports/*`
  - `mediapipe.js` (Hands landmarks), `audio.js` (WebAudio beep), `midi.js` (WebMIDI), `goldenRecorder.js` (JSONL export).
- UI utilities: `src/ui/*` (`hud.js`, `overlay.js`)
- App shell: `src/app/main.js` (wires ports↔core, exposes dev hooks)
- Dev page: `dev/index.html`

Dev Hooks / Invariants

- Window hooks: `window.__hex.{ startCamera, startVideoFile, stop, applyConfigToCores, replayGolden, cores }`
- Golden accessors: `window.__getGolden()`, `window.__getTelemetry()`
- Golden JSONL schema: first line `{meta}`, subsequent lines may contain `t`, `norm`, `state`, `gate`, `event`, `hand`, `spec`.
- Keep event names and hook shapes stable. If you refactor, preserve these or provide shims.
- Replay invariants: `window.__hex.replayLandmarks(frames)` must accept landmarks JSONL frames and produce the same envelopes as live.

Run Locally

- Serve statically (Chrome recommended): `npx http-server . -p 8080`
- Open: `/September2025/TectangleHexagonal/dev/index.html`
- Load video files via the UI or `startVideoFile(file)`.

Golden Generation (Automated)

- Use `tests/smoke/run_video_collect_golden.js` with `DEMO_URL` pointing to the hex dev page:
  - `DEMO_URL=http://localhost:8080/September2025/TectangleHexagonal/dev/index.html node tests/smoke/run_video_collect_golden.js path/to/video.mp4`
- Outputs: `tests/out/video_golden.jsonl` and console telemetry.

Backlog (near-term)

1) Per-hand calibration + display
   - Show span(px), span(cm), px/cm ratio; add manual per-hand span knobs; persist to localStorage.
   - Annotate hysteresis in px and cm for current span.
2) Palm-cone meter per hand
   - Arc gauge green when in cone, gray/red otherwise; duplicate gate status.
3) Controller IDs (identity stability)
   - Persistent Controller 1/2 assignment using nearest-neighbor on wrist with jump limits and short occlusion memory.
4) Debounce enforcement
   - Honor `enterDebounceMs`/`exitDebounceMs` in the FSM transitions.
5) Optional TOI KF
   - Add a simple Kalman/EMA option for TOI; keep speculative path as default.
6) CI golden envelopes
   - [Done] Add replay workflow `.github/workflows/pinch-ci.yml` that runs deterministic core/page replays.
   - Next: add strict envelopes per trace (downs/ups counts, latency bands) and fail PRs on violation.

CI Details

- Runs on PRs touching hexagonal app/tests.
- Steps:
  - Install Node tools
  - Serve dev page
  - Core replay (deterministic)
  - Page replay (deterministic)
  - Upload `tests/out` for inspection
- Extend by tightening envelopes as traces evolve.

Record–Replay / Parity

- Always prefer frames→JSONL replays for determinism. Use `replayLandmarks` for core/page parity.
- Parity rule: live webcam with same config must not violate golden envelopes beyond tolerance.
- TelemetryManager composes envelope snapshots; WatchdogManager asserts them in CI.

Tuning defaults (target 0 ms perceived)

- OneEuro: minCutoff=1.4, beta=0.020, dCutoff=1.0.
- Hysteresis: enter=0.40, exit=0.60; Speculative enabled; cone=30°.
- Use HUD Predicted TOI and TOI error; aim for |error|<10 ms on pinch clip; gated clip 0/0.

Guardrails

- Keep the core pure and side-effect free. Do not couple DOM into `src/core`.
- Maintain dev hooks and golden schema.
- When changing thresholds or algorithm behavior, update/readme and refresh goldens.
- Prefer small, testable steps over broad refactors.

Definition of Done (MVP hardening)

- Two MP4 samples produce stable goldens (one “normal pinch”, one “gated”).
- SpecCancel% < 8% on normal; zero pinch:down on gated clip.
- Debug panels show cone meter, spans, px/cm conversions, and hysteresis annotations.
- CI smoke passes with golden envelopes.

## Automation / Ops (WEBWAY:ww-2025-004)

Tiered Quality Gates

- Pre-commit: cached boundary lint, focused tests, soft contract (warn only). Goal: <3s when no structural changes.
- Pre-push: full lint + full unit + strict contract (blocking).
- Daily CI (hex-daily): fast verify + full + goldens; publishes artifacts.

Caching

- `hex:lint-arch:cached` hashes config + src file metadata. Invalidate automatically on change or with `FORCE_HEX_LINT=1`.

Key Scripts

- `hex:verify:fast` / `hex:verify:full` / `hex:verify:daily` provide consistent pipelines for local or CI reuse.
- Focused test runner maps changed `src` files → matching `tests/unit/*` based on filename stem; falls back to full suite if no match.

Env Flags

- `FEATURE_TIERED_HOOKS=0` disable fast path.
- `QUICK_CONTRACT=0` skip soft contract at commit.
- `STRICT_CONTRACT=1` force contract hard fail outside push.
- `SKIP_FULL=1` bypass pre-push (emergency only).

Planned Extensions

- Weekly trend job (latency, specCancelRate, golden diff %).
- Monthly stability score + historical envelope drift chart.
- Contract metrics JSON artifact (seat reacquire latency distribution).

Revert

- Delete pre-push hook + caching script + focused runner; restore original pre-commit block; remove scaffold note.

## Wrist Orientation Core (Planar) (WEBWAY:ww-2025-007)

Feature Flag: `FEATURE_WRIST_ORIENT_V1` (off by default). Enable to emit per-hand `wrist:orientation` events.

Purpose

- Provide low-latency directional wrist signal (raw + smoothed angle + cardinal bucket) for game bridges & telemetry without entangling pinch FSM logic.

Pure Core

- `src/core/wristOrientationCore.js` — stateless update; emits only on material change (bucket shift or >~0.5° delta unless `emitUnchanged`).
- Smoothing: EMA on unit vector (default alpha 0.25) avoids wrap artifacts (359→0°).

Event Shape

```js
{
   type: 'wrist:orientation',
   t,
   angleDeg,       // raw 0–360
   smoothAngleDeg, // EMA
   bucket,         // 'UP'|'RIGHT'|'DOWN'|'LEFT'
   flags: { up,right,down,left },
   handKey
}
```

Integration Points

- `handSessionManager` constructs a core per active hand when flag enabled.
- `appShell` relays events downstream via its unified event stream.
- `gameEventBridge` (if enabled) inspects latest bucket when forming action events.
- Demo harness: `dev/wrist_orientation_demo.html` (visual QA of raw vs smooth & bucket).

Tests

- `wristOrientationCore.test.mjs`: bucket transitions & suppression.
- `wristOrientationSmoothing.test.mjs`: validates lag (smooth != raw on abrupt change).
- `wristOrientationDemoHarness.test.mjs`: confirms independent core instances (no shared state).

Tuning

- Pass `smoothAlpha` to constructor for responsiveness vs stability trade-off.
- Future: adaptive alpha (OneEuro-like) and angular velocity events (`wrist:orientationVel`).

Revert Path

- Delete core file + demo + tests; remove orientation branches from `handSessionManager`, `appShell`, `gameEventBridge`; drop flag.

Upgrade Path

- Add 3D quaternion orientation (`FEATURE_WRIST_ORIENT_3D`), then roll/ pitch / velocity + dwell telemetry buckets.


## Responsive Camera & Normalization Detector (WEBWAY:ww-2025-011)

Goal
- Live adjust camera resolution/FPS while guaranteeing a single normalization pass (eliminate prior double-normalization visual shrink/offset).

Flags / Entry
- `FEATURE_CAMERA_CONSTRAINTS` gates UI + `appShell.applyCameraConstraints`.
- Optional: `FEATURE_OVERLAY_DEBUG` to emit per-frame raw landmark ranges and span heuristic warnings.

Key APIs
- `appShell.applyCameraConstraints({ width, height, frameRate })` → attempts `track.applyConstraints`; on failure dispatches `camera:constraints-failed` and (if fallback viable) calls `restartCamera(opts)`.
- `restartCamera(opts)` → stops existing stream, reacquires `getUserMedia` with supplied constraints, rebinds track listeners, dispatches `camera:constraints-applied`.

Overlay Normalization
- `overlayOpsPort.detectSpace(landmarks)` returns one of: `neg1to1`, `unit`, `pixel`.
- Transform logic only converts from source space → unit (0..1) exactly once; result ops carry `coordinateSpace: 'normalized'`.
- Span heuristic (`spanWarn`): warns if landmark bounding span < 0.15 after normalization indicating possible upstream cropping or residual double transform.

Debug Workflow
1. Enable flags + start camera on `dev/integrated_hand_console_v7.html`.
2. Switch resolutions (e.g., 640x480 → 1280x720) and verify overlay alignment remains stable.
3. Temporarily enable `FEATURE_OVERLAY_DEBUG` to inspect logged `{rawMinX, rawMaxX, rawMinY, rawMaxY}` and confirm space classification.
4. Disable debug flag to avoid console noise once validated.

Tests
- `camera.constraints.test.mjs` covers constraint path + restart fallback.
- `overlay.normalization.detect.test.mjs` ensures 0..1 unchanged; -1..1 mapped to unit.

Operational Guardrails
- If constraint apply latency > 1s or error frequency rises, prefer lowering resolution before fallback; consider auto-downgrade heuristic (TODO).
- Do not add UI→ports coupling; all constraint logic stays in `appShell` (ports remain resolution-agnostic).

Revert Path
1. Remove calls to `applyCameraConstraints` / `restartCamera` in dev pages.
2. Delete UI block (resolution/FPS form) guarded by `FEATURE_CAMERA_CONSTRAINTS`.
3. Strip tri-state logic from `overlayOpsPort.detectSpace` (collapse to legacy single boolean) and remove span heuristic + debug logging.
4. Delete scaffold note `scaffolds/webway_ww-2025-011-responsive-camera.md` and this section.
5. Unset/remove feature flags from pages/tests.

SRL Entry Guidance
- Add rows:
   - `SRL-2025-09-17-01 | Camera/Overlay | Responsive constraints + tri-state normalization` (already present in README)
   - `SRL-2025-09-17-02 | Tests/Goldens | Standardize two-hands pinch + idle goldens; add hex-only smokes and daily enforcement` (added to README)

Future
- Auto-downgrade if effective FPS < target - 5 for N frames.
- Capture periodic sample of raw ranges at each constraint change to a lightweight telemetry channel for long-run drift detection.






