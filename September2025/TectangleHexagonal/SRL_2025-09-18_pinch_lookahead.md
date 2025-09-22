---
title: SRL — Pinch Lookahead (Tier‑0)
date: 2025-09-18
owner: @you
tags: [SRL, pinch, lookahead, prediction, gating, hysteresis]
importance: high
---

## What we tried

- Constrained pinch to a 1‑D axis using pinky→index MCP as basis; projected thumb/index tips to scalars sTh/sIdx.
- Normalized distance by palm width (|indexMCP−pinkyMCP|) for Z‑depth/rotation invariance.
- Palm gating: only compute when facing camera (existing gate in HSM).
- Kinematics: EMA smoothed velocity; clamped acceleration; quadratic lookahead to predict norm and fingertip ranges.
- Lead control: separate leadMs allowing negative values to aim ahead of latency.

## What we learned

- The axis frame is stable when palm gate is true; normalization keeps thresholds consistent.
- EMA on velocity plus accel clamp reduces jitter without lag overdose.
- Predicting ranges for each fingertip along the axis is simple and usable for UI hints.

## Evidence

- Rich snapshot now includes `prediction` when FEATURE_PINCH_LOOKAHEAD_V1 is enabled; demo v2 can visualize via strips/rail.

## Next

- Tune alpha, maxAccel, lookaheadMs/leadMs on golden clips; record metrics (early/on-time/late confirmation rate).
- Add calibration capture to persist bone ratios/joint baselines; use to de‑skew axis under bend.
