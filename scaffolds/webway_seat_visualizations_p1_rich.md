---
id: ww-2025-062
owner: @ttao
status: active
expires_on: 2025-10-10
guard: jest: v6_dino_ui_snapshot + seat viz smoke
flag: FLAG_VIZ_P1_RICH
revert: remove windows/flag
---
# Webway: P1 Rich Seat Visualizations (strips, joints, timing)

## Goal
 
Clarify and improve seat visualization after P1 lock-in: accurate seat mapping, cleaner hysteresis strip, and modular windows (strips, joint angles, timing) that can be opened/closed.

## Constraints
 
- Timebox: minimal invasive slice first; reversible (source: defaults)
- Perf: overlay < 2ms/frame budget on 720p (source: defaults)
- No telemetry/secrets (source: defaults)
- Keep current tests green; visual baseline adjustable (source: message)

## Current Map
 
- v6 copies v5 seat resolution; uses state.seats.map first, then heuristic fallback.
- Strips show norm vs thresholds with a white dot and teal ghost (Kalman lookahead). Labels aren’t always seat-accurate; styling feels noisy.
- Dino P1 window is draggable and echoes Space on valid pinches (feature-flagged). (source: codebase)

## Timebox
 
20 minutes initial design; staged adoption. (source: defaults)

## Research Notes
 
- Seat mapping: state.seats.map resolves hand→seat; avoid heuristic when map exists. (source: codebase)
- Strip rendering: enter/exit vis bands, dot at norm, ghost = x + v*dt; inline CSS; might be heavy on eyes. (source: codebase)
- Modular windows pattern already exists (floating Dino). (source: codebase)

## Tool Inventory
 
- SDK v6 overlay API, getRichSnapshot(), getState()
- createToiKalmanCV (r, q, predict step)
- Existing floating window shell (Dino)

## Options (Adopt-first)
 
1. Baseline cleanup — Clean strip styling + strict seat mapping
   - What: enforce state-map seat; remove heuristic when map present; restyle strip: hairline dot, softer bands, optional grid; numeric badges (norm, dt, state) on right.
   - Trade-offs: Minimal change; improves legibility; still one visualization.
2. Guarded panels — Dockable mini-windows for P1: Strips, Joints, Timing
   - What: after lock, spawn draggable windows (like Dino):
     - Strips: cleaned design (Option 1)
     - Joints: per-finger joint angles (MCP/PIP/DIP), palm angle, spread
     - Timing: pinch timeline with toiPred vs actual, EMA bias, jitter, p95 bands
   - Trade-offs: Slight overhead; strong clarity; modular close/open.
3. Minimal adapter — Canvas HUD chips only
   - What: keep strip but add compact chips near hand: state (Armed/Held), norm, seat, and bias/jitter mini-bars.
   - Trade-offs: Lowest overhead, least intrusive; less data density.

## Recommendation
 
Option 2 with Option 1 styling as the first slice: start with cleaned strip + strict seat; add a single additional window (Timing) after P1 lock. This balances clarity, modularity, and effort.

## First Slice
 
- Strict seat mapping: prefer state map, drop heuristic when present.
- Strip restyle: thinner dot/ghost lines, reduced band opacity, subtle grid, right-aligned mini-stats.
- Spawn Timing window on P1 lock: shows toiPred vs actual, bias EMA, jitter p95; draggable; closeable.

## Guard & Flag
 
- Guard: extend v6 snapshot or add smoke to assert Timing window exists after P1 lock.
- Flag: `FLAG_VIZ_P1_RICH` to enable windows.

## Industry Alignment
 
- Modular, task-focused overlays are common in CV/AR debug UIs; strict seat mapping reduces cognitive load.

## Revert
 
- Disable flag or remove windows; revert strip CSS.

## Follow-up
 
- Add Joints window with angle telemetry; add P2 parallel windows without cross-talk.
- Replace byte-size visual diff with perceptual comparison when stable.
