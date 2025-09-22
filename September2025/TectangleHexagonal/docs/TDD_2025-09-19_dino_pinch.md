# TDD Plan — Dino pinch with Kalman lookahead (2025-09-19)

Scope

- Map fused Pinch FSM to Dino Space key (P1 first, then P2).
- Predictive latency: Kalman/One-Euro + Time-of-Impact (TOI_pred vs TOI_actual) telemetry.
- Triple-check fusion: distance ratio (hysteresis), velocity/accel, joint-angle delta; sticky FSM.

Contracts

- Input: Pinch events (Armed/Triggered/Held/Released) with per-frame kinematics and angles.
- Output: Keyboard events (Space down/up), telemetry JSONL entries with TOI fields, Side Panel counters.
- Errors: Debounce repeated downs during Held; never emit when gated (palm-away).

Unit tests

- Adapter emits Space keydown on Triggered and keyup on Released; no extra events while Held.
- Velocity gate: toward triggers; away releases; same-direction hand motion ignored.
- Hysteresis: enter < exit thresholds respected; configurable.
- Joint-angle delta: triggers only when bend exceeds threshold.

Integration tests

- Fuse three checks → confidence passes; FSM transitions clean (Triggered→Held→Released).
- Config slider updates smoothing deterministically (One-Euro/Kalman scale).
- P2 adapter independent from P1; no cross-talk.

Offline smoke tests

- Positive: palm-forward JSONL triggers exact N downs/ups.
- Negative: palm-away JSONL never triggers.
- Guard: TOI_pred within Δt window of TOI_actual; counts match goldens.

Acceptance criteria

- Felt latency ≲ 25 ms in headed mode; no double-fires; false positives ≤ 2% on clips.
- Telemetry export includes TOI_pred, TOI_actual, Δt, thresholds used, and confidence breakdown.

Notes

- Use WEBWAY:ww-2025-073 markers in changed files.
- Feature flag: FEATURE_DINO_PINCH.
- Wire into hex:tier:commit and nightly guard after green locally.
