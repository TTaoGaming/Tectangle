---
id: ww-2025-106
owner: @ttao
status: active
expires_on: 2025-10-12
guard: e2e opens two Dino instances and responds to P1/P2 events
flag: FEATURE_GAMEBRIDGE_DINO_DUAL
revert: remove bridge adapter and flag
---
# Webway: GameBridge — Dual Dino (P1/P2)

## Goal

Provide a minimal bridge hex that spawns two independent Chrome Dino runners (or clones) and routes P1/P2 gesture events (pinch/open) to each instance for instant multiplayer testing.

## Constraints

- Zero network; offline assets only; CI-friendly.
- Prefer iframe isolation per instance; avoid global input collisions.

## Current Map

- Existing sidecar and dino notes; no dual-instance bridge yet.
- Hex registry exists; ReplayLandmarks available for deterministic inputs.

## Timebox

20 minutes (defaults)

## Research Notes

- User wants “dual panel dino runner” with adapters per instance and CI guard (source: TommyNotesSeptember2025.txt)

## Tool Inventory

- jest-puppeteer e2e; static server tasks; Settings hex; SDK facade planned.

## Options (Adopt-first)

1. Baseline — Two iframes of Dino; simple API: start/stop/jump for each; route events.
   - Trade-offs: Fast and reversible; minimal coupling.
2. Guarded extension — Visual UI with two panels and status lights per player.
   - Trade-offs: Slight UI lift; improves debugging.
3. Minimal adapter — Add SDK facade hooks so any demo can call `gamebridge.dino.dual.start()`.
   - Trade-offs: Requires facade landing first or shims now.

## Recommendation

Option 1 now; add Option 3 when facade v0 lands.

## First Slice

- HTML page `dev/dino_dual_v1.html` creating two iframes of Dino runner.
- Bridge hex `src/hex/gamebridge/dinoDual.js` exposing start/stop and route methods.
- Simple e2e: synthesize P1/P2 pinch events and assert both instances jump.

## Guard & Flag

- Guard: new e2e must pass in CI; replay can drive input deterministically.
- Flag: FEATURE_GAMEBRIDGE_DINO_DUAL gates page entry point.

## Industry Alignment

- Input-routing test harnesses are standard for controller stacks.

## Revert

- Delete page and bridge file; remove feature flag.

## Follow-up

- Add telemetry overlay per instance (speed, score); integrate with KeyMap.
