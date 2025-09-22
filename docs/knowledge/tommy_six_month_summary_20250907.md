# Six‑Month Executive Summary — Pinch input (Apr–Sep 2025)

TL;DR: Apply the Exploit (guard bootstrap) to unblock the Pinch Piano demo within 48 hours, run the golden‑trace smoke harness to lock down behavior, then start a time‑boxed Hexagonal refactor to harden the core (evidence: [`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:6); [`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:1)).

1) High‑level 6‑month timeline (month‑by‑month)
- Apr 2025
  - Inventory & canonicalization started; snapshot created to drive provenance decisions (see inventory snapshot) (`docs` canonicalization) ([`docs/knowledge/timeline_and_progress_20250907.md`](docs/knowledge/timeline_and_progress_20250907.md:5)).  
  - Early manager/registry artifacts were identified (foundation managers present) (code scan evidence) ([`docs/knowledge/code_scan_summary_20250907.md`](docs/knowledge/code_scan_summary_20250907.md:7)).
- May 2025
  - Camera and landmark prototypes iterated (landmark‑raw / camera manager work) ([`September2025/Tectangle/docs/pinch_feature_plan.md`](September2025/Tectangle/docs/pinch_feature_plan.md:5)).  
  - MediaPipe traces and vision dependencies surfaced heavily in the scan (risk signal) ([`docs/knowledge/code_scan_summary_20250907.md`](docs/knowledge/code_scan_summary_20250907.md:3)).
- Jun 2025
  - Core pinch recipe (OneEuro smoothing, knuckle‑span normalization, FSM) documented and accepted for MVP ([`September2025/Tectangle/docs/pinch_feature_plan.md`](September2025/Tectangle/docs/pinch_feature_plan.md:15)).  
  - Golden‑trace concept and deterministic smoke tests formalized for validation ([`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:52)).
- Jul 2025
  - Test scaffolding and smoke/golden plans matured; CI preparatory work began ([`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:52); [`docs/knowledge/project_progress_summary_20250906.md`](docs/knowledge/project_progress_summary_20250906.md:16)).  
  - Manager/registry polishing and README per‑manager recommendations added to the backlog ([`docs/knowledge/code_scan_summary_20250907.md`](docs/knowledge/code_scan_summary_20250907.md:19)).
- Aug 2025
  - Intense commit activity and documentation/prototype polish (git activity spike) ([`docs/knowledge/git_timeline.csv`](docs/knowledge/git_timeline.csv:2); [`docs/knowledge/timeline_and_progress_20250907.md`](docs/knowledge/timeline_and_progress_20250907.md:19)).  
  - Canonicalization pass moved multiple Gold docs under `docs/knowledge` (snapshot + backups) ([`docs/knowledge/project_progress_summary_20250906.md`](docs/knowledge/project_progress_summary_20250906.md:21)).
- Sep 2025 (early)
  - Root‑cause diagnostics and the Exploit decision were produced to unblock demos quickly (unguarded bootstrap identified) ([`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:1); [`September2025/Tectangle/docs/pinch_mvp_decision.md`](September2025/Tectangle/docs/pinch_mvp_decision.md:3)).

2) High‑level logic & architecture intent
- Intent: keep a small, deterministic, testable Hexagonal core for pinch detection (pure algorithm + FSM) and expose adapters for CameraManager, telemetry, and UI. Use the Exploit path to ship fast and run a short extraction sprint to achieve Hexagonal isolation (ports/adapters) with golden‑trace parity as the gating test ([`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:36); [`docs/knowledge/code_scan_summary_20250907.md`](docs/knowledge/code_scan_summary_20250907.md:25)).

3) What works today (3 bullets)
- Deterministic smoke tests and canonical golden JSONL traces exist and replay reliably in Node locally (test harness & golden file presence) ([`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:34); [`September2025/Tectangle/tests/golden/pinch_baseline_01.jsonl`](September2025/Tectangle/tests/golden/pinch_baseline_01.jsonl:1)).  
- The pinch algorithm recipe (OneEuro smoothing, normalization, FSM, kinematic clamp) is fully documented and ready to be implemented/reused ([`September2025/Tectangle/docs/pinch_feature_plan.md`](September2025/Tectangle/docs/pinch_feature_plan.md:1)).  
- Prototype demo pages and CameraManager plumbing are present (camera prototype flagged demo‑ready) and can be used for manual verification once the bootstrap is tolerant ([`docs/knowledge/code_scan_summary_20250907.md`](docs/knowledge/code_scan_summary_20250907.md:13)).

4) What is brittle / risk (3 bullets)
- Unguarded top‑level await in src‑backed demo pages aborts module evaluation and leaves Start() unwired (primary cause of demo failures) ([`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:8)).  
- Legacy CommonJS in archive paths and CJS/ESM mix break Node ESM test runs (ReferenceError "module is not defined") and can trip CI if not excluded or converted ([`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:65); [`docs/knowledge/project_progress_summary_20250906.md`](docs/knowledge/project_progress_summary_20250906.md:31)).  
- Knowledge & archive duplication (AI‑slop and archive‑stale folders) increases surface area for regressions and slows refactors (inventory metrics & scan results) ([`docs/knowledge/project_progress_summary_20250906.md`](docs/knowledge/project_progress_summary_20250906.md:12); [`docs/knowledge/code_scan_summary_20250907.md`](docs/knowledge/code_scan_summary_20250907.md:32)).

5) Immediate next steps — 3 low‑friction actions (exact file or command)
1. Guard the demo bootstrap: edit [`September2025/Tectangle/prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224) to wrap the awaited bootstrap in try/catch so module evaluation completes and Start() can run fallbacks (quick; 10–30m) ([`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:78)).  
2. Add a dynamic fallback import inside Start() to instantiate CameraManager if bootstrap failed (edit same file near Start()) (quick; 20–60m) ([`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:101)).  
3. Run the smoke replay after fixes: from repo root run `npx -y http-server ./ -p 8000 -c-1` then `node --test tests/smoke/pinch.baseline.smoke.test.mjs` to verify golden parity and no import failures (evidence + commands) ([`docs/knowledge/project_progress_summary_20250906.md`](docs/knowledge/project_progress_summary_20250906.md:40); [`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:34)).

6) 30‑day plan (prioritized, rough effort)
1. Ship Exploit + CI smoke (Priority: 1) — guard bootstrap, add fallback, record goldens, add headless smoke job (Est: 1–5 days) ([`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:65)).  
2. Hexagonal refactor (Priority: 2) — extract pure pinch core (ports/adapters for CameraManager, telemetry, UI); make refactor gated by golden‑trace parity (Est: 3–7 days) ([`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:39)).  
3. Archive isolation & reproducible dev environment (Priority: 3) — exclude `archive-stale/**` from test globs; add `.devcontainer`/Docker to stabilize contributors (Est: 1–3 days) ([`docs/knowledge/project_progress_summary_20250906.md`](docs/knowledge/project_progress_summary_20250906.md:37); [`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:191)).

7) One‑week bite‑sized plan (daily owner + exact expected output)
- Day 1 — you → engineer: Patch bootstrap guard in [`September2025/Tectangle/prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224); expected output: small PR with single‑file patch and a manual browser smoke check (no uncaught rejections) ([`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:77)).  
- Day 2 — engineer: Add `createPinchFeature(config)` stub and `prototype/demo/pinch-piano-bridge.js`; expected output: new `src/gesture/pinchFeature.js` stub + bridge file committed ([`September2025/Tectangle/docs/pinch_feature_plan.md`](September2025/Tectangle/docs/pinch_feature_plan.md:270)).  
- Day 3 — engineer + QA: Implement OneEuro smoothing + FSM and record first golden; expected output: `tests/golden/pinch_baseline_01.jsonl` produced and checked in ([`September2025/Tectangle/docs/pinch_feature_plan.md`](September2025/Tectangle/docs/pinch_feature_plan.md:196)).  
- Day 4 — QA: Run deterministic Node smoke: `node --test tests/smoke/pinch.baseline.smoke.test.mjs`; expected output: passing smoke run against the golden (log + exit 0) ([`docs/knowledge/project_progress_summary_20250906.md`](docs/knowledge/project_progress_summary_20250906.md:41)).  
- Day 5 — agent / DevOps: Add headless Puppeteer GHA smoke job and open PR `.github/workflows/smoke-demo.yml`; expected output: workflow PR that runs headless smoke and fails on unhandled rejections ([`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:54)).  
- Day 6 — engineer: Add kinematic clamp + optional 1‑state KF TOI predictor; expected output: updated pinchFeature implementation + updated golden run for regression checks ([`September2025/Tectangle/docs/pinch_feature_plan.md`](September2025/Tectangle/docs/pinch_feature_plan.md:103)).  
- Day 7 — you + engineer: Stabilize telemetry counters and merge gating policy; expected output: merged PRs and CI smoke job green or actionable failure report (telemetry counters recorded) ([`September2025/Tectangle/docs/pinch_feature_plan.md`](September2025/Tectangle/docs/pinch_feature_plan.md:240); [`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:65)).

Closing recommendation
Apply the Exploit (guard bootstrap, add fallback, run golden replay) now; then immediately start a short, time‑boxed Hexagonal extraction sprint with golden‑trace gating to prevent regressions (single decisive path to demo + durability) ([`September2025/Tectangle/docs/pinch_mvp_decision.md`](September2025/Tectangle/docs/pinch_mvp_decision.md:45)).

Appendix — source files used (clickable)
- [`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:1)  
- [`docs/knowledge/timeline_and_progress_20250907.md`](docs/knowledge/timeline_and_progress_20250907.md:1)  
- [`docs/knowledge/project_progress_summary_20250906.md`](docs/knowledge/project_progress_summary_20250906.md:1)  
- [`docs/knowledge/code_scan_summary_20250907.md`](docs/knowledge/code_scan_summary_20250907.md:1)  
- [`docs/knowledge/git_timeline.csv`](docs/knowledge/git_timeline.csv:1)  
- [`docs/knowledge/git_timeline.svg`](docs/knowledge/git_timeline.svg:1)  
- [`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:1)  
- [`September2025/Tectangle/docs/pinch_feature_plan.md`](September2025/Tectangle/docs/pinch_feature_plan.md:1)  
- [`September2025/Tectangle/docs/pinch_mvp_decision.md`](September2025/Tectangle/docs/pinch_mvp_decision.md:1)  
- [`September2025/Tectangle/HOPE_NOTEBOOK.md`](September2025/Tectangle/HOPE_NOTEBOOK.md:1)  
- [`Knowledge backup 20250417/4_RECTANGLE_GUIDE.md`](Knowledge backup 20250417/4_RECTANGLE_GUIDE.md:1)  
- [`Knowledge backup 20250417/MDP_AI_CODING_GUIDE.md`](Knowledge backup 20250417/MDP_AI_CODING_GUIDE.md:1)