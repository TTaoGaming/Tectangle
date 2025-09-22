# Dev environment — executive summary

Verdict: Implement a small VS Code DevContainer and matching Dockerfile now to make local runs and CI smoke harnesses reproducible and to unblock the Pinch POC quickly.

Why reproducible dev environments matter for Tectangle
- Reduce environment drift: tests and tools expect Node v22 and Puppeteer; pinning the runtime avoids "it works on my machine" failures (see [`docs/tooling_environment_report.md`](docs/tooling_environment_report.md:1)).
- Preserve deterministic validation: the repo already uses golden JSONL traces and a smoke harness for pinch replay; a reproducible environment ensures the same replay behavior locally and in CI (see [`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:1); [`docs/knowledge/code_scan_summary_20250907.md`](docs/knowledge/code_scan_summary_20250907.md:1)).
- Reduce accidental breaks from archives: the inventory and migration work show archived legacy files that can leak into test runs; container isolation + strict test globs prevent legacy CJS imports from breaking ESM tests (see [`docs/doc_inventory.json`](docs/doc_inventory.json:1); [`docs/knowledge/timeline_and_progress_20250907.md`](docs/knowledge/timeline_and_progress_20250907.md:1)).
- Faster onboarding & review: a DevContainer lets reviewers and non‑core contributors reproduce failures without local installs (see [`docs/tooling_environment_report.md`](docs/tooling_environment_report.md:1)).

Three immediate benefits for shipping the Pinch POC faster
- Shorten triage-to-fix time: reproducible demos make the Exploit (guard-bootstrap) path verifiable in hours rather than days (evidence: Consolidated Pinch Report tactical plan) (see [`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:1)).
- Reliable CI gating: headless smoke jobs that replay goldens will fail PRs that break pinch behavior, preventing regressions and rework (see [`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:1); [`docs/tooling_environment_report.md`](docs/tooling_environment_report.md:1)).
- Predictable demos for stakeholders: demos run inside a container reproduce the same telemetry and event traces used for tuning thresholds, shortening feedback cycles (see [`docs/knowledge/code_scan_summary_20250907.md`](docs/knowledge/code_scan_summary_20250907.md:1)).

Recommended path and single next action
- Approach: Use a DevContainer for immediate VS Code ergonomics and Docker images for CI parity (DevContainer builds the Docker image). This balances fast onboarding and reproducible CI (see [`docs/tooling_environment_report.md`](docs/tooling_environment_report.md:1)).
- Next action (do now): add a minimal [`.devcontainer/devcontainer.json`](.devcontainer/devcontainer.json:1) + Dockerfile skeleton and a short [`README_DEV.md`](README_DEV.md:1) containing the commands to serve demos and run the smoke harness; reopen the repo in VS Code and run the harness.

End.