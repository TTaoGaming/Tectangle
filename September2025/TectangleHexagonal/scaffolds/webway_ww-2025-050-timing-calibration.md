# WEBWAY:ww-2025-050 — Timing Canon + Online Calibration (TTI)

Expires: 2025-10-09 (TTL 21 days)

Owner: Tectangle SDK (Hex Ports/Adapters)

Status: draft → adoptable

## Intent

- Standardize time across the app and instrument Time-To-Impact (TTI) for pinches.
- Let users set lookahead (ms), hysteresis, palm ratio, and absolute distance measures; the system tunes filters (Kalman, One Euro) to meet that lookahead in practice.
- Run a safe online calibration loop: small per-minute nudges, self-correcting, with guard rails. Report confidence and error-rate.

## Scope & Canon

- Single timebase: monotonic high-resolution clock. Use performance.now() (ms, float) for all runtime metrics; never Date.now() for timing.
- Event timing: every port emits timestamps sourced from the shared clock; media-frame times map into this clock when possible (use requestVideoFrameCallback timestamp if available; otherwise stamp on draw).
- Metrics gathered per pinch:
  - t_user_lookahead_ms (configured)
  - t_pred_trigger (ms, predicted lookahead trigger moment)
  - t_actual_cross (ms, moment actual hysteresis crosses)
  - tti_pred_ms = (t_actual_cross - t_pred_trigger)
  - err_ms = tti_pred_ms - t_user_lookahead_ms
  - optional: palm_ratio, absolute_distance_cm, smoothing_cutoff, kalman_{q,r}
- Success criteria: |median(err_ms)| ≤ 10% of lookahead; 90p(err_ms) within 20%; trending to zero with use.

## Guards

- No local timers inside views; views only read from SDK ports/adapters.
- Online updates bounded: per-minute max parameter delta; rollback if error increases for two windows.
- Privacy: samples are local; aggregation stays on-device.

## Approach (tiers)

1) Baseline: record-only. Compute TTI and err_ms; surface live score and rolling stats. No parameter changes.

2) PID-style nudger: adjust a small set of params (e.g., Kalman q/r, One Euro cutoff) using bounded proportional/integral update to reduce err_ms bias.

3) Evolutionary strategy (CMA-ES) micro-tuner: background worker proposes tiny perturbations; select best on err_ms over short windows, respect guard rails.

4) Contextual elites (Map-Elites): maintain elite params keyed by context bins (lighting, hand size, distance); switch smoothly between elites as context changes.

## Precedents

- Adaptive filtering (one euro, Kalman) with online noise estimation.
- Online hyperparameter tuning via ES/BO in HCI latency studies.
- Contextual bandits for per-user personalization with safety constraints.

## Contract (ports/adapters)

- Clock: sdk.clock.now() → ms; sdk.clock.fromVideo(ts) maps media timestamp to now()-space when available.
- Telemetry port emits pinch samples: { t_user_lookahead_ms, t_pred_trigger, t_actual_cross, err_ms, seat, handId, context }.
- Calibrator service consumes samples, publishes parameter deltas via sdk.calibration.set({ oneEuroCutoff, kalman: { q, r } , hysteresis, palmRatio }).

## Rollout

- Phase A (this TTL): add telemetry fields, central clock, live err_ms & confidence readouts; no automatic tuning.
- Phase B: PID nudger behind feature flag; per-minute bounded adjustments; A/B with holdout.
- Phase C: CMA-ES worker optional; opt-in; export elites; prepare Map-Elites scaffolding.

## Revert path

- Disable calibration flags; keep telemetry recording only. Parameters fall back to defaults in AppShell config.

## Markers

- WEBWAY:ww-2025-050 present in code where timing is stamped and where calibrator is wired. Remove when canon fully adopted.
