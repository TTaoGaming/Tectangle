---
id: ww-2025-093
owner: @TTaoGaming
status: active
expires_on: 2025-10-01
guard: "npm run -s hex:verify:fast && npm run -s hex:smoke:gesture:offline"
flag: HEX_HUMAN_SIDECAR
revert: remove folder/flag
---
# Webway: Adopt 'Human' via Sidecar (Strangler)

## Goal

Leverage the Human library (face/gesture/pose) as an optional sidecar to compare/augment MediaPipe signals, progressively strangling toward the better provider without rewriting core.

## Constraints

- Must remain optional and same-origin; no privacy leaks (source: defaults)
- No API churn to core vmCore/shell; only adapters/ports (source: repo style)
- CI: run offline gesture demo smoke in PR (source: scripts)

## Current Map

- human-main-referenceonly exists with examples; prior demos reference it (source: repo files)
- PostMessage bridges and sidecar concept already used (Dino) (source: dev demo)

## Timebox

timebox_minutes=20 (source: defaults)

## Research Notes

- Human provides emotion/face/gesture; can be turned on/off modularly.

## Options (Adopt-first)

1. Baseline — parallel inference compare
   - What: Load Human in hidden canvas, compute minimal features; publish compare metrics (lag, stability) to console/overlay.
   - Trade-offs: Extra CPU.

2. Guarded extension — adapter port
   - What: Create HumanAdapter that maps Human outputs to vmCore shapes; feature flag toggled.
   - Trade-offs: Mapping effort.

3. Minimal adapter — event taps
   - What: Only tap reliable gestures (e.g., victory, open-fist) and map to shell events for games.
   - Trade-offs: Limited coverage but quick value.

## Recommendation

Start with option 3 to power input demos, then option 1 for telemetry compare; option 2 when stable.

## First Slice

- Add HEX_HUMAN_SIDECAR gate and loader stub; show overlay badge when active; no core changes.

## Guard & Flag

- Guard: hex:verify:fast + hex:smoke:gesture:offline passes.
- Flag: HEX_HUMAN_SIDECAR enabling sidecar scripts.

## Industry Alignment

- Strangler pattern; sidecar adoption; port/adapters common in hexagonal architecture.

## Revert

- Remove loader and flag; no core impact.

## Follow-up

- Add compare dashboards; record JSONL for head-to-head telemetry.
