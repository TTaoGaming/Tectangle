# TDD Playbook - Gesture->Touch Controller (predictive, held-state, goldens)

## 0) Definition of Ready (before any code)

* Tooling: Node + PNPM, Vite (web), Vitest (unit), Playwright (golden/e2e), ESLint/Prettier.
* Folders:

```
/controllers   (InputAdapter, GateFSM, Predictor, TouchSynth, Bus)
/ui            (Material Web shell, WinBox windows)
/tools         (Timer, Knob, Slider, etc.)
/telemetry     (schema + writer)
/fixtures      (mp4 + golden.jsonl)
/config        (controller.json)
/scripts       (golden tools)
/docs
```

* Schemas: telemetry.schema.json (Ajv), controller.schema.json (knobs: K, tau_fire, tau_release, cooldownMs, response_lead_ms, confirm_window_ms, hold_ms, double_tap_ms, drag_threshold_px, bpm, grid, quantize_on).
* Two MP4 fixtures (10-20 s each):
  * tap_1p.mp4 (Open_Palm -> Fist taps, no drag)
  * hold_drag_1p.mp4 (Open_Palm -> Fist hold -> drag -> release)
* Golden JSONL for each MP4 (hand-labelled once).

---

## 1) Test Pyramid and Order (red -> green -> refactor)
Unit (fast) -> Model (statecharts) -> Integration (golden replay) -> E2E (UI shell).

### Phase A - Units (pure logic)
1. GateFSM (O-P-O clutch)
   * Given 4 consecutive Open_Palm frames -> PRIMED.
   * Given 4 consecutive Closed_Fist frames with score >= 0.8 -> FIRED once.
   * Hysteresis: release only when score <= 0.6 for K frames.
   * Cooldown enforces no second fire within 150-200 ms.
2. Predictor (sidecar)
   * Linear slope over last 5 frames predicts t_pred.
   * Emits PREPARE_DOWN at t_pred - delta_safe only if velocity >= v_min and window <= 200 ms.
   * Confirms when true crossing occurs within +/- epsilon; cancels otherwise.
   * Auto-disables when fps < 24 or confirm rate < 70% (last 10 events).
3. TouchSynth (touch semantics)
   * DOWN->UP < 160 ms and move < 8 px => TAP.
   * Two TAPs within 250 ms, < 12 px => DOUBLE_TAP.
   * DOWN duration >= 500 ms => HOLD_START (and HOLD_END on UP).
   * Move > 12 px while DOWN/HOLD => DRAG_START/DRAG_MOVE/DRAG_END.
   * Accepts predicted DOWN as "pre-arm" signal but only commits on confirm.

Write these as pure tests with synthetic sequences (no DOM, no video).

### Phase B - Model tests (XState)
* Import machines; test transitions with timers/guards using XState test utilities.
* Paths: IDLE->PRIMED->ARMED->FIRED->COOLDOWN->IDLE.
* Predictor submachine: IDLE->PREDICTED->CONFIRMED|CANCELED.
* TouchSynth: IDLE->DOWN->(HOLD|DRAG|UP) with time-based assertions.

### Phase C - Integration (golden MP4 -> JSONL)
* Replay harness (Playwright/Chromium):
  * Load fixture MP4 into <video>; drive frames via requestVideoFrameCallback.
  * Feed frames to InputAdapter (no real camera).
  * Collect emitted bus events into JSONL.
* Diff against *.golden.jsonl with tolerances: time +/-30 ms, pixels +/-5.
* Assertions:
  * False-fire rate <= 1%/min.
  * Missed-fire rate <= 2%/min.
  * Median latency (DOWN confirm - visual change in MP4 tag) <= 120 ms.
  * Predictor early-hit share between 30-70% (sanity).

### Phase D - E2E (UI shell)
* Mount Material Web shell + WinBox windows.
* Verify:
  * PWA offline run (service worker) with context.routeFromHAR or browserContext.setOffline(true).
  * Settings page toggles (lead ms, hold ms) affect behavior in replay.
  * Logs viewer shows events; Download saves JSONL; Ajv validates schema.

---

## 2) Test DSL (for fast unit/model tests)
Define a tiny sequence helper so agents can author tests quickly:

```ts
// frame(label, score_fist, x, y, fps=30, dt=33ms)
seq()
  .f("Open_Palm", 0.1, 0.5, 0.5).repeat(4)     // prime
  .rampTo("Closed_Fist", 0.85, 5)              // 5 frames rising to 0.85
  .hold(6)                                     // sustain fist 6 frames
  .to("Open_Palm", 0.2).repeat(4)
  .done()
```

Assertions (examples):

* expect(events).toContainInOrder(["PREPARE_DOWN","POINTER_DOWN","TAP"]);
* expect(metrics.confirmRate).toBeGreaterThan(0.7);

---

## 3) Golden JSONL schema (events and metrics)

```json
{"t":1234,"type":"PREPARE_DOWN","x":0.62,"y":0.41,"predicted":true}
{"t":1288,"type":"POINTER_DOWN","x":0.62,"y":0.41,"label":"Closed_Fist","score":0.84}
{"t":1410,"type":"POINTER_UP","x":0.62,"y":0.41}
{"t":1410,"type":"TAP"}
```

* Validate with Ajv in CI.
* Add a summary row per run (falseFireRate, missedFireRate, medianLatencyMs, fpsMedian).

---

## 4) CI gates (fail the build if these break)

* Lint/format (ESLint/Prettier).
* Unit/Model tests (Vitest): 100% pass.
* Golden replay (Playwright): JSONL diffs within tolerance; metrics within bounds.
* Bundle budgets: core gz <= 300 KB; warn at 350 KB.
* Offline check: PWA starts and runs fixtures with setOffline(true).
* Perf fallback check: simulated FPS=20 triggers predictor auto-disable (assert in logs).

---

## 5) First red tests to write (copy these titles)

1. GateFSM: primes after K consecutive Open_Palm frames
2. GateFSM: fires once when Closed_Fist >= tau_fire for K frames then enters cooldown
3. Predictor: emits PREPARE_DOWN at t_pred - delta_safe only when slope >= v_min
4. Predictor: cancels if true crossing not observed within +/- epsilon_confirm
5. TouchSynth: TAP when DOWN->UP < tap_max_ms and move < drag_threshold_px
6. TouchSynth: HOLD_START at hold_ms; HOLD_END on UP
7. TouchSynth: DRAG_* when movement exceeds threshold
8. Golden(tap_1p): sequence matches .golden.jsonl within tolerance
9. Golden(hold_drag_1p): held and drag semantics reproduce exactly
10. PerfFallback: predictor auto-disables when fps < 24 (simulated)

---

## 6) Minimal scripts (agents can fill in)

* pnpm test -> Vitest (units + models)
* pnpm test:golden -> Playwright runner (mp4->jsonl diff)
* pnpm test:ci -> both + size check
* pnpm gen:golden tap_1p -> regenerate golden from current controller (manual approval step)

---

## 7) Acceptance Criteria (Tier 0-1 "Done")

* Functionality: TAP/DOUBLE/HOLD/DRAG work against MP4 fixtures; predictor improves subjective feel without increasing false fires > 1%/min.
* Observability: XState Inspector shows expected transitions; HUD overlay displays PREPARE/DOWN/HOLD/DRAG/UP in real time.
* Portability: Works offline (airplane-mode) with cached .task + WASM.
* Safety: Logs stay local; no network needed to play or test.
* Docs: /docs/CONTROLS.md (knobs), /docs/TDD.md (this file), /docs/TELEMETRY.md (schema).

---

## 8) Nice-to-have (after green)

* Property-based tests (fast-check) for random jitter in scores/positions.
* Quantization tests (Tone.js): PREPARE snaps to grid; commit still requires confirm.
* Multiplayer zone tests: left/right claim logic; dropout pause/resume.
* Device matrix: a small manual checklist (Pixel 7a 480p/30, Chromebook 720p/30).

---

TL;DR: Start with red tests for GateFSM, Predictor, and TouchSynth; add the golden replay early; wire CI gates so agents cannot regress timing or stability. Everything else (UI, tools, skins) hangs off the event bus and relies on these tested contracts.


