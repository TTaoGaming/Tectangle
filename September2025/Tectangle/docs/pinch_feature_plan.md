# Pinch Feature Plan — Minimal Palm‑Gated Pinch for MVP

Source-of-truth references:
- [`September2025/Tectangle/diagnostics/triage/triage-report.md`](September2025/Tectangle/diagnostics/triage/triage-report.md:1)
- [`September2025/Tectangle/prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:1)
- [`September2025/Tectangle/prototype/landmark-raw/index.html`](September2025/Tectangle/prototype/landmark-raw/index.html:1)
- [`September2025/Tectangle/prototype/common/manager-bootstrap.js`](September2025/Tectangle/prototype/common/manager-bootstrap.js:1)
- [`September2025/Tectangle/src/gesture/pinchBaseline.js`](September2025/Tectangle/src/gesture/pinchBaseline.js:1)
- [`September2025/Tectangle/src/telemetry/pinchTelemetry.js`](September2025/Tectangle/src/telemetry/pinchTelemetry.js:1)
- [`September2025/Tectangle/tests/smoke/pinch.baseline.smoke.test.mjs`](September2025/Tectangle/tests/smoke/pinch.baseline.smoke.test.mjs:1)
- [`September2025/Tectangle/tests/golden/pinch_baseline_01.jsonl`](September2025/Tectangle/tests/golden/pinch_baseline_01.jsonl:1)

1. SUMMARY

Single-index-thumb, palm-gated pinch using OneEuro smoothing, knuckle-span normalization, a forgiving 2D palm cone gate, hysteresis + debounce, a simple kinematic plausibility clamp, basic TOI prediction, and a small FSM that emits canonical events (pinch:down / pinch:up) mapped to synthetic key events.

2. MVP Feature List

- Palm gate (forgiving cone) to reduce false positives
- Knuckle-span normalization with user knob (default 8 cm)
- OneEuro smoothing applied per fingertip coordinate
- Normalized distance metric and hysteresis enter/exit thresholds
- Debounce timers for deterministic event timing
- Simple kinematic clamp (velocity/accel plausibility)
- Predictive TOI (constant-velocity + optional 1-state KF)
- Pinch FSM that emits pinch:down and pinch:up; maps to synthetic keydown/keyup/hold
- Minimal telemetry counters and deterministic golden-trace smoke tests

3. DECISION

Favoring a single reliable palm-gated index↔thumb pinch keeps implementation minimal, deterministic for smoke tests and golden traces, and reliably usable on commodity cameras. This approach minimizes compute and tuning surface (good for early monetization by shipping a dependable input primitive quickly) while allowing progressive enhancement (depth, wrist quaternion) later.

4. ALGORITHMIC RECIPE

Required inputs (per-frame)

- landmarks: index_tip (2D or 3D), thumb_tip (2D or 3D)
- palm_center (2D) or palm landmarks to estimate normal
- wrist vector (2D vector across wrist or wrist point to palm point)
- optional depth or real-world scale (z or known knuckleSpanCm calibration)
- timestamp (ms) for each frame

Preprocessing

- Coordinate normalization: work in normalized camera pixel coordinates (e.g., viewport pixels → [0,1]) or world meters when depth available.
- Compute knuckle span estimate:
  - If depth/scale available, use real-world landmark distance between index MCP and little MCP as knuckleSpanCm.
  - Else expose UI knob defaulting to 8 cm and compute a pixel-to-cm normalization factor by: knuckleSpanPixels = userKnuckleSpanCm * pixelsPerCm (approx via a calibration frame if available) or treat knuckleSpanPixels as relative baseline.
- Compute normalized time delta dt between frames and cap dt (e.g., maxDt = 40 ms) for stability.

OneEuro smoothing (apply per fingertip coordinate)

- Defaults: minCutoff = 1.0 Hz, beta = 0.01, dCutoff = 1.0 Hz (see params section).
- Implement OneEuro per scalar channel (x, y, optionally z). Keep a single OneEuro state per channel per finger.
- Pseudocode header:
[`javascript.declaration()`](September2025/Tectangle/src/gesture/pinchBaseline.js:1)
```javascript
// OneEuro per channel
state = {xFilter, yFilter, dx, prev, prevTime}
function oneEuroUpdate(filter, x, t, params) {
  // compute dx/dt, adapt cutoff, low-pass filter, return smoothed x
}
smoothed = {
 x: oneEuroUpdate(state.xFilter, raw.x, t, params),
 y: oneEuroUpdate(state.yFilter, raw.y, t, params)
}
```

Palm gating (cone test)

- Approximate palm normal in 2D:
  - If palm normal landmark available, use it.
  - Else approximate palm normal from wrist→palm vector and index_mcp→ring_mcp cross direction projected into camera plane.
- Cone test:
  - Project vector from camera-facing direction to palm normal; compute angle between palm normal and camera axis (z axis). For 2D fallback, require wrist vector to have palm roughly facing camera by checking sign/direction and opening angle.
  - Default acceptance cone: coneAngleDeg = 30 deg (forgiving); smaller angle = stricter.
- Expose knob to disable gating for debug.

Distance metric & normalization

- rawDistance = euclideanDistance(smoothed.index_tip, smoothed.thumb_tip) // px or meters
- knuckleSpanNormalizedDistance = rawDistance / knuckleSpan // dimensionless
- Keep rawDistance available for thresholding when depth provided.

Hysteresis & Debounce

- Use normalized thresholds:
  - enterThreshold = 0.15 (pinch detected when normalized distance < enterThreshold)
  - exitThreshold = 0.22 (releases when normalized distance > exitThreshold)
- Debounce times:
  - enterDebounceMs = 40 ms (require stable below enter for this duration)
  - exitDebounceMs = 40 ms
- Also apply a frame-count guard to ensure deterministic behavior in smoke tests; prefer ms timers tied to timestamps.

Kinematic clamp (plausibility filter)

- Compute fingertip velocity v = (pos - prevPos) / dt (per channel and magnitude)
- Thresholds:
  - maxVelPxPerS = 5000 px/s (or maxVelMPerS when world units)
  - maxAccPxPerS2 = 20000 px/s^2
- If |v| or a = |v - prevV|/dt exceed thresholds, clamp to max or reject the frame update and keep previous smoothed value for that finger to avoid spikes.

Predictive TOI (time-of-impact) estimate

- Use constant-velocity TOI for better early detection:
  - If finger tips moving toward each other, estimate t_hit = (rawDistance - targetDistance) / relativeSpeed, where targetDistance = enterThreshold * knuckleSpan
  - Use t_hit only if t_hit within [0, 200 ms] to avoid long extrapolation.
- Optional 1-state Kalman for velocity smoothing (KF over scalar relative distance or velocity). Keep Q/R small; pseudocode below.

[`javascript.declaration()`](September2025/Tectangle/src/gesture/pinchBaseline.js:1)
```javascript
// Simple KF 1-state for relative velocity (optional)
state = {x:0, P:1}
function kfPredict(state, dt, Q) { state.P += Q*dt; }
function kfUpdate(state, meas, R) {
  K = state.P / (state.P + R)
  state.x += K * (meas - state.x)
  state.P = (1 - K) * state.P
}
```

Pinch FSM → key synthesis

- States: Idle, PrePinch, Pinched, ReleasePending
- Events:
  - palm_gated (bool)
  - normDistBelowEnter (bool)
  - normDistAboveExit (bool)
  - enterDebounceElapsed, exitDebounceElapsed
  - kinematicReject (frame)
- Timeouts:
  - holdTimeoutMs = 500 ms (after pinch confirmed, classify as long hold)
  - autoReleaseMaxMs = 5000 ms (safety auto-release)
- Actions:
  - When entering Pinched (enterDebounce confirmed and palm_gated true) emit 'pinch:down' and synthKeyDown(keyCode)
  - While Pinched hold, optionally emit synthetic key repeat or keep key held
  - On Release (exitDebounce confirmed or autoRelease) emit 'pinch:up' and synthKeyUp(keyCode)
- Use deterministic ordering: check palm gating first, smoothing second, thresholds third, then FSM transitions.

FSM pseudocode
[`javascript.declaration()`](September2025/Tectangle/src/gesture/pinchBaseline.js:1)
```javascript
state = Idle
onFrame(frame) {
  if not palmGated(frame) { goto Idle; }
  updateSmoothedPositions(frame)
  d = normalizedDistance(frame)
  if state==Idle and d < enterThreshold {
    startTimer(enterDebounceMs)
    state = PrePinch
  } else if state==PrePinch and timerElapsed(enterDebounceMs) and d < enterThreshold {
    emit('pinch:down')
    synthKeyDown(key)
    startTimer(holdTimeoutMs)
    state = Pinched
  } else if state==Pinched and d > exitThreshold {
    startTimer(exitDebounceMs)
    state = ReleasePending
  } else if state==ReleasePending and timerElapsed(exitDebounceMs) and d > exitThreshold {
    emit('pinch:up')
    synthKeyUp(key)
    state = Idle
  }
  // auto-release
  if state==Pinched and timeSince(pinchedAt) > autoReleaseMaxMs { emit up; synthKeyUp; state=Idle }
}
```

Default numeric parameters

- knuckleSpanCm: 8.0
- coneAngleDeg: 30
- oneEuro: { minCutoffHz: 1.0, beta: 0.01, derivCutoffHz: 1.0 }
- enterThreshold (normalized): 0.15
- exitThreshold (normalized): 0.22
- enterDebounceMs: 40
- exitDebounceMs: 40
- holdTimeoutMs: 500
- autoReleaseMaxMs: 5000
- maxVelPxPerS: 5000
- maxAccPxPerS2: 20000
- kf: { Q: 1e-3, R: 1e-2 }

5. TELEMETRY & TESTS

Minimal telemetry keys

- pinch.count_down (counter)
- pinch.count_up (counter)
- pinch.false_positive (counter when palm not gated but entered)
- pinch.mean_down_duration_ms (histogram)
- pinch.toi_prediction_ms (histogram)

Test artifacts to produce (deterministic)

- Golden trace JSONL: a canonical run exporting frame timestamps, raw landmarks, smoothed normalizedDistance, FSM state transitions, and emitted events for comparison with [`September2025/Tectangle/tests/golden/pinch_baseline_01.jsonl`](September2025/Tectangle/tests/golden/pinch_baseline_01.jsonl:1)
- Smoke test: deterministic synthetic frames replayed through the pipeline asserting pinch:down/up timings and telemetry counters, update [`September2025/Tectangle/tests/smoke/pinch.baseline.smoke.test.mjs`](September2025/Tectangle/tests/smoke/pinch.baseline.smoke.test.mjs:1)
- Hook telemetry recording into [`September2025/Tectangle/src/telemetry/pinchTelemetry.js`](September2025/Tectangle/src/telemetry/pinchTelemetry.js:1) for counters

6. API & UI knobs

Config object shape (example)

```json
{
  "knuckleSpanCm": 8.0,
  "coneAngleDeg": 30,
  "hysteresisEnter": 0.15,
  "hysteresisExit": 0.22,
  "enterDebounceMs": 40,
  "exitDebounceMs": 40,
  "holdTimeoutMs": 500,
  "autoReleaseMaxMs": 5000,
  "oneEuro": { "minCutoffHz": 1.0, "beta": 0.01, "derivCutoffHz": 1.0 },
  "kinematic": { "maxVelPxPerS": 5000, "maxAccPxPerS2": 20000 },
  "kf": { "Q": 0.001, "R": 0.01 }
}
```

UI knobs to expose (prioritized)

- knuckle span (cm) — default 8
- cone angle (deg) — default 30
- smoothing strength (OneEuro beta)
- hysteresis thresholds (enter/exit)
- debug toggle: show smoothed traces, gating, and predicted TOI

7. IMPLEMENTATION PLAN (milestones)

- 1 hour (quick): Wire palm gating + normalized distance check; add UI knob (knuckle span) and console logs. Touch files: startup bootstrap and pinchBaseline hook. Make config defaults accessible.
- 1 day (complete MVP): Add OneEuro smoothing, hysteresis, debounce timers; implement FSM to emit canonical events pinch:down/pinch:up; add telemetry counters hooks. Add a small debug demo page reusing [`September2025/Tectangle/prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:1)
- 1 week (hardening): Add kinematic clamp, predictive TOI path and optional 1-state KF, generate golden trace, write smoke test(s) (`[`September2025/Tectangle/tests/smoke/pinch.baseline.smoke.test.mjs`](September2025/Tectangle/tests/smoke/pinch.baseline.smoke.test.mjs:1)`), tune parameters against golden traces, add demo with a tipping button.

8. INTEGRATION NOTES

- Baseline implementation should live adjacent to and eventually replace parts of [`September2025/Tectangle/src/gesture/pinchBaseline.js`](September2025/Tectangle/src/gesture/pinchBaseline.js:1)
- Publish canonical events via the app event bus used in the project (example channel name: 'pinch') and as DOM synthetic keyboard events for downstream consumers:
  - dispatchEvent(new CustomEvent('pinch:down', {detail:{key:'Space'}}))
  - dispatchEvent(new CustomEvent('pinch:up', {detail:{key:'Space'}}))
- Telemetry integration point: [`September2025/Tectangle/src/telemetry/pinchTelemetry.js`](September2025/Tectangle/src/telemetry/pinchTelemetry.js:1)
- Update smoke and golden tests at:
  - [`September2025/Tectangle/tests/smoke/pinch.baseline.smoke.test.mjs`](September2025/Tectangle/tests/smoke/pinch.baseline.smoke.test.mjs:1)
  - [`September2025/Tectangle/tests/golden/pinch_baseline_01.jsonl`](September2025/Tectangle/tests/golden/pinch_baseline_01.jsonl:1)

9. INDUSTRY BEST PRACTICES (concise)

- Gate early: use palm orientation before computing expensive heuristics.
- Smooth locally: OneEuro per channel is low-cost and stable for UI input.
- Normalize distances by anatomy for cross-device consistency (knuckle span).
- Use asymmetric hysteresis for robust entry/exit behavior.
- Clamp implausible kinematics to avoid camera tracking spikes causing false taps.
- Keep UI knobs small and discoverable for power users and tuning.
- Provide deterministic replay traces for testability (JSONL golden traces).
- Progressive enhancement: allow depth/wrist quaternion to improve stability but do not require.
- Emit canonical events and safe synthetic key events (keydown on down, keyup on up); avoid repeated keydown spam.

10. RISKS & MITIGATIONS

- Lighting/occlusion causing intermittent landmark loss
  - Mitigation: palm gating + kinematic clamp + hold auto-release.
- Users with small hands / nonstandard spans
  - Mitigation: make knuckleSpanCm adjustable and provide calibration flow.
- False positives when other fingers occlude thumb/index
  - Mitigation: tighten cone gating by default and expose debug toggle.
- Mobile performance limits
  - Mitigation: keep per-frame computation minimal; OneEuro is O(1) per channel.

11. NEXT STEPS (exactly 6)

1) Create new implementation file and config: add [`September2025/Tectangle/src/gesture/pinchFeature.js`](September2025/Tectangle/src/gesture/pinchFeature.js:1) with exported factory createPinchFeature(config).
   - Command: git checkout -b feat/pinch-minimal && git add ...
2) Wire palm gating + knuckle-span knob in bootstrap/demo page: update [`September2025/Tectangle/prototype/common/manager-bootstrap.js`](September2025/Tectangle/prototype/common/manager-bootstrap.js:1) to expose config UI.
   - Command: git add changes && git commit -m "feat(pinch): add palm gate and knuckle-span knob"
3) Implement OneEuro smoothing + hysteresis + FSM in [`September2025/Tectangle/src/gesture/pinchFeature.js`](September2025/Tectangle/src/gesture/pinchFeature.js:1).
   - Command: git commit -m "feat(pinch): smoothing+hysteresis+fsm"
4) Add telemetry hooks into [`September2025/Tectangle/src/telemetry/pinchTelemetry.js`](September2025/Tectangle/src/telemetry/pinchTelemetry.js:1) and increment counters on events.
   - Command: git commit -m "chore(pinch): telemetry hooks"
5) Record golden trace run and add smoke test: generate [`September2025/Tectangle/tests/golden/pinch_baseline_01.jsonl`](September2025/Tectangle/tests/golden/pinch_baseline_01.jsonl:1) and update [`September2025/Tectangle/tests/smoke/pinch.baseline.smoke.test.mjs`](September2025/Tectangle/tests/smoke/pinch.baseline.smoke.test.mjs:1).
   - Command: node scripts/generate_pinch_trace.js
6) Demo and QA: create demo page reusing [`September2025/Tectangle/prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:1) and run manual validation for 1 week.
   - Command: git push origin feat/pinch-minimal && open PR

--- 

Appendices

- See investigation notes and triage: [`September2025/Tectangle/diagnostics/triage/triage-report.md`](September2025/Tectangle/diagnostics/triage/triage-report.md:1)
- Prototype examples: [`September2025/Tectangle/prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:1)
- Baseline reference: [`September2025/Tectangle/src/gesture/pinchBaseline.js`](September2025/Tectangle/src/gesture/pinchBaseline.js:1)
