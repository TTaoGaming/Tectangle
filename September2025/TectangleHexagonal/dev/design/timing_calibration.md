# Timing Standardization and Online Calibration (TTI)

WEBWAY:ww-2025-050 — reference design

This doc specifies the contract, equations, and telemetry schema for standardizing time and measuring Time-To-Impact (TTI) across the SDK, with an online calibration loop.

## Contract

- Clock: `sdk.clock.now()` → ms float monotonic (performance.now()).
- Video mapping: `sdk.clock.fromVideo(vts)` → map media timestamp to monotonic; fallback: stamp on arrival.
- Telemetry: `pinch_sample` per event:
  - t_user_lookahead_ms
  - t_pred_trigger
  - t_actual_cross
  - tti_pred_ms = t_actual_cross - t_pred_trigger
  - err_ms = tti_pred_ms - t_user_lookahead_ms
  - context: seat, handId, palm_ratio, abs_distance_cm, smoothing_cutoff, kalman.{q,r}

## Equations

- One Euro cutoff: `fc = fc_min + beta * |dx/dt|`
- Kalman update (1D): standard predict/update with process noise q, measurement noise r.
- Error metrics: median(err_ms), 90p(err_ms), rolling mean/std.

## Calibration loop (tiers)

1) Observe only: collect samples, show live score/confidence.
2) PID nudger: `delta = kp * bias + ki * integral` bounded per-minute; apply to q/r or cutoff.
3) CMA-ES micro-tuner (opt-in): propose parameter vectors; select by minimizing |err_ms| over small windows.
4) Map-Elites (future): maintain elites by context bins; switch smoothly.

## Telemetry storage

Append JSONL: `September2025/TectangleHexagonal/telemetry/pinch_tti.jsonl`

Schema example:

```jsonl
{"t":123456.78,"lookahead_ms":200,"pred":123320.00,"actual":123520.00,"tti":200.00,"err":0.00,"seat":"P1","handId":"R","ctx":{"palm_ratio":0.62,"abs_cm":7.9,"kalman":{"q":0.01,"r":0.001}}}
```

## UI

- Show small HUD: target lookahead, current 50p/90p err, confidence 0..1.
- Report per-seat metrics.

## Safety

- Feature flags; bounded updates; instant revert on degradation.
