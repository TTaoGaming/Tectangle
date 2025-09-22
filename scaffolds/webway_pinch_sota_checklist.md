---
id: ww-2025-005
owner: @you
status: active
expires_on: 2025-10-09
guard: npm run hex:smoke:demo:v2 # follow-up: add hex:guard:pinch-sota
flag: FEATURE_PINCH_SOTA_CHECKS
revert: remove folder/flag
---

# Webway: Pinch SOTA checklist (mission-critical)

Goal: Define measurable targets and checks for a high-speed, mission-critical pinch detector with predictive timing and redundancy.

Proven path: Time-to-contact (TTC) prediction with 1D state estimators (Kalman/αβ), NASA-style multi-signal consensus, One-Euro for de-jitter.

Files touched: (planning only)

Markers: WEBWAY:ww-2025-005:

Next steps: Add v3 Kalman TOI fields; wire e2e guard: latencyErrorMs, false/missed pinches, jitter.

## Checklist (targets to hit)

- Palm gate quality: ≥99% correct acceptance; drop/hold when below threshold.
- Geometry/normalization: 1D pinch along MCP axis; normalized by palm width; variance ≤5% across Z-depth.
- Prediction/TTI: configurable L (−150..+150 ms); median |TOI_pred−TOI_actual| ≤12 ms on goldens.
- De-jitter filter: One-Euro or Kalman; added lag ≤8 ms at 120 FPS equivalent.
- FSM+hysteresis: no flicker; falsePinchRate ≤0.5%; missedPinches ≤0.5% on goldens.
- Per-user calibration: store bone ratios + joint baselines; reduces norm variance ≥30% under bend.
- Redundancy: 2-of-3 consensus (distance, kinematics, angleVel) pass rate ≥98% for true pinches.
- Performance: CPU <10% on mid-tier laptop; GC-safe; no dropped frames at 60 FPS.
