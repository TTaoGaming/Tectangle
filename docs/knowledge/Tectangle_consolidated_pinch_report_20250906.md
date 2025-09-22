---
title: "Consolidated Pinch Report"
created_at: "2025-09-06"
source: "September2025/Tectangle/docs/Consolidated_Pinch_Report_2025-09-06.md"
author: "auto-generated"
human_verified: false
---
# Consolidated Pinch Report — Tectangle (2025-09-06)

Author: auto-generated
Date: 2025-09-06
Purpose: Condense the repository's key findings, architecture options, POC plan, and recommended next steps into a 5-page executive report.

TLDR
A concise summary: We recommend the Exploit path — apply a guarded bootstrap fix, wire the existing deterministic pinch baseline to a small pinch→KeyboardEvent bridge, capture golden traces and run the smoke harness. This yields a working Pinch Piano demo quickly, reduces failure modes caused by top-level await and bootstrap fragility, and provides telemetry to inform larger architecture choices (Strangler Fig vs Hexagonal). See the Decision Grid below for alternatives.

Key findings & evidence
- Deterministic pinch design ready: palm-gated index↔thumb pinch with One‑Euro smoothing, knuckle-span normalization, hysteresis and FSM emitting pinch:down/pinch:up — see [`September2025/Tectangle/docs/pinch_feature_plan.md`](September2025/Tectangle/docs/pinch_feature_plan.md:1).
- Fast path (Exploit) is documented: guard bootstrap, reuse [`September2025/Tectangle/src/gesture/pinchBaseline.js`](September2025/Tectangle/src/gesture/pinchBaseline.js:1) and add a demo bridge — see [`September2025/Tectangle/docs/pinch_mvp_decision.md`](September2025/Tectangle/docs/pinch_mvp_decision.md:1).
- Prototypes exist (modular index) demonstrating MediaPipe → OneEuro smoothing → simple press detection and in-page key mapping — see [`September2025/Tectangle/prototype/landmark-smooth/modular-index/README.md`](September2025/Tectangle/prototype/landmark-smooth/modular-index/README.md:1).
- A Keyboard Bridge protocol exists for remote/native bridges if system/global key injection is needed later — see [`September2025/Tectangle/prototype/landmark-smooth/modular-index/docs/keyboard-bridge-protocol.md`](September2025/Tectangle/prototype/landmark-smooth/modular-index/docs/keyboard-bridge-protocol.md:1).
- The repo already uses golden traces and smoke harness concepts; there are two-pagers describing Video Goldens and deterministic testing — see [`September2025/PinchFSMHumanVlad/docs/two-pagers/VideoGoldens_TwoPager_2025-09-05.md`](September2025/PinchFSMHumanVlad/docs/two-pagers/VideoGoldens_TwoPager_2025-09-05.md:1) and [`September2025/PinchFSMHumanVlad/docs/two-pagers/PinchFSM_Deterministic_2025-09-05.md`](September2025/PinchFSMHumanVlad/docs/two-pagers/PinchFSM_Deterministic_2025-09-05.md:1).
- Primary operational fragility: an unguarded top-level await in the src-backed prototype plus strict bootstrap throwing causes demos to appear inert while tests may still pass — documented in the triage and decision docs (see [`September2025/Tectangle/docs/pinch_mvp_decision.md`](September2025/Tectangle/docs/pinch_mvp_decision.md:1)).

Architecture options (concise)
Option A — Strangler Fig: Migrate Human App (incremental on UI layer)
Summary: Incrementally replace parts of the Human-facing front-end; keep the existing pipeline live while swapping components under feature flags.
Pros: Minimal disruptive changes; quickest to show user-facing improvements; uses existing instrumentation.
Cons: May perpetuate fragile cross-cutting bootstrap issues; risk of coupling to legacy bits; migration can be slow across many pages.
Effort: Small → 1–3 weeks (depending on scope). Risk: Medium.
When to prefer: When the UI surface and UX are priority and backend/adapters are stable.

Option B — Strangler Fig: Migrate Media Pipeline (adapter-level)
Summary: Encapsulate MediaPipe/Human pipelines behind a façade, then replace or upgrade the pipeline incrementally.
Pros: Isolates detection stack; adapters can be swapped (MediaPipe / TF.js / native); clearer testability for input traces.
Cons: Requires upfront adapter contracts and more work to standardize payloads; may delay visible demos.
Effort: Medium → 2–6 weeks. Risk: Low→Medium.
When to prefer: When detection accuracy and cross-device consistency are highest priority.

Option C — New Hexagonal Core with MediaPipe as Adapter (clean-slate core domain)
Summary: Build a small, well-typed core domain (ports & adapters) and treat MediaPipe/Human as one adapter. Emphasize contracts, tests, and adapters as lego bricks.
Pros: Long-term maintainability, strong testability, easy adapter replacement, reduced propagation of AI-edit errors.
Cons: Higher upfront cost and time; initial demo speed is slower.
Effort: Large → 3–8 weeks. Risk: Low (long-term payoff).
When to prefer: When you plan to scale, maintain across multiple adapters, or need robust SDKs.

Decision grid — Explore / Exploit / Pivot / Reorient
- Exploit (Recommended): Guard the bootstrap and ship a Pinch Piano demo.
  - Summary: Quick surgical fix + demo bridge to map pinch→keydown.
  - Impact: High. Risk: Medium. Effort: 1 hour → 1–2 days.
  - Next step: Edit [`September2025/Tectangle/prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224) to guard `await ready` with try/catch, then add [`September2025/Tectangle/prototype/demo/pinch-piano-bridge.js`](September2025/Tectangle/prototype/demo/pinch-piano-bridge.js:1) to synthesize keys.
  - Files: [`September2025/Tectangle/prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224), [`September2025/Tectangle/src/gesture/pinchBaseline.js`](September2025/Tectangle/src/gesture/pinchBaseline.js:1).

- Explore: Collect device traces & tune thresholds.
  - Summary: Run time-boxed spikes across multiple devices using the replay harness and golden traces.
  - Impact: Medium. Risk: Low. Effort: days.
  - Next step: Produce locked traces using the MediaPipe trace generator and run comparator; see [`September2025/PinchFSMHumanVlad/docs/TODO_mediapipe_trace_generator.md`](September2025/PinchFSMHumanVlad/docs/TODO_mediapipe_trace_generator.md:1).

- Pivot: Build a monolithic demo.
  - Summary: Create a single-file demo using MediaPipe directly (no bootstrap) to iterate quickly.
  - Impact: Medium. Risk: Low→Medium. Effort: 1–3 days.
  - Next step: Copy [`September2025/Tectangle/prototype/landmark-raw/index.html`](September2025/Tectangle/prototype/landmark-raw/index.html:1) → [`September2025/Tectangle/prototype/monolith-pinch/index.html`](September2025/Tectangle/prototype/monolith-pinch/index.html:1) and implement pinchBaseline mapping.

- Reorient: Harden infra & processes.
  - Summary: Pause feature dev; add backups, CI gating, golden traces, and manager contract standardization.
  - Impact: High. Risk: Medium. Effort: 1–4 weeks.
  - Next step: Add snapshot scripts and CI job requiring golden-trace replay on changes to core managers; see [`September2025/Tectangle/HOPE_NOTEBOOK.md`](September2025/Tectangle/HOPE_NOTEBOOK.md:1).

Minimal Pinch → Keypress POC (practical steps, <1 day to prototype)
1) Serve demo folder: `npx -y http-server ./ -p 8000 -c-1` and open the modular-index or monolith page.
2) Guard bootstrap: wrap `await ready` in try/catch in [`September2025/Tectangle/prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224).
3) Pinch detection recipe (implement or reuse `pinchBaseline`):
   - Norm: P = dist(thumb_tip(4), index_tip(8)) / dist(index_mcp(5), pinky_mcp(17))
   - Smooth: OneEuro per channel (minCutoff=1.0Hz, beta≈0.01).
   - Hysteresis: enter=0.15, exit=0.22, debounce=40ms.
   - FSM: emit `pinch:down` / `pinch:up` and dispatch `KeyboardEvent` to document.
4) Debug overlay: draw landmarks, connecting line, normalized gauge, and a pinch status indicator.
5) Smoke test: capture a golden trace JSONL (`tests/golden/pinch_baseline_01.jsonl`) and run `node --test tests/smoke/pinch.baseline.smoke.test.mjs`.

Root-cause summary — why tests pass but demos fail
- Unguarded top-level await + fatal bootstrap throws: modules abort execution so event listeners never attach even though algorithmic tests (unit) pass. Quick evidence: prototype entry uses `const managers = await ready;` — see [`September2025/Tectangle/prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224).
- CJS/ESM mismatches in archived modules cause test runner aborts during import but may not affect isolated unit tests: see archive-stale failing module evidence in diagnostics.
- Test vs runtime differences: Tests often run deterministic, isolated functions or replay harnesses (no camera, no CDN), while demos depend on runtime assets (CDN, WASM), camera permissions, and environment differences (resolution, fps), so integration failures happen.
- Race conditions and unguarded dynamic imports: startup ordering and silent failures can cause UI wiring issues.
Mitigations (short): Guard bootstrap, add fallback dynamic import in start(), isolate archive CJS modules from test globs, add headless browser smoke job that loads the demo and asserts wiring.

Recommended immediate next 3 actions
1) Apply the Exploit quick fix (1 hour): patch [`September2025/Tectangle/prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224) to try/catch `await ready`, verify Start button wires, and add a demo bridge file to synthesize key events.
2) Capture one golden trace and run smoke test (2–4 hours): produce `tests/golden/pinch_baseline_01.jsonl`, run `node --test tests/smoke/pinch.baseline.smoke.test.mjs` and confirm parity.
3) Add a CI smoke job (1–2 days): headless Chromium job that opens the demo page, checks that Start wiring exists and that pinch events can be synthesized or replayed; fail PRs that modify core managers without providing a golden-trace update.

Appendix — Primary files reviewed (click to open)
- [`September2025/Tectangle/docs/pinch_feature_plan.md`](September2025/Tectangle/docs/pinch_feature_plan.md:1)
- [`September2025/Tectangle/docs/pinch_mvp_decision.md`](September2025/Tectangle/docs/pinch_mvp_decision.md:1)
- [`September2025/Tectangle/prototype/landmark-smooth/modular-index/README.md`](September2025/Tectangle/prototype/landmark-smooth/modular-index/README.md:1)
- [`September2025/Tectangle/prototype/landmark-smooth/modular-index/docs/keyboard-bridge-protocol.md`](September2025/Tectangle/prototype/landmark-smooth/modular-index/docs/keyboard-bridge-protocol.md:1)
- [`September2025/Tectangle/docs/Tectangle_Summary_2025-09-02T18-27-10Z.md`](September2025/Tectangle/docs/Tectangle_Summary_2025-09-02T18-27-10Z.md:1)
- [`September2025/Tectangle/HOPE_NOTEBOOK.md`](September2025/Tectangle/HOPE_NOTEBOOK.md:1)
- [`September2025/Tectangle/Agent.md`](September2025/Tectangle/Agent.md:1)
- [`September2025/Tectangle/docs/DevReadme.md`](September2025/Tectangle/docs/DevReadme.md:1)
- [`September2025/Tectangle/GameBoard.md`](September2025/Tectangle/GameBoard.md:1)
- [`September2025/PinchFSMHumanVlad/docs/two-pagers/VideoGoldens_TwoPager_2025-09-05.md`](September2025/PinchFSMHumanVlad/docs/two-pagers/VideoGoldens_TwoPager_2025-09-05.md:1)
- [`September2025/PinchFSMHumanVlad/docs/two-pagers/PinchFSM_Deterministic_2025-09-05.md`](September2025/PinchFSMHumanVlad/docs/two-pagers/PinchFSM_Deterministic_2025-09-05.md:1)
- [`September2025/PinchFSMHumanVlad/docs/two-pagers/FlappyBirdP0_TwoPager_2025-09-05T00-01-40Z.md`](September2025/PinchFSMHumanVlad/docs/two-pagers/FlappyBirdP0_TwoPager_2025-09-05T00-01-40Z.md:1)
- [`September2025/PinchFSMHumanVlad/docs/TODO_mediapipe_trace_generator.md`](September2025/PinchFSMHumanVlad/docs/TODO_mediapipe_trace_generator.md:1)
- [`Knowledge backup 20250417/4_RECTANGLE_GUIDE.md`](Knowledge backup 20250417/4_RECTANGLE_GUIDE.md:1)
- [`Knowledge backup 20250417/MDP_AI_CODING_GUIDE.md`](Knowledge backup 20250417/MDP_AI_CODING_GUIDE.md:1)
- [`Knowledge backup 20250417/REACT_REFERENCE_20250417.md`](Knowledge backup 20250417/REACT_REFERENCE_20250417.md:1)

Notes & assumptions
- I prioritized source files that directly describe the pinch algorithms, prototype wiring, determinism/golden tests, and the repo's agent/process notes.
- Some 'triage' or archived files may be present under `September2025/Tectangle/diagnostics/triage/` or `archive-stale/`; if you want a full exhaustive index of all .md/.txt, I can produce a complete file list and extract the first 40 lines of each.

End of report.