# 1. Title & one-line TL;DR
Exploit (guard bootstrap) unblocks a demoable palm‑gated pinch now; follow with golden‑trace CI and a short hexagonal refactor sprint to harden (see [`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:1)).

# 2. High-level 6-month timeline (month-by-month)
- Apr 2025
  - Built canonical inventory and started knowledge canonicalization (inventory snapshot created) ([`docs/doc_inventory.json`](docs/doc_inventory.json:1); [`docs/knowledge/project_progress_summary_20250906.md`](docs/knowledge/project_progress_summary_20250906.md:1)).
  - Early manager/registry artifacts identified by code scan (foundation present) ([`docs/knowledge/code_scan_summary_20250907.md`](docs/knowledge/code_scan_summary_20250907.md:1)).

- May 2025
  - Prototype work: camera and landmark prototypes iterated (landmark‑raw / camera manager referenced) ([`September2025/Tectangle/docs/pinch_feature_plan.md`](September2025/Tectangle/docs/pinch_feature_plan.md:1); [`docs/knowledge/code_scan_summary_20250907.md`](docs/knowledge/code_scan_summary_20250907.md:13)).

- Jun 2025
  - Core pinch recipe and deterministic baseline documented (OneEuro, knuckle‑span normalization, FSM) and golden‑trace concept cemented ([`September2025/Tectangle/docs/pinch_feature_plan.md`](September2025/Tectangle/docs/pinch_feature_plan.md:1); [`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:19)).

- Jul 2025
  - Test scaffolding and smoke/golden plans matured; preparatory CI & canonicalization work began ([`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:52); [`docs/knowledge/project_progress_summary_20250906.md`](docs/knowledge/project_progress_summary_20250906.md:16)).

- Aug 2025
  - High activity spike: documentation, prototype polish and migration efforts concentrated late‑Aug (visualized in git timeline; heavy commit activity) ([`docs/knowledge/git_timeline.csv`](docs/knowledge/git_timeline.csv:2); [`docs/knowledge/git_timeline.svg`](docs/knowledge/git_timeline.svg:23)).

- Sep 2025 (early)
  - Root‑cause diagnostics, Exploit decision, and a 7‑day tactical plan produced to unblock demo and ship the Pinch MVP ([`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:1); [`September2025/Tectangle/docs/pinch_mvp_decision.md`](September2025/Tectangle/docs/pinch_mvp_decision.md:3)).

# 3. Phase map (3–5 phases)
- Foundation — core managers & registry  
  - Description: Camera/landmark managers and registry scaffolds provide the platform for gesture plumbing.  
  - Key artifacts: scan summary and manager inventory (`code_scan_summary`) ([`docs/knowledge/code_scan_summary_20250907.md`](docs/knowledge/code_scan_summary_20250907.md:7)).  
  - Status: Partial.

- Smoothing & Prototyping — landmark demos and filters  
  - Description: OneEuro smoothing and prototype pages to validate per‑frame behavior.  
  - Key artifacts: pinch feature plan and prototype references ([`September2025/Tectangle/docs/pinch_feature_plan.md`](September2025/Tectangle/docs/pinch_feature_plan.md:1)).  
  - Status: Partial.

- Pinch POC (Exploit) — quick unblock to demo  
  - Description: Guard bootstrap, reuse deterministic baseline detector, add pinch→keypress bridge to ship Pinch Piano quickly.  
  - Key artifacts: consolidated decision & tactical plan ([`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:6); [`September2025/Tectangle/docs/pinch_mvp_decision.md`](September2025/Tectangle/docs/pinch_mvp_decision.md:3)).  
  - Status: Partial (works after quick fixes; live demos currently brittle until patched).

- Canonicalization & CI hardening  
  - Description: Move Gold docs, integrate golden‑trace parity into CI, and exclude legacy CJS from ESM test paths.  
  - Key artifacts: project progress and CI guidance ([`docs/knowledge/project_progress_summary_20250906.md`](docs/knowledge/project_progress_summary_20250906.md:6); [`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:175)).  
  - Status: Partial.

# 4. Prototype inventory (major prototypes)
- `prototype/camera-manager/index.html` — Demo‑ready (UI plumbing present; flagged as ready in code scan) ([`docs/knowledge/code_scan_summary_20250907.md`](docs/knowledge/code_scan_summary_20250907.md:13)).  
- `prototype/landmark-smooth/index-src.html` — Demo‑brittle (unguarded top‑level await causes module evaluation to abort; quick fix available) ([`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:8); [`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:31)).  
- `prototype/landmark-raw/index.html` (monolith pivot) — Demo fallback recommended if bootstrap proves brittle ([`September2025/Tectangle/docs/pinch_mvp_decision.md`](September2025/Tectangle/docs/pinch_mvp_decision.md:35)).

# 5. Key technical findings (3–6 bullets)
- Unguarded top‑level await in src‑backed demo pages aborts module evaluation and leaves Start() unwired — immediate cause of demo failures ([`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`:8`)).  
- CJS / ESM mix in archived code causes Node ESM runner errors ("module is not defined") and can break CI — exclude or convert archives ([`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:65)).  
- MediaPipe traces are widespread in the scan (high hit count) and OpenCV traces appear — implies demos rely on MediaPipe/vision stacks ([`docs/knowledge/code_scan_summary_20250907.md`](docs/knowledge/code_scan_summary_20250907.md:3)).  
- Golden‑trace + deterministic Node smoke tests exist and are the correct stabilization strategy (replay golden JSONL to assert behavior) ([`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:34); [`September2025/Tectangle/docs/pinch_feature_plan.md`](September2025/Tectangle/docs/pinch_feature_plan.md:196)).

# 6. Immediate quick wins (3 items)
- Guard top‑level await in the src demo to ensure UI wiring always runs (edit [`September2025/Tectangle/prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224)); verify page loads without unhandled rejection ([`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:77)).  
- Add a dynamic fallback import of CameraManager inside Start() so Start is not inert when bootstrap failed (edit same file at Start()) ([`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:96)).  
- Restore or add an ESM shim for `src/gesture/pinchBaseline.js` (or update smoke test import) and run the smoke test: `node --test tests/smoke/pinch.baseline.smoke.test.mjs` (serve with `npx -y http-server ./ -p 8000 -c-1`) ([`docs/knowledge/project_progress_summary_20250906.md`](docs/knowledge/project_progress_summary_20250906.md:39); [`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:120)).

# 7. Medium-term plan (3 items)
- Hexagonal core extraction (Priority: High; Est: 1–3 days) — extract pure pinch core with explicit ports/adapters for CameraManager, telemetry, and UI to improve testability and long‑term maintenance ([`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:36); [`docs/knowledge/code_scan_summary_20250907.md`](docs/knowledge/code_scan_summary_20250907.md:25)).  
- CI golden‑trace gating (Priority: High; Est: 1–2 days) — add headless smoke job that replays golden JSONL and fails PRs on envelope divergence ([`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:52); [`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:175)).  
- Reproducible dev environment & archive isolation (Priority: Medium; Est: 1 day) — add `.devcontainer`/Docker and exclude `archive-stale/**` from test globs to avoid CJS/ESM breaks ([`docs/knowledge/project_progress_summary_20250906.md`](docs/knowledge/project_progress_summary_20250906.md:36); [`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:191)).

# 8. One-week action plan (day‑by‑day)
- Day 1 (you → engineer) — Patch: Guard top‑level await in `index-src.html` and push a small PR; expected output: PR with single‑file patch and manual browser smoke test. (Refs: [`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:75)).  
- Day 2 (engineer) — Implement `createPinchFeature(config)` wrapper and tiny `pinch-piano-bridge.js`; expected output: new `src/gesture/pinchFeature.js` stub + demo bridge file ([`September2025/Tectangle/docs/pinch_feature_plan.md`](September2025/Tectangle/docs/pinch_feature_plan.md:270)).  
- Day 3 (engineer + QA) — Add OneEuro smoothing + FSM and produce first golden trace; expected output: `tests/golden/pinch_baseline_01.jsonl` recorded and checked in ([`September2025/Tectangle/docs/pinch_feature_plan.md`](September2025/Tectangle/docs/pinch_feature_plan.md:196)).  
- Day 4 (QA) — Create deterministic Node smoke test run locally and run: `node --test tests/smoke/pinch.baseline.smoke.test.mjs`; expected output: passing smoke run against golden trace ([`docs/knowledge/project_progress_summary_20250906.md`](docs/knowledge/project_progress_summary_20250906.md:41)).  
- Day 5 (agent/DevOps) — Add headless Puppeteer GHA smoke job (serve → open src URL → assert no unhandled rejections); expected output: workflow PR (`.github/workflows/smoke-demo.yml`) ([`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:54)).  
- Day 6 (engineer) — Kinematic clamp + optional 1‑state KF TOI predictor added; expected output: updated pinchFeature impl + updated golden run for regressions ([`September2025/Tectangle/docs/pinch_feature_plan.md`](September2025/Tectangle/docs/pinch_feature_plan.md:103)).  
- Day 7 (you + engineer) — Stabilize telemetry counters and merge gating policy; expected output: merged PRs, CI smoke job green or actionable failures, and a demoable Pinch Piano release candidate ([`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:65)).

# 9. Appendix — evidence files used and notes about gaps
Evidence files (exact, clickable):
- [`docs/doc_inventory.json`](docs/doc_inventory.json:1)  
- [`docs/knowledge/code_scan_artifacts.json`](docs/knowledge/code_scan_artifacts.json:1)  
- [`docs/knowledge/code_scan_summary_20250907.md`](docs/knowledge/code_scan_summary_20250907.md:1)  
- [`docs/knowledge/git_timeline.csv`](docs/knowledge/git_timeline.csv:1)  
- [`docs/knowledge/git_timeline.svg`](docs/knowledge/git_timeline.svg:1)  
- [`docs/knowledge/project_progress_summary_20250906.md`](docs/knowledge/project_progress_summary_20250906.md:1)  
- [`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:1)  
- [`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:1)  
- [`September2025/Tectangle/docs/pinch_feature_plan.md`](September2025/Tectangle/docs/pinch_feature_plan.md:1)  
- [`September2025/Tectangle/docs/pinch_mvp_decision.md`](September2025/Tectangle/docs/pinch_mvp_decision.md:1)  
- [`September2025/Tectangle/HOPE_NOTEBOOK.md`](September2025/Tectangle/HOPE_NOTEBOOK.md:1)  
- [`Knowledge backup 20250417/4_RECTANGLE_GUIDE.md`](Knowledge backup 20250417/4_RECTANGLE_GUIDE.md:1)  
- [`Knowledge backup 20250417/MDP_AI_CODING_GUIDE.md`](Knowledge backup 20250417/MDP_AI_CODING_GUIDE.md:1)

Notes on gaps / manual review
- Large machine inventories and scan artifacts (`docs/doc_inventory.json`, `docs/knowledge/code_scan_artifacts.json`) contain detailed file‑level provenance but exceed summary read size and should be inspected for per‑file timestamps and missing source paths before large refactors. (See listed files above.)  
- Some prototype src‑backed pages referenced in diagnostics were not presentable for direct read during triage; verify `index-src.html` and referenced `src/*` paths exist on the intended branch before applying patches ([`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:239)).