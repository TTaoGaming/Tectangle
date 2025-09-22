---
id: ww-2025-085
owner: @webcartographer
status: active
expires_on: 2025-10-11
guard: ci:smoke-gesture-tasks-lookahead (SelectsPred ≥ 1 in 5s; predicted lead ≥ userLatencyMs)
flag: FEATURE_GESTURE_TASKS_BRIDGE, FEATURE_KALMAN_LOOKAHEAD, FEATURE_GAME_SEATING
revert: remove adapter/flags; drop smoke; restore baseline events
---
# Webway: Gesture Tasks + Kalman early lookahead for iframe games

## Goal
Adopt MediaPipe Tasks Gesture Recognizer to emit stable, labeled gestures and map them to synthetic input events with a configurable Kalman-based early lookahead. Use seating logic to target iframed games reliably. Keep it behind flags with a measurable CI guard and a clean revert.

## Constraints

- License: MediaPipe Tasks (Apache-2.0); align with repo license (source: defaults)
- Dependencies: +1 small lib (Gesture Recognizer) allowed; keep others unchanged (source: defaults)
- Perf: Predictive lead userLatencyMs ∈ [30, 120] ms; ≤ 200ms E2E jitter (source: defaults)
- Privacy/Security: local inference only; no telemetry; same-origin iframe or postMessage (source: message)
- CI: add minimal smoke using simulated recognizer outputs; must keep current tests green (source: message)

## Current Map

- Kalman primitives exist: `src/core/kalman1d.js`, `ports/toiKalmanPort.js` (source: repo)
- Game bridge and sidecar: `dev/sidecars/dino_sidecar.mjs` and prior v5/v7 demos (source: repo)
- Seating manager: `src/app/seatMagnetManager.js` for anchoring/autosnap (source: repo)
- XR emu and heuristic demos already feed Space to Dino via iframe (source: repo)

## Timebox

20 minutes planning + logs; 60–120 minutes for first guarded slice (adapter + smoke). (source: defaults)

## Research Notes

- MediaPipe Tasks Gesture Recognizer provides labels (e.g., Closed_Fist, Open_Palm, Pinch) and confidences—good for constrained gesture sets. (source: message)
- Early lookahead: use Kalman to predict short-horizon gesture onset and synthesize SelectPred with timestamp t+Δ; reconcile with actual Select when observed. (source: message)
- Seating: route events to active seat/game iframe via `gameEventBridge`; autosnap ensures consistent recipient during occlusion. (source: repo)
- Strangler fig: keep heuristic/XR emu path intact; introduce adapter under flags and flip per-demo. (source: message)

## Tool Inventory

- Tasks: local static server 8091; jest+puppeteer e2e harness; hex unit tests (source: tasks)
- Goldens: existing pinch video infra; can add small synthetic recognizer stream for smoke (source: tasks)
- Silk Scribe: SRL/ADR + indices (source: repo)

## Options (Adopt-first)

1. Baseline heuristic + Kalman lead — Keep the simple heuristic but add Kalman early lookahead and emit SelectPred; no new deps.
   - Trade-offs: fastest; weaker labels; good proof of latency tuning.
2. Guarded Gesture Tasks bridge — Add Tasks adapter behind `FEATURE_GESTURE_TASKS_BRIDGE`; map labels→events; Kalman predicts Δ ahead; add smoke with simulated labels.
   - Trade-offs: adds one dep; strong labels; CI guardable; reversible.
3. Full seating integration — Combine Option 2 with Seat Magnet autosnap and an animation-cancel hint channel for games that support it.
   - Trade-offs: larger slice; requires game-side support for cancel hints.

## Recommendation

Option 2: Introduce Gesture Tasks adapter with Kalman early lookahead behind flags and a minimal smoke. Iterate to Option 3 once stable.

## First Slice

- Adapter: `src/adapters/gestureTasksAdapter.mjs` loads MediaPipe Tasks (lazy) when `FEATURE_GESTURE_TASKS_BRIDGE=1` and exposes a stream `{label, score, ts}`.
- Mapping: configurable table (JSON) maps labels to actions (Select, Jump, Dash). Add `predictiveLatencyMs` (30–120).
- Kalman: 1D filter on gesture activation metric; synthesize `SelectPred` at `now + predictiveLatencyMs` when crossing threshold with confidence hysteresis.
- Bridge: send to `gameEventBridge` targeting active seat’s iframe (Dino as default).
- Test hook: if `window.__gtSim` present, adapter consumes its synthetic label frames for smoke.

## Guard & Flag

- Guard: `ci:smoke-gesture-tasks-lookahead` — headless loads a demo with adapter enabled; feeds 1–2 synthetic label frames via `__gtSim`; expects `SelectsPred ≥ 1` within 5s and lead time ≥ configured predictiveLatencyMs.
- Flags: `FEATURE_GESTURE_TASKS_BRIDGE`, `FEATURE_KALMAN_LOOKAHEAD`, `FEATURE_GAME_SEATING`.

## Industry Alignment

- Anticipatory input with short-horizon prediction is common in games; Kalman/One-Euro smoothing are standard. (source: message)
- MediaPipe Tasks provides robust labels for low-latency gesture UX on commodity devices. (source: message)
- Progressive adoption via flags and smokes matches strangler-fig modernization. (source: message)

## Revert

- Disable flags; remove adapter import; delete smoke test and mapping table; baseline heuristic/XR emu remains.

## Follow-up

- Capture mini goldens for key gestures; add hysteresis tuning per label.
- Expose `predictiveLatencyMs` in UI; add per-seat configs.
- Explore animation-cancel hints channel for supported games; measure UX gain.
