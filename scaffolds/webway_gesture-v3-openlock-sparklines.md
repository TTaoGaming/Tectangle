---
id: ww-2025-094
owner: @you
status: active
expires_on: 2025-10-05
guard: npm run -s hex:test:unit
flag: FEATURE_HAND_TRANSITIONS_V3
revert: remove L/R spark overlay + disable flag
---
# Webway: V3 Open→Fist lock with L/R sparklines

## Goal

Simplify the offline gesture demo to a fullscreen, clarity-first view with hand landmark visualization and two sparklines (Left/Right) that pulse on Open_Palm→Closed_Fist transitions. Only allow Closed_Fist triggers if an Open_Palm lock was acquired first.

## Constraints

- Offline model and wasm only; no network. (source: defaults)
- Minimal UI; must run in static http server. (source: message)
- Guard: unit tests must stay green. (source: defaults)
- Privacy: no telemetry upload. (source: defaults)

## Current Map

V3 scaffold renders camera, optional dino iframe, telemetry table, and a floating panel. FSM recognizes Closed_Fist directly. Optional hand-dot overlay via HandLandmarker exists. (source: file)

## Timebox

20 minutes (source: defaults)

## Research Notes

- Per-hand FSM exists; added seat mapping + optional hand dots. (source: file)
- We introduce `openLocked` per hand to gate Closed_Fist triggers. (source: file)
- Added requestFullscreen with `?fs=1` param; spark overlay toggled. (source: file)

## Tool Inventory

- npm scripts: hex:test:unit, http-server (tasks). (source: file)
- Static server tasks available: 8080/8091. (source: file)

## Options (Adopt-first)

1. Baseline — Keep existing FSM; only add visual sparklines without gating.
   - Trade-offs: simplest, but fails the Open→Fist requirement.
2. Guarded extension — Add per-hand Open_Palm lock and render sparklines; keep legacy FSM for aggregate UI.
   - Trade-offs: minimal diff, reversible, uses existing structures. Chosen.
3. Minimal adapter — Separate module managing locks and pulses; import into page.
   - Trade-offs: cleaner separation, but extra file and wiring.

## Recommendation

Option 2 because it minimizes change surface, preserves existing telemetry, and meets the UX goal with a feature flag.

## First Slice

- Add FEATURE_HAND_TRANSITIONS_V3 flag.
- Add per-hand `openLocked` and thresholds.
- Pulse L/R sparklines when a lock-enabled Closed_Fist triggers.
- Fullscreen helper; enable via `?fs=1` or Start button.

## Guard & Flag

- Guard: `npm run -s hex:test:unit` stays green.
- Flag: FEATURE_HAND_TRANSITIONS_V3 (default true here; set false to disable).

## Industry Alignment

- Gated transitions (intent locks) are common in gesture UX to reduce false positives.

## Revert

- Delete spark overlay markup and supporting JS.
- Set FEATURE_HAND_TRANSITIONS_V3=false or remove references.

## Follow-up

- Add tiny Jest smoke for `window.__v3fs.startFS` presence.
- Tune thresholds and hysteresis per hand.
- Optional: spark buffer smoothing and decay.
