<!--
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
- [ ] Re-evaluate this artifact against current Hexagonal goals
- [ ] Validate references against knowledge manifests
- [ ] Log decisions in TODO_2025-09-16.md
-->

# Logic Rollup — FOUNDATION_COLLIDING_SPHERE_SUMMARY

Source: Knowledge backup 20250912/FOUNDATION_COLLIDING_SPHERE_SUMMARY.md

Quick reference

- Executive summary
- LOGICS

## Executive summary

Model fingertips as spheres to detect implausible penetrations and fast teleports. Use normalized hand scale to keep device-agnostic. Start with passive telemetry score; gate behavior behind a flag.

## OPTIONS

- Adopt: Fingertip sphere radii constants; reuse in plausibility clamp.
- Adapt: Visualize collisions only (debug).
- Invent: Full rigid-body engine.

## PICK

- Adopt — numeric clamps first; low risk.

## SLICE

- Compute interpenetration score per frame; tag in clamp telemetry.
- Gate any behavioral change behind threshold flag.

## LOGICS

- Radii (normalized): thumbTip=0.02, indexTip=0.018, others=0.018; palmRadius=0.05.
- Score: interpenetration = Σ max(0, r_i + r_j - dist(i,j)).
- Teleport: normSpeed threshold 6.0 handScales/s.
- Decision: pass if score==0 and speeds<th; else flag physics.fail.

Tiny pseudocode

```js
for (pairs of tips) score+=Math.max(0, r[i]+r[j]-dist(i,j));
```

KPIs

- <1% false clamp on normal motion; catches >95% obvious glitches.
