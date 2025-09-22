# Consolidated Pinch Report — 2025-09-06
Author: Tectangle Consolidation — FINAL
TL;DR: Ship a minimal palm-gated index↔thumb pinch (Exploit path) now; harden with golden-trace-driven CI and a one-week stabilization plan.

## Executive summary
This report synthesizes canonical workspace artifacts and diagnostics into a single actionable plan to deliver a reliable pinch input primitive suitable for a Pinch Piano demo and rapid monetization. The recommended path is "Exploit": apply a small guarded bootstrap fix to the src-backed demo pages, reuse the deterministic pinch baseline detector, and add a thin pinch→keypress bridge. This unlocks an MVP quickly, reuses existing deterministic smoke tests and golden traces for validation, and produces telemetry for tuning thresholds (evidence: decision and feature plan) ([`September2025/Tectangle/docs/pinch_mvp_decision.md`](September2025/Tectangle/docs/pinch_mvp_decision.md:1); [`September2025/Tectangle/docs/pinch_feature_plan.md`](September2025/Tectangle/docs/pinch_feature_plan.md:1)).

The immediate Exploit reduces time to demo from days to hours in most cases and mitigates the root cause of demo failures—an unguarded top‑level await and fragile manager bootstrap—while a parallel short hardening sprint implements OneEuro smoothing, a kinematic clamp, a small KF TOI predictor, deterministic golden trace recording, and CI gating for regressions (evidence: root cause diagnostic and project progress summary) ([`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:1); [`docs/knowledge/project_progress_summary_20250906.md`](docs/knowledge/project_progress_summary_20250906.md:1)).

Outcomes: production‑grade pinch primitive delivered to demo, deterministic smoke and golden tests to prevent regressions, telemetry to inform parameter tuning, and CI that fails PRs which break demo wiring or golden trace envelopes (see Testing & CI section).

## Problem statement & context
The repository already contains deterministic Node smoke tests and golden traces for a pinch detector, but live demo pages built from src modules are failing at module evaluation. The root cause is an unguarded top‑level await on a bootstrap Promise that can reject (manager bootstrap), which aborts module evaluation and prevents UI wiring; in parallel, legacy CommonJS artifacts can break Node ESM test runs (evidence: root cause analysis) ([`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:1)).

Knowledge management is in flight: a canonicalization proposal lists top Gold docs to be moved under `docs/knowledge` and the project progress summary captures inventory statistics and recent activity—use these canonical docs for provenance when making architecture choices (evidence: migration proposal and inventory) ([`docs/knowledge/migration_proposal.md`](docs/knowledge/migration_proposal.md:1); [`docs/doc_inventory.json`](docs/doc_inventory.json:1)).

Impact: without the quick bootstrap fix and deterministic validation, the demo cannot be used to collect production telemetry and revenue (Pinch Piano), and CI may be tripped by legacy archive artifacts. The proposed plan balances speed and durability: fix then harden.

## Technical summary — pinch algorithm, OneEuro, FSM and POC recipe (pinch → keypress)
Algorithm overview (minimal reliable pipeline)
1. Inputs per frame: tip landmarks (index_tip, thumb_tip), palm or wrist landmarks, optional depth/scale, and timestamp (see feature plan) ([`September2025/Tectangle/docs/pinch_feature_plan.md`](September2025/Tectangle/docs/pinch_feature_plan.md:1)).
2. Normalize: compute knuckle span (index_mcp ↔ pinky_mcp) or expose a user knob (default 8 cm) to derive a pixels‑to‑cm normalization; operate in normalized distance units to make thresholds device‑agnostic (see plan).
3. OneEuro smoothing: apply a OneEuro filter per scalar channel (x, y, optional z) with conservative defaults (minCutoff≈1Hz, beta≈0.01, dCutoff≈1Hz). Maintain one filter state per channel per fingertip to remove jitter while preserving responsiveness (implementation reference: baseline detector) ([`September2025/Tectangle/src/gesture/pinchBaseline.js`](September2025/Tectangle/src/gesture/pinchBaseline.js:1); [`September2025/Tectangle/docs/pinch_feature_plan.md`](September2025/Tectangle/docs/pinch_feature_plan.md:1)).
4. Palm gate: compute palm normal or wrist vector and apply a forgiving coneAngle (default 30°) to reject off‑plane grasps; make toggleable for debugging.
5. Distance metric & hysteresis: rawDistance = euclidean(smoothed.index_tip, smoothed.thumb_tip); normalized = rawDistance / knuckleSpan. Use asymmetric thresholds (enter ≈ 0.15–0.40, exit ≈ 0.22–0.75) with short ms debounce timers (enterDebounce≈40ms, exitDebounce≈40ms).
6. Kinematic plausibility: compute velocity and acceleration; clamp/reject frames exceeding thresholds (defaults provided in plan) to prevent spikes from causing false pinches.
7. TOI prediction (optional): constant‑velocity estimate of time‑to‑impact limited to short horizons (≤200ms) or a 1‑state KF on relative distance for velocity smoothing.
8. FSM: deterministic small state machine (Idle → PrePinch → Pinched → ReleasePending) that enforces palm gate → smoothing → thresholds → transition ordering. Use holdTimeout (≈500ms) and autoRelease safety (≈5s) to avoid stuck states (recipe and pseudocode in feature plan) ([`September2025/Tectangle/docs/pinch_feature_plan.md`](September2025/Tectangle/docs/pinch_feature_plan.md:1)).

POC recipe for pinch→keypress (high level)
- Quick fix: guard the top‑level await in [`September2025/Tectangle/prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224) so module evaluation completes and Start() can run fallbacks (see diagnostics) ([`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:1)).
- Expose createPinchFeature(config) in a new module [`September2025/Tectangle/src/gesture/pinchFeature.js`](September2025/Tectangle/src/gesture/pinchFeature.js:1) that wraps the baseline logic and telemetry hooks.
- Implement a tiny bridge [`September2025/Tectangle/prototype/demo/pinch-piano-bridge.js`](September2025/Tectangle/prototype/demo/pinch-piano-bridge.js:1) that listens for 'pinch:down' / 'pinch:up' and dispatches in‑page KeyboardEvent('keydown'/'keyup') to the focused element; document limitation that synthetic in‑page KeyboardEvents do not become OS global keys and propose WebMIDI/native bridge for system integration (see decision doc) ([`September2025/Tectangle/docs/pinch_mvp_decision.md`](September2025/Tectangle/docs/pinch_mvp_decision.md:1)).
- Validate by replaying canonical golden JSONL traces and running deterministic smoke tests: `node --test tests/smoke/pinch.baseline.smoke.test.mjs` against [`September2025/Tectangle/tests/golden/pinch_baseline_01.jsonl`](September2025/Tectangle/tests/golden/pinch_baseline_01.jsonl:1).

## Architecture decision analysis — Strangler‑Fig vs Hexagonal vs MediaPipe‑adapter
Options (concise)
- Strangler‑Fig (Exploit): minimally invasive fixes and small feature modules that gradually replace brittle bootstrap code. Pros: fastest to ship, reuses tests and goldens; Cons: can perpetuate brittle bootstrapping patterns if follow‑up refactor is not scheduled (recommended short path) (see decision) ([`September2025/Tectangle/docs/pinch_mvp_decision.md`](September2025/Tectangle/docs/pinch_mvp_decision.md:1)).
- Hexagonal core: extract a pure pinch core with clean ports/adapters for CameraManager, telemetry, and UI. Pros: excellent testability and long‑term maintainability; Cons: medium effort up front, slower initial delivery (recommended parallel investment) (see migration recommendations) ([`docs/knowledge/migration_proposal.md`](docs/knowledge/migration_proposal.md:1)).
- MediaPipe monolith (adapter / pivot): build an isolated single‑file demo that directly drives the pinch detector via MediaPipe for fast iteration without repo bootstrap dependencies. Pros: rapid isolation and reliable demo; Cons: duplicates logic and requires later reintegration if adopted (fallback option) ([`September2025/Tectangle/docs/pinch_mvp_decision.md`](September2025/Tectangle/docs/pinch_mvp_decision.md:1)).

Decision grid (short)
- Time to demo: Strangler‑Fig > MediaPipe ≫ Hexagonal.
- Long‑term maintainability: Hexagonal ≫ Strangler‑Fig ≥ MediaPipe.
- Testability / deterministic validation: Hexagonal ≥ Strangler‑Fig (if tests are preserved) > MediaPipe (unless golden traces are ported).

Recommendation
1. Execute the Strangler‑Fig Exploit to unblock demo and telemetry within the next 48 hours (guard bootstrap, bridge pinch→keypress, reuse baseline detector) (see [`September2025/Tectangle/docs/pinch_mvp_decision.md`](September2025/Tectangle/docs/pinch_mvp_decision.md:1)).
2. Concurrently start a time‑boxed Hexagonal refactor sprint (3–7 days) to extract a pure pinch core with adapter ports for camera, telemetry, and UI. Make refactor contingent on golden‑trace parity tests (see migration proposal) ([`docs/knowledge/migration_proposal.md`](docs/knowledge/migration_proposal.md:1)).
3. If the Strangler path is blocked beyond 48 hours, pivot to a MediaPipe monolith to preserve product cadence and capture telemetry for tuning (see pivot option) ([`September2025/Tectangle/docs/pinch_mvp_decision.md`](September2025/Tectangle/docs/pinch_mvp_decision.md:1)).

## Testing & CI — golden traces, smoke harness, replay strategy and safeguards
CI guardrails
- Add headless browser smoke job that serves the repo and opens the src‑backed demo URL, fails on unhandled rejections, asserts Start wiring, and replays a golden trace against expected telemetry (suggested job: checkout → npm ci → npx http-server ./ -p 8080 & → node tests/smoke/headless-demo-smoke.js) (diagnostics) ([`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:1)).
- Require golden trace parity for PRs that touch gesture or manager code; attach the golden JSONL to the PR and fail if envelopes diverge beyond tolerance.

Smoke & replay strategy
- Maintain canonical JSONL golden traces in [`September2025/Tectangle/tests/golden/`](September2025/Tectangle/tests/golden/:1) containing per‑frame timestamps, raw landmarks, smoothed normalizedDistance, FSM state transitions, and emitted events (see feature plan) ([`September2025/Tectangle/docs/pinch_feature_plan.md`](September2025/Tectangle/docs/pinch_feature_plan.md:1)).
- Node replay harness must validate emitted events and telemetry counters; headless harness must additionally assert demo UI wiring.

Operational safeguards to avoid restart‑loss
- Guard top‑level awaits and ensure UI wiring runs even with non‑fatal bootstrap failures; expose `window.__MANAGERS__` with canonical aliases so fallback code can discover services (diagnostics) ([`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:1)).
- FSM auto‑release timeout and telemetry‑driven feature disable (e.g., disable pinch if false positive rate > threshold) to prevent stuck or noisy inputs in the field (see feature plan).

## 7‑day tactical plan & timeline (concrete next steps, owners, estimates)
- Day 0 (0–4h): Guard bootstrap in [`September2025/Tectangle/prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224) and add dynamic fallback import in Start(); verify Start wiring manually. Owner: Frontend Eng. Est: 0.25–2h (see diagnostics).
- Day 0–1 (4–12h): Create [`September2025/Tectangle/src/gesture/pinchFeature.js`](September2025/Tectangle/src/gesture/pinchFeature.js:1) and bridge [`September2025/Tectangle/prototype/demo/pinch-piano-bridge.js`](September2025/Tectangle/prototype/demo/pinch-piano-bridge.js:1); wire telemetry counters in [`September2025/Tectangle/src/telemetry/pinchTelemetry.js`](September2025/Tectangle/src/telemetry/pinchTelemetry.js:1). Owner: Eng. Est: 4–8h.
- Day 2 (8–24h): Add OneEuro smoothing, hysteresis, debounce and FSM implementation; record golden trace runs to [`September2025/Tectangle/tests/golden/pinch_baseline_01.jsonl`](September2025/Tectangle/tests/golden/pinch_baseline_01.jsonl:1). Owner: Eng+QA. Est: 4–8h.
- Day 3: Create deterministic smoke tests and Node replay harness; run `node --test tests/smoke/pinch.baseline.smoke.test.mjs` and iterate. Owner: QA. Est: 2–4h.
- Day 4: Add headless Puppeteer/GHA smoke job to CI that asserts no unhandled rejections and golden parity. Owner: DevOps. Est: 6–10h.
- Day 5–7: Hardening: kinematic clamp, optional KF TOI predictor, calibration UI and parameter tuning against goldens; finalize telemetry dashboards and release gating. Owner: Eng+PM. Est: 1–2d.

## Appendix — key source list (clickable) and short notes
- [`docs/knowledge/migration_proposal.md`](docs/knowledge/migration_proposal.md:1)
- [`docs/knowledge/project_progress_summary_20250906.md`](docs/knowledge/project_progress_summary_20250906.md:1)
- [`docs/knowledge/git_timeline.csv`](docs/knowledge/git_timeline.csv:1) and [`docs/knowledge/git_timeline.svg`](docs/knowledge/git_timeline.svg:1)
- [`September2025/Tectangle/docs/pinch_feature_plan.md`](September2025/Tectangle/docs/pinch_feature_plan.md:1)
- [`September2025/Tectangle/docs/pinch_mvp_decision.md`](September2025/Tectangle/docs/pinch_mvp_decision.md:1)
- [`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:1)
- [`September2025/Tectangle/HOPE_NOTEBOOK.md`](September2025/Tectangle/HOPE_NOTEBOOK.md:1)
- [`September2025/Tectangle/tests/golden/pinch_baseline_01.jsonl`](September2025/Tectangle/tests/golden/pinch_baseline_01.jsonl:1) and [`September2025/Tectangle/tests/smoke/pinch.baseline.smoke.test.mjs`](September2025/Tectangle/tests/smoke/pinch.baseline.smoke.test.mjs:1)
- [`Knowledge backup 20250417/4_RECTANGLE_GUIDE.md`](Knowledge backup 20250417/4_RECTANGLE_GUIDE.md:1)

Short notes:
- Use canonical docs in `docs/knowledge/` for provenance when making architecture decisions (see migration proposal).
- Ensure golden trace parity before accepting refactors; attach JSONL to PRs.
- If bootstrap guard reveals deeper integration brittleness, pivot to the MediaPipe monolith fallback (pivot option described in decision doc).

End of consolidated report.