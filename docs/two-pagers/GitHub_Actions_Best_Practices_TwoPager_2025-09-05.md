GitHub Actions — Practical Playbook
===================================

Metadata
--------

- title: GitHub Actions — Practical Playbook
- doc_type: two-pager
- timestamp: 2025-09-05T00:00:00Z
- tags: [GitHub Actions, CI, caching, security, artifacts]
- summary: Opinionated patterns to keep Actions fast, secure, and maintainable.

Page 1 — What good looks like
------------------------------

Core patterns

- Use a single entry script locally (e.g., `npm run ci`) that mirrors the workflow steps.
- Pin Node/Python versions via setup actions; use lockfile‑based installs (`npm ci`).
- Cache dependencies by lockfile hash; avoid caching ephemeral build outputs.
- Limit triggers by path filters; cancel in‑progress on PR updates.
- Upload artifacts that help humans: concise logs, reports, traces.
- Keep steps small and named; prefer composite/reusable workflows when duplication appears.

Security

- Pin third‑party actions by SHA; grant minimal permissions to GITHUB_TOKEN.
- Disallow untrusted PRs from running privileged workflows; use `pull_request_target` carefully.
- Store secrets in organization repo settings; avoid write tokens in build jobs.

Speed

- Run the required lane only (verify/build/test); push heavy checks to nightly.
- Use matrix only when needed; prefer one OS if portability isn’t required.
- Concurrency with `cancel-in-progress: true` for PR branches.

Observability

- Use `actions/upload-artifact` with explicit retention; name artifacts by job and commit.
- Emit structured test output; make failures skimmable.

Page 2 — Apply to PinchFSM
---------------------------

Workflow shape

- Triggers: `push` and `pull_request` on `September2025/PinchFSM/**` paths.
- Steps: `npm ci` → `npm run verify` → `npm run human:extract` → `npm test` → upload artifacts.
- Environment: Node 22; Puppeteer downloads Chrome; fixed versions in `package.json`.

Determinism hooks

- Vendored `dist/` and `models/` for Human; serve locally in headless Chrome.
- Fixed fps=30; timestamp math from frameIndex; JSONL outputs as canonical traces.

Maintenance

- Add `concurrency` to cancel duplicate PR runs.
- Introduce a nightly workflow for overlays and perf budgets.
- Extract a reusable composite action if other subprojects adopt the pattern.

Snippet (conceptual)

- Required job mirrors `npm run ci`; artifacts include `data/goldens/**/*.jsonl` and logs.
