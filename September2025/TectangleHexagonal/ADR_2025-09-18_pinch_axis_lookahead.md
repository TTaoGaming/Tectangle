---
id: ADR-2025-09-18-pinch-axis-lookahead
date: 2025-09-18
status: accepted
author: @you
tags: [ADR, pinch, axis, prediction, gating, normalization]
---

# ADR: Pinch Axis Lookahead

## Context

We need a robust, low-latency pinch with predictive look-ahead. Inputs are MediaPipe Hands landmarks; SDK already has hysteresis and palm gating.

## Decision

Constrain pinch to a 1-D axis based on pinky→index MCP, normalize by palm width, and compute a flagged lookahead prediction (norm and fingertip ranges) with EMA-smoothed velocity and clamped acceleration. Provide a tunable leadMs (can be negative) to "aim ahead" of system latency.

## Consequences

- Stable thresholds across Z-depth and palm rotation.
- Simple visualization and downstream consumption of `prediction` in rich frames.
- Minimal risk: behind FEATURE_PINCH_LOOKAHEAD_V1 and runtime `updatePredictionConfig`.

## Alternatives Considered

- Full 3D kinematics: heavier, not necessary for first pass.
- No normalization: more threshold drift with depth/rotation.

## Follow-ups

- Calibration capture (joint baselines, bone ratios) to de-skew under bend and improve axis stability.
- Quantify early/on-time/late confirmation rates across goldens; auto-tune lookahead/lead.
