CI Foundations — Deterministic, Fast, Observable
===============================================

Metadata
--------

- title: CI Foundations — Deterministic, Fast, Observable
- doc_type: two-pager
- timestamp: 2025-09-05T00:00:00Z
- tags: [CI, determinism, caching, artifacts, observability, governance]
- summary: CI that is reliable, quick to signal, deterministic, and easy to reason about, with guardrails and a clean developer experience.

Page 1 — What we ship and how it feels
--------------------------------------

Purpose (5W1H)

- Why: Catch defects early, keep main always releasable, and give developers fast, deterministic feedback.
- What: A minimal CI pipeline that verifies prerequisites, builds/tests deterministically, and publishes artifacts and logs.
- Who: All contributors; owners define guardrails (branch protection, required checks).
- When: On each push and PR; nightly for deeper checks.
- Where: GitHub Actions (portable design also works on GitLab/Azure/Circle).
- How: Hermetic repeatable jobs, pinned versions, caching, artifacts, and clear pass/fail gates.

Success metrics

- Median CI time ≤ 5–8 min; p90 ≤ 15 min.
- Flaky test rate < 1%; reruns tracked and triaged.
- Zero “works on my machine” by design: reproducible toolchains and inputs.

Core principles (precise and minimal)

- Determinism: fix inputs (versions, data, seeds). Avoid network drift via vendored or checksummed assets.
- Fast feedback: smallest pipeline that gates quality; split slow checks to optional/nightly.
- Hermeticity: jobs do not depend on ambient state; explicit inputs/outputs.
- Idempotence: re-running yields the same result; no hidden mutable state.
- Observability: store artifacts (logs, reports, traces) for triage.
- Least privilege: minimal permissions for tokens and workflows.

Best practices (portable)

- Pin tool versions (Node, Python, compilers) and use lockfiles; prefer npm ci/pip-tools.
- Cache immutable dependencies by key; avoid caching build products unless they are deterministic and validated.
- Fail fast on prerequisites (env checks, assets present) before heavy steps.
- Separate checks: quick unit/schema → required; heavy e2e/perf → scheduled/optional.
- Artifacts: upload concise outputs necessary for human/debug (reports, JSONL, logs).
- Concurrency and cancel-in-progress on PR branches to save time.
- Quarantine flakies with retry-and-report; don’t silently ignore.

Tiny contract

- Inputs: repo content at a commit, locked dependencies, fixed test data.
- Outputs: pass/fail status, artifacts (logs/reports), metrics (durations/flaky stats).
- Error modes: missing tools/assets, nondeterministic outputs, timeouts.

Page 2 — Implementation patterns and next steps
-----------------------------------------------

Portable workflow shape

- Triggers: push and PR to protected branches; nightly schedules.
- Jobs: verify → build/extract → test → report; optional matrix by OS/runtime.
- Caching: dependency cache keyed on lockfile hash; tool cache via setup actions.
- Artifacts: upload reports, JSON traces, and relevant logs with short retention.

Cross‑platform meta‑strategies (GitHub/GitLab/Azure/Circle)

- Layering: keep a thin required lane and optional deeper lanes; reproduce locally with a single script.
- Reproducibility: encode versions in config; vendor or checksum external assets; freeze random seeds.
- Contracts: small JSON schemas for inputs/outputs; schema tests gate changes.
- Isolation: avoid shared runners’ global state; write to workspace-local paths only.
- Idempotence: purge or namespace caches; don’t append to global artifacts.

Governance guardrails

- Branch protection: required checks, code owners, linear history if desired.
- Security: least-privilege GITHUB_TOKEN, pin actions by SHA, restrict write workflows.
- Compliance: retain logs/artifacts for audit windows; include provenance metadata.

Observability & triage

- Capture: job logs, structured test output, resource timings.
- Classify failures: env vs test vs code; route flakies to quarantine with owner.
- SLOs: track median and p90 durations, queue times, and success rate.

Apply to this repo (PinchFSM)

- Required lane: verify → generate deterministic traces (JSONL) → run schema/logic tests → upload artifacts.
- Optional lane: visualization overlays and performance metrics on schedule.
- Determinism: fixed fps/timestamps, pinned Human/models; JSONL is canonical input.

Next steps

- Add concurrency cancel for PR branches; set artifact retention (e.g., 7 days).
- Introduce reusable workflow for all subprojects (once patterns stabilize).
- Add a nightly job for performance budgets and overlay generation.
