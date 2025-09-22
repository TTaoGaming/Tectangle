# MCP Memory Snapshot — 2025-09-07T08:35:00Z

This document is the Knowledge Graph / MCP memory snapshot assembled from recent scans, canonicalization, timeline, diagnostics, and design artifacts. Edit this file directly to update the MCP memory.

Summary (one line)
- Current state: inventory + tooling snapshot complete; first canonicalization pass executed; Hexagonal spec drafted; code scan & timeline available. (Sources: [`docs/doc_inventory.json`](docs/doc_inventory.json:1), [`docs/tooling_environment_report.md`](docs/tooling_environment_report.md:1), [`archive-stale/migration_snapshot_20250906T225754Z/manifest.json`](archive-stale/migration_snapshot_20250906T225754Z/manifest.json:1))

Key artifacts (short)
- Inventory (machine-readable): [`docs/doc_inventory.json`](docs/doc_inventory.json:1)
- Code scan manifest: [`docs/knowledge/code_scan_artifacts.json`](docs/knowledge/code_scan_artifacts.json:1)
- Code scan summary: [`docs/knowledge/code_scan_summary_20250907.md`](docs/knowledge/code_scan_summary_20250907.md:1)
- Git timeline (7 months): [`docs/knowledge/git_timeline.csv`](docs/knowledge/git_timeline.csv:1) / [`docs/knowledge/git_timeline.svg`](docs/knowledge/git_timeline.svg:1)
- Consolidated decision report: [`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:1)
- Migration proposal: [`docs/knowledge/migration_proposal.md`](docs/knowledge/migration_proposal.md:1)
- Project progress summary: [`docs/knowledge/project_progress_summary_20250906.md`](docs/knowledge/project_progress_summary_20250906.md:1)
- Hexagonal spec & ports: [`docs/design/hexagonal_core_spec.md`](docs/design/hexagonal_core_spec.md:1)
- Recent snapshot (canonicalization): [`archive-stale/migration_snapshot_20250906T225754Z/manifest.json`](archive-stale/migration_snapshot_20250906T225754Z/manifest.json:1)
- Dev environment guide: [`docs/knowledge/dev_environment_2pager_20250907.md`](docs/knowledge/dev_environment_2pager_20250907.md:1)

Current short-term todos (mirror)
- See global TODOs: [`docs/ToDos/TODOs_20250907.md`](docs/ToDos/TODOs_20250907.md:1)

Memory details (structured)
- Inventory counts: total md/txt files = 7064 (see [`docs/doc_inventory.json`](docs/doc_inventory.json:1))
- Code scan highlights: managers ≈1228, mediapipe_hits ≈5128, opencv_hits ≈79, tests ≈1532 (see [`docs/knowledge/code_scan_artifacts.json`](docs/knowledge/code_scan_artifacts.json:1))
- Recent actions:
  - Canonicalized 10 Gold docs; backups in archive-stale snapshot (see manifest) (see [`archive-stale/migration_snapshot_20250906T225754Z/manifest.json`](archive-stale/migration_snapshot_20250906T225754Z/manifest.json:1))
  - Git activity concentrated late Aug → early Sep (see timeline) (see [`docs/knowledge/git_timeline.csv`](docs/knowledge/git_timeline.csv:1))

Recommended persistent memory entries (editable)
- project_primary_goal: "Ship deterministic pinch→keypress demo (Pinch Piano / Flappy) and extract Hexagonal pinch core (LandmarkInput, PinchFeature, Telemetry, KeyboardBridge)."
- current_phase: "Canonicalization + Exploit fixes (Strangler‑Fig priority)."
- primary_risks: ["bootstrap inert pages", "CJS/ESM mix in archived modules", "AI-generated duplicate docs"]
- exploit_recommendation: "Strangler‑Fig Exploit — guard top‑level await in [`September2025/Tectangle/prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224); create [`September2025/Tectangle/src/gesture/pinchFeature.js`](September2025/Tectangle/src/gesture/pinchFeature.js:1) and [`September2025/Tectangle/prototype/demo/pinch-piano-bridge.js`](September2025/Tectangle/prototype/demo/pinch-piano-bridge.js:1); target: unblock demo ≤48h."
- pinch_recipe: {"one_euro":"minCutoff≈1Hz,beta≈0.01,dCutoff≈1Hz","thresholds":"enter≈0.15–0.20,exit≈0.22–0.35","debounce_ms":40,"holdTimeout_ms":500,"autoRelease_ms":5000}
- testing_ci: "Require golden JSONL parity for PRs touching gesture/manager; CI example: checkout → npm ci → npx http-server ./ -p 8080 & → node tests/smoke/headless-demo-smoke.js; smoke replay: node --test tests/smoke/pinch.baseline.smoke.test.mjs; record goldens in [`September2025/Tectangle/tests/golden/`](September2025/Tectangle/tests/golden/:1)."
- helpful_links: [
  "`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`",
  "`docs/knowledge/migration_proposal.md`",
  "`docs/knowledge/project_progress_summary_20250906.md`",
  "`docs/design/hexagonal_core_spec.md`",
  "`docs/ToDos/TODOs_20250907.md`",
  "`docs/knowledge/dev_environment_2pager_20250907.md`",
  "`September2025/Tectangle/tests/golden/pinch_baseline_01.jsonl`"
]

How to edit this MCP memory
- Edit this file directly to add or remove entries under 'Recommended persistent memory entries' or 'Key artifacts'.
- After edits, tell the agent to "refresh memory" and it will read this file as the updated MCP memory anchor.

Appendix — quick links
- Inventory: [`docs/doc_inventory.json`](docs/doc_inventory.json:1)
- Code scan: [`docs/knowledge/code_scan_artifacts.json`](docs/knowledge/code_scan_artifacts.json:1)
- Code scan summary: [`docs/knowledge/code_scan_summary_20250907.md`](docs/knowledge/code_scan_summary_20250907.md:1)
- Git timeline: [`docs/knowledge/git_timeline.csv`](docs/knowledge/git_timeline.csv:1)
- Hexagonal spec: [`docs/design/hexagonal_core_spec.md`](docs/design/hexagonal_core_spec.md:1)
- Consolidated report: [`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:1)