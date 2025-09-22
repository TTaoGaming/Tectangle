# Notes: Consolidated Pinch Report (2025-09-06)

- Summary: Ship a minimal palm‑gated index↔thumb pinch now (Exploit path), then harden via golden‑trace‑driven CI and a focused 1‑week stabilization sprint.

## Key Decisions
- Exploit first: Guard bootstrap (avoid top‑level await aborts), keep existing src demo wiring, add a thin pinch→keypress bridge.
- Reuse baseline: Use deterministic pinch baseline detector already validated by smoke tests.
- Evidence‑driven hardening: Record golden traces and gate with CI to prevent regressions; tune thresholds from telemetry.
- Architecture posture: Favor ports/adapters shape; integrate external stacks (e.g., MediaPipe) via adapters after MVP is reliable.

## Minimal Pinch Pipeline (MVP)
- Inputs: index_tip, thumb_tip, palm/wrist landmarks, timestamp; optional depth/scale.
- Normalize: knuckle‑span ratio (index_mcp↔pinky_mcp) or fixed cm knob; operate in normalized units.
- Smooth: OneEuro per scalar channel (x,y, z optional); conservative defaults.
- Palm gate: cone ~30°; debug‑toggleable.
- Hysteresis: enter ~0.15–0.40, exit ~0.22–0.75; debounce ~40ms.
- Kinematic plausibility: velocity/acceleration clamp; reject spikes.
- FSM: simple 4‑state pinch FSM; emit keypress on enter/exit.

## Testing & CI
- Smoke replay: `tests/replay/replay_core_from_trace.mjs` against `tests/landmarks/*.landmarks.jsonl`.
- Golden traces: capture and store deterministic inputs; compare envelopes.
- Frozen expectations: enforce downs/ups counts via config; fail on mismatch.
- CI gate: PRs must pass smoke + frozen expectations; demo bootstrap must not abort.

## 7‑Day Stabilization (Highlights)
- Day 0–1: Guard bootstrap; wire pinch→keypress; verify demo path; basic telemetry.
- Day 2–3: OneEuro tuning; cone‑gate defaults; hysteresis/debounce; kinematic clamp.
- Day 4: Golden trace recording; envelope baselines; frozen expectations.
- Day 5: CI integration; smoke runner in pipeline; failure surfacing.
- Day 6–7: Telemetry review; threshold polish; docs and handoff.

## Risks & Constraints
- Demo fragility: top‑level await rejects can abort module evaluation.
- Mixed module systems: legacy CJS can break Node ESM runs.
- Device variance: must use normalization + smoothing to stay device‑agnostic.
- Constraint defaults: reuse goldens, Node ≥ 18, avoid heavy deps; mid‑range device targets.

## Immediate Actions (Today)
- Patch demo bootstrap with try/catch; set a health flag; fallback path in `Start()`.
- Add pinch→keypress bridge; verify in the demo.
- Run smoke on any available traces; capture at least one golden.
- Freeze downs/ups expectations; add CI gate.

## Provenance
- Decision: `September2025/Tectangle/docs/pinch_mvp_decision.md:1`
- Feature plan: `September2025/Tectangle/docs/pinch_feature_plan.md:1`
- Root cause: `September2025/Tectangle/diagnostics/TESTS_VS_DEMO_ROOT_CAUSE_2025-09-06.md:1`
- Replay runner: `tests/replay/replay_core_from_trace.mjs:1`

