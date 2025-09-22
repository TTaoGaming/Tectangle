# Developer environment two‑pager — Reproducible Docker + DevContainer
TL;DR: Use a small Docker image + VS Code DevContainer to reproduce Node 22, headless browser smoke harnesses, and deterministic golden‑trace runs locally and in CI. This makes demos repeatable and reduces "works on my machine" debugging.

## What this dev environment is
The dev environment is intentionally minimal: a Docker image that pins a Node runtime and system libraries required by headless Chromium, and a VS Code DevContainer definition that builds that image and opens the repository inside it. Contributors get the same Node version, OS‑level dependencies (Chromium libraries), and workspace mounts so editor tasks, tests, and smoke harnesses run the same way locally and in CI. The DevContainer accelerates onboarding (no local tool installs) and Docker gives CI parity.

## What it provides for this repo
- Node: Node v22.x is present in the workspace (see [`docs/tooling_environment_report.md`](docs/tooling_environment_report.md:1)).
- Package & scripts: project scripts include smoke and harness commands such as `start-smoke-harness` and `test:smoke` so you can run deterministic test runs locally (see [`docs/tooling_environment_report.md`](docs/tooling_environment_report.md:1)).
- Puppeteer & headless browser: puppeteer and puppeteer-core are present so headless browser tests are supported for demo smoke jobs (see [`docs/tooling_environment_report.md`](docs/tooling_environment_report.md:1)).
- Local demo serving: http-server is available for serving prototype pages quickly (see [`docs/tooling_environment_report.md`](docs/tooling_environment_report.md:1)).
- Deterministic golden traces and replay: canonical golden JSONL traces and a replay strategy exist for validating pinch behavior and preventing regressions (see [`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:1); [`docs/knowledge/code_scan_summary_20250907.md`](docs/knowledge/code_scan_summary_20250907.md:1)).
- Repeatable git + CI steps: git version and CI scripts are present so the same steps can be automated in GitHub Actions or other runners (see [`docs/tooling_environment_report.md`](docs/tooling_environment_report.md:1)).

## Minimal recommended files & snippets to add (skeletons — do not write files)
The goal is a small, readable Dockerfile and a matching [`.devcontainer/devcontainer.json`](.devcontainer/devcontainer.json:1) plus a [`README_DEV.md`](README_DEV.md:1) checklist. Below are short skeletons to copy into the repo.

- Dockerfile outline (captures Node and Chromium deps)
[`dockerfile.declaration()`](.devcontainer/Dockerfile:1)
```dockerfile
FROM node:22.13.0-slim
WORKDIR /workspace
COPY package*.json ./
RUN npm ci
# Minimal Chromium deps for Puppeteer headless runs
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates fonts-liberation libasound2 libatk1.0-0 libgtk-3-0 \
    libx11-xcb1 libxcomposite1 libxrandr2 libgbm1
```

- .devcontainer/devcontainer.json skeleton (automate build + postCreate)
[`json.declaration()`](.devcontainer/devcontainer.json:1)
```json
{
  "name": "Tectangle DevContainer",
  "build": { "dockerfile": "Dockerfile" },
  "forwardPorts": [8000],
  "postCreateCommand": "npm ci",
  "extensions": ["ms-vscode.js-debug", "esbenp.prettier-vscode"]
}
```

- README_DEV.md checklist (exact commands to run)
[`bash.declaration()`](README_DEV.md:1)
```bash
# 1) Serve demos
npx -y http-server ./ -p 8000
# 2) Run deterministic smoke harness (replays golden JSONL)
node --test tests/smoke/pinch.baseline.smoke.test.mjs
# 3) Alternative harness
npm run start-smoke-harness
# 4) Replay golden trace (example)
node scripts/replay.js --file=tests/golden/pinch_baseline_01.jsonl
```

## How to use locally (step‑by‑step)
1. Clone the repo:
   git clone <repo-url> && cd "Spatial Input Mobile"
2. Open the folder in VS Code. Use "Reopen in Container" (DevContainer): VS Code will build the Docker image and mount the workspace.
3. In the DevContainer terminal: start the demo server:
   npx -y http-server ./ -p 8000
4. In a second terminal run the smoke harness:
   node --test tests/smoke/pinch.baseline.smoke.test.mjs
   or
   npm run start-smoke-harness (package script present) (see [`docs/tooling_environment_report.md`](docs/tooling_environment_report.md:1)).
5. To record or replay golden traces use the project's replay harness:
   node scripts/replay.js --file=tests/golden/pinch_baseline_01.jsonl (see [`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:1)).

## Safety and backup policy (requirement)
- PRs that change core managers, adapters, or golden traces must include a backup acknowledgement line in the PR description:
  BACKUP-CREATED: archive-stale/migration_snapshot_<timestamp>/
  This enforces a simple human confirmation that a snapshot was created before changes are merged (see [`docs/design/hexagonal_core_spec.md`](docs/design/hexagonal_core_spec.md:1)).
- Use the existing snapshot manifest pattern as an example and store backups under [`archive-stale/`](archive-stale:1) before destructive edits (example manifest: [`archive-stale/migration_snapshot_20250906T225754Z/manifest.json`](archive-stale/migration_snapshot_20250906T225754Z/manifest.json:1)).
- CI policy: require headless smoke job + golden parity for PRs touching `src/**` or `prototype/**` (see consolidated plan) (see [`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:1)).

## Quick troubleshooting checklist (tied to repo diagnostics)
- Start button inert / page fails to wire: check DevTools for an unhandled rejection from an unguarded top‑level await in [`September2025/Tectangle/prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224) (diagnosed in repo) (see [`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:1)).
- Import errors (ERR_MODULE_NOT_FOUND): confirm [`September2025/Tectangle/src/gesture/pinchBaseline.js`](September2025/Tectangle/src/gesture/pinchBaseline.js:1) exists or update test paths; a missing ESM shim is a common cause (see [`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:1)).
- Node ESM failures ("module is not defined"): exclude [`archive-stale/`](archive-stale:1) from test globs or convert files to ESM (legacy CJS found in archives) (see [`September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md`](September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:1); [`docs/knowledge/code_scan_summary_20250907.md`](docs/knowledge/code_scan_summary_20250907.md:1)).
- Headless runs failing: verify Chromium deps are installed in container and Puppeteer is present in node_modules (see [`docs/tooling_environment_report.md`](docs/tooling_environment_report.md:1)).
- If golden replay diverges, attach the failing JSONL to the PR and create a small reproducer (Consolidated Pinch Report recommends this CI gating approach) (see [`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:1)).

----
Two‑page practical primer — copy the snippet skeletons into [`.devcontainer/`](.devcontainer:1) and [`README_DEV.md`](README_DEV.md:1), then reopen in VS Code to validate.
Next steps: create the [`.devcontainer/`](.devcontainer:1) skeleton, validate the smoke harness in a container, and add a CI headless smoke job that replays golden traces before merging (see [`docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md`](docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md:1)).