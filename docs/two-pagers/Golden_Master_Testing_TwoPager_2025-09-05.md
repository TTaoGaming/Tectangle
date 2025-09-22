Golden Master Testing — Lock Inputs, Gate Regressions
====================================================

Metadata
--------

- title: Golden Master Testing — Lock Inputs, Gate Regressions
- doc_type: two-pager
- timestamp: 2025-09-05T00:00:00Z
- tags: [golden-master, determinism, CI, replay, schema]
- summary: Store canonical inputs/outputs to detect behavioral drift with high signal and low noise.

Page 1 — Executive one‑pager (5W1H)
-----------------------------------

- Why: Complex systems drift. By freezing canonical inputs and expected outputs (goldens), we detect unintended changes early and deterministically.
- What: A replay harness that consumes stored inputs (e.g., JSONL traces) and compares new behavior to approved goldens using strict schemas and tolerances.
- Who: Teams with signal‑sensitive logic (vision, DSP, control, compilers, pricing engines).
- When: On every PR and release, with scheduled deeper checks.
- Where: Runs in CI, reproducible locally via a single script.
- How: Deterministic data production, strict validation, artifacted reports, and a tight review loop to update goldens when intended changes occur.

Benefits

- High confidence: eliminates flakiness from live data sources (webcams, sensors, networks).
- Fast iteration: small, fast tests that cover critical scenarios.
- Safe evolution: controlled golden updates document intended behavior changes.

Risks & mitigations

- Stale goldens: rotate and curate; encode versions and changelogs.
- Over‑fitting: include diverse but minimal scenario set; use invariants, not pixels only.
- Hidden nondeterminism: pin versions, freeze seeds, checksum assets.

Page 2 — Apply to PinchFSM and how to do it
-------------------------------------------

Contract

- Inputs: per‑frame landmarks JSONL `{ frameIndex, timestampMs, hands: [...] }`.
- Outputs: events JSON `{ tMs, type: Strike|Lift, velocity, confidence }` and optional UI state.
- Schemas: Zod or JSON Schema for landmarks/events; schema tests run in CI.

Deterministic data production

- Extract frames via ffmpeg at fixed fps; derive `timestampMs` from `frameIndex`.
- Run Human with pinned version and local models; CPU backend; no smoothing.
- Write one JSON object per frame (JSONL) as canonical input.

Replay harness

- PinchFSMRunner consumes JSONL and config; emits events and state.
- Comparator checks: hysteresis invariants, palm gate behavior, event timings within tolerance.
- Reporter produces a compact PASS/FAIL report and optional overlay images/videos.

Golden lifecycle

- Add new scenarios intentionally; store under `data/goldens/`.
- On intended behavior change: update goldens in a dedicated PR with rationale and diff.
- Keep scenario set small and meaningful; avoid brittle visuals—prefer metrics/invariants.

CI wiring

- Required job: schema tests on landmarks + PinchFSM replay against goldens + compare.
- Artifacts: JSONL inputs, events, and a short HTML/markdown report.
- Optional scheduled job: performance budgets (latency/FP rate) and overlay generation.

Scaffolding (learn‑by‑doing)

- Start with 2 seed videos; lock traces as JSONL; write schema tests that must pass.
- Add a minimal Runner that computes P, dP/dt, and hysteresis transitions.
- Grow coverage: add palm gate, Anchored state, and TOI step by step.

Next steps

- Implement PinchFSMRunner + Comparator following the contract.
- Add events schema + tests; integrate into existing CI workflow.
- Document golden update policy (owner, review template, tolerances).
