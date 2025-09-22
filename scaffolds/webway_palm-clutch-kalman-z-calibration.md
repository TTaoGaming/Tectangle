---
id: ww-2025-109
owner: @you
status: active
expires_on: 2025-10-05
guard: npm run -s hex:overlay:verify
flag: FEATURE_GS_PALMCLUTCH
revert: remove PalmClutch wiring; flip FEATURE_GS_PALMCLUTCH off
---
# Webway: PalmClutch FSM + 1D Kalman Z lookahead

## Goal

Create a gesture language foundation in GestureShell OS where Open_Palm seats hands and serves as a clutch; gestures prime then fire with velocity-confirmed transitions and a 1D Kalman lookahead for Z, enabling low-latency emulation (keys/mouse/multitouch/VR).

## Constraints

- License: MIT (repo) (source: defaults)
- Perf: latency felt ≤ 25 ms; minimal allocations (source: Tommy notes)
- Deps: ≤ 1 small lib; prefer zero-dep Kalman (source: defaults)
- Privacy: no telemetry upload; local JSONL only (source: defaults)
- Security: no secrets (source: defaults)
- CI: existing guards must pass (source: defaults)

## Current Map

- GateFSM exists with watchdog timeout and inspector (source: codebase)
- Seats P1..P4 and Shell OS scaffold available (source: codebase)
- Telemetry JSONL infra available (source: codebase)

## Timebox

20 minutes initial wiring; iterate after verification (source: defaults)

## Research Notes

- Seating on Open_Palm prevents cross-hand noise (source: message)
- Z from knuckle span + pixel span; wrist orientation for camera correction (source: message)
- 1D Kalman on Z-velocity for lookahead/clutch bias (source: message)

## Tool Inventory

- XState v5 via ports (source: codebase)
- WinBox inspector (source: codebase)
- JSONL writer and guards (source: codebase)

## Options (Adopt-first)

1. Baseline — Extend GateFSM into PalmClutch with PRIMED/HOLD/COOLDOWN + velocity gate; simple exponential smoothing.
   - Trade-offs: easiest; less robust than Kalman.
2. Guarded extension — Add 1D Kalman filter for Z-velocity lookahead; flag gated; seat on Open_Palm; calibrate knuckle span.
   - Trade-offs: slightly more compute; better stability.
3. Minimal adapter — Keep GateFSM; add a PalmClutch adapter that listens to events and emits emulation events with hysteresis.
   - Trade-offs: duplication between FSM and adapter logic.

## Recommendation

Option 2 for better stability with small cost; keep flag and revert path simple.

## First Slice

- New PalmClutch FSM (idle→seated→primed→fired→cooldown) behind FEATURE_GS_PALMCLUTCH.
- Add 1D Kalman helper (zero-dep) for Z-velocity; configurable R/Q.
- Wire Open_Palm seating and calibration sampling in GS OS page.
- Update inspector to show seat, z, v, kalman state; JSONL event on FIRE.

## Guard & Flag

- Guard: `npm run -s hex:overlay:verify` stays PASS.
- Flag: FEATURE_GS_PALMCLUTCH (default off).

## Industry Alignment

- HCI clutch mechanisms and predictive input (source: literature)
- XState actor model for UI/input state (source: xstate docs)

## Revert

- Flip FEATURE_GS_PALMCLUTCH to false; remove PalmClutch wiring; keep GateFSM only.

## Follow-up

- TTL check 2025-10-05; promote if stable.
- Add unit tests for Kalman and FSM transitions.
