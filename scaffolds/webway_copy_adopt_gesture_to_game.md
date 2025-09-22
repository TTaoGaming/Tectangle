Hey---
id: ww-2025-092
owner: @TTaoGaming
status: active
expires_on: 2025-09-27
guard: "npm run -s hex:overlay:verify && npm run -s hex:test:unit"
flag: HEX_INPUT_BRIDGE
revert: remove sidecar/flag
---
# Webway: Copy-and-Adopt — Gesture → Game, Fast

## Goal

Make gestures behave like a reliable button/pointer and connect them to any HTML5 game without porting, so we can ship a PWA quickly and monetize with minimal custom code.

## Constraints

- License: Prefer MIT/BSD engines and assets; respect third‑party game licenses (source: message)
- Perf: Gesture→input latency ≤ 200 ms end-to-end (budget) (source: defaults)
- Deps: 1 small lib budget; adopt-first over invent (source: defaults)
- Privacy: no telemetry by default; local processing (source: defaults)
- Security: same-origin only for key/pointer synthesis; use iframe + postMessage (source: repo|message)
- CI: must keep existing hex unit + smoke green; new bridge behind HEX_INPUT_BRIDGE (source: repo|defaults)

## Current Map

- Webway notes exist for gesture→touch emulation and v3 open/lock (source: files)
- Silk Scribe has SRL/ADR around gesture adapters, golden MP4 CI, visuals API starter (source: files)
- Tasks available: Hex overlay verify, unit tests, golden smokes, Dino smoke (source: package.json|tasks)
- Today’s TODO outlines zero‑trust controller bring-up (FSM, sidecar predictor, telemetry) (source: September2025/TectangleHexagonal/TODO_2025-09-20.md)

## Timebox

timebox_minutes=20 (source: defaults)

## Research Notes

- MediaPipe Gesture Recognizer provides per-frame gesture + confidence (source: message)
- XState can enforce Open→Pose→Open with cooldown/hold timers (source: message)
- One-Euro filter for low-lag smoothing; standard in VR (source: message)
- Tone.js optional for musical scheduling/anticipation (source: message)
- Input shims: KeyboardEvent, PointerEvent, Gamepad emulation patterns exist on the web (source: message)
- Monetization backends (PlayFab/AccelByte/Beamable/Balancy) provide seasons, shop, currencies (source: message)
- Packaging: Workbox (PWA), Capacitor (store wrap) (source: message)
- QA: OpenTelemetry timing, Sentry, Playwright video goldens, Plausible analytics (source: message)

## Tool Inventory

- Scripts/Tasks: hex:overlay:verify; hex:test:unit; hex:goldens; hex:smoke:dino; hourly/weekly tiers (source: package.json|tasks)
- Smoke fixtures: MP4 replay goldens used in CI (source: repo)
- Silk Scribe indexes for SRL/ADR (source: files)

## Options (Adopt-first)

1. Baseline — Buttonization via postMessage key bridge
   - What: Map pinch:down/up → Space keydown/keyup inside same-origin game iframe; focus canvas.
   - Why: Zero game code changes; fastest to “fun.”
   - How: shell.onEvent → postMessage {type:'pinch-key'}; sidecar dispatches KeyboardEvent. Guarded by HEX_INPUT_BRIDGE.
   - Trade-offs: Keyboard-only; focus rules; same-origin requirement.

2. Guarded extension — Generic InputBridge adapters
   - What: KeyAdapter, PointerAdapter, TouchAdapter with FSM (O‑P‑O clutch), hysteresis, and One‑Euro smoothing.
   - Why: Unlock pointer/touch semantics and better UX; scale beyond key-based games.
   - Trade-offs: More tuning; needs calibration and telemetry.

3. Minimal adapter — Fingertip → pointer
   - What: Index fingertip → pointermove; pinch toggles mousedown/up; victory → contextmenu.
   - Why: Simplest “camera as touchscreen” probe.
   - Trade-offs: Risk of ghost clicks without persistence/locks.

## Recommendation

Land Option 1 today behind HEX_INPUT_BRIDGE. Extend toward Option 3 for immediate pointer emulation. Graduate to Option 2 after guard hardening and telemetry signals.

## First Slice (90‑min sprint)

1) Wrap recognizer outputs with One‑Euro filter; expose sliders.
2) XState gate with 200 ms cooldown; emit keydown/keyup.
3) Add Workbox for offline PWA.
4) Publish PWYW build on itch.io; Stripe checkout for tips.
5) License/reskin 2–3 HTML5 games; hook adapter.
6) Set up PlayFab/AccelByte seasons + rotating shop.

## Guard & Flag

- Guard: hex:overlay:verify and hex:test:unit PASS; any existing Dino/idle smokes stay PASS.
- Flag: HEX_INPUT_BRIDGE via URL param or build flag; default off in CI.

## Industry Alignment

- Standards: postMessage, KeyboardEvent/PointerEvent, PWA, ServiceWorker (source: message)
- State‑of‑the‑art: Gesture→input bridges in XR/hand‑tracking; One‑Euro smoothing (source: message)

## Revert

Disable HEX_INPUT_BRIDGE and remove sidecar/iframe wiring.

## Follow-up

- TTL check by 2025‑09‑27: false positives, latency budget, pointer calibration.
- Add OpenTelemetry span: gesture_detected → input_dispatched; wire Sentry perf.
- Add visual diffs with Playwright video goldens for regression safety.

---

One‑page setup (packages + defaults):

- Packages: xstate, one-euro-filter (or lightweight impl), workbox-build, tone (optional), @sentry/browser (optional)
- Defaults: cooldownMs=200; holdMs=150; oneEuro={minCutoff:1.0, beta:0.007}; key='Space'
- File surface: controllers/gateFsm.js; controllers/inputAdapter.js; controllers/touchSynth.js; dev/sidecars/*; tests/smoke/*
