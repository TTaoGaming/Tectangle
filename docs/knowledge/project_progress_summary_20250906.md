# Project Progress Summary — 2025-09-06

TL;DR: Snapshot of workspace state, recent work, and recommended immediate actions to stabilize demos and canonicalize knowledge.

Key artifacts
- Inventory: [`docs/doc_inventory.json`](docs/doc_inventory.json:1) (machine readable) and [`docs/doc_inventory.md`](docs/doc_inventory.md:1).
- Tooling: [`docs/tooling_environment_report.md`](docs/tooling_environment_report.md:1).
- Canonicalization proposal: [`docs/knowledge/migration_proposal.md`](docs/knowledge/migration_proposal.md:1).
- Snapshot manifest: [`archive-stale/migration_snapshot_20250906T225754Z/manifest.json`](archive-stale/migration_snapshot_20250906T225754Z/manifest.json:1).
- Canonicalization report: [`docs/knowledge/canonicalization_report_20250906T225754Z.md`](docs/knowledge/canonicalization_report_20250906T225754Z.md:1).

High-level metrics
- Cataloged .md/.txt files: 7064 (see [`docs/doc_inventory.json`](docs/doc_inventory.json:1)).
- Classification: Gold = 665; Reference = 4924; AI-slop = 1475.

Recent activity (high level)
- Git timeline (last 7 months): see [`docs/knowledge/git_timeline.csv`](docs/knowledge/git_timeline.csv:1) and [`docs/knowledge/git_timeline.svg`](docs/knowledge/git_timeline.svg:1).
- Intense activity in late Aug → early Sep 2025 with documentation, prototypes, and CI / golden-master work.

What we changed (recent canonicalization)
- Executed canonicalization for 12 proposed Gold docs: moved 10 files into [`docs/knowledge/`](docs/knowledge/:1); 2 failed and were recorded in snapshot manifest.
- Backups & manifest: [`archive-stale/migration_snapshot_20250906T225754Z/manifest.json`](archive-stale/migration_snapshot_20250906T225754Z/manifest.json:1).

Successes
- Deterministic inventory and tooling snapshot now available.
- First canonicalization pass completed and backed up.
- Git timeline visualization created.

Open issues & risks
- 2 failed moves recorded; inspect manifest for details.
- Demos vs tests mismatch caused by unguarded top-level await and CJS/ESM mix (diagnosed in [`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:1)).
- Many AI-generated or duplicated docs (AI-slop) need triage.

Recommended immediate next steps (pick 1)
1) Apply quick Exploit patch to prototype bootstrap (guard await) — reduces demo failures. Target: [`September2025/Tectangle/prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:1).
2) Run golden-trace capture + smoke harness against [`tests/golden/`](tests/golden/:1) and [`tests/smoke/`](tests/smoke/:1).
3) Create reproducible dev environment (`.devcontainer/` or Docker) and add to CI.

Quick commands (run from repo root)
- Serve demos: npx -y http-server ./ -p 8000 -c-1
- Run smoke test: node --test tests/smoke/pinch.baseline.smoke.test.mjs

How I can help next
- I can prepare the Exploit patch and present the diff for review.
- I can run golden-trace smoke runs (requires permissions to run Puppeteer).
- I can deep-scan archives for older timestamps and produce a detailed timeline.

Notes & references
- Inventory: [`docs/doc_inventory.json`](docs/doc_inventory.json:1)
- Tooling report: [`docs/tooling_environment_report.md`](docs/tooling_environment_report.md:1)
- Git timeline: [`docs/knowledge/git_timeline.svg`](docs/knowledge/git_timeline.svg:1)

End.