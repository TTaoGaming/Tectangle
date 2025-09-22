---
id: ww-2025-003
owner: @TTaoGaming
status: active
expires_on: 2025-10-07
guard: e2e: ghost_flicker <=1 per 300ms; gated: 0 ghost downs
flag: FEATURE_HEX_GHOST_TEMPORAL
revert: remove folder/flag
---

# Webway: Ghost Temporal Confirmation (lead + confirm windows)

Goal: Add user-configurable ghost lead and confirmation windows to prevent flicker at thresholds.

Proven path: Schmitt-trigger + debounce + refractory (hardware button debouncing for noisy signals).

Files touched: dev ghost pages/adapters only; core untouched initially.

Markers: WEBWAY:ww-2025-003:

Next steps:

- Expose knobs: ghostLeadMs, ghostConfirmDownMs, ghostConfirmUpMs, minHoldMs, refractoryMs, majorityN=5, majorityK=3.
- Conditions:
  - GhostDown when gate OK (stable ~60ms) AND vRel<0 AND TOI<=lead for majority(3/5) and outside refractory.
  - GhostUp when (vRel>0 for ≥ghostConfirmUpMs) OR minHoldMs elapsed AND no longer meeting down-condition.
- Stabilize inputs: derive vRel from smoothed distance; optional EMA on TOI with dTOI clamp.
- Freeze: once actual down occurs, hold ghost until actual up.
- CI guard: replay normal/gated clips; assert low ghost flip rate and 0 ghost events on gated.
