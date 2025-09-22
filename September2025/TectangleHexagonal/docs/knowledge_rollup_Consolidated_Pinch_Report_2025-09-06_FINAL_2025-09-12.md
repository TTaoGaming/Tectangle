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

# Logic Rollup — Consolidated Pinch Report (2025-09-06)

Source: Knowledge backup 20250912/Consolidated_Pinch_Report_2025-09-06_FINAL.md

Quick reference

- Executive summary
- LOGICS

## Executive summary

Adopt empirically tuned pinch thresholds with hysteresis and hold timing to reduce chatter and false triggers across devices. Track FP/FN via optional annotations to converge per profile.

## OPTIONS

- Adopt: Set pinch trigger/release ratios and holdMs from report; track misses.
- Adapt: Device-profile flags for alternate curves.
- Invent: ML pinch classifier.

## PICK

- Adopt — interpretable, reversible, aligns with FSM.

## SLICE

- Update PinchRecognitionManager defaults; expose profile tag.
- Add telemetry counters false_positive/false_negative (optional annotations).

## LOGICS

- Metric: norm = dist(thumb4, tip)/palmSpan(5,17).
- Thresholds by profile: {default:{trigger:0.36, release:0.46, holdMs:120}}; expose override.
- Hysteresis: idle→triggered at trigger; triggered→idle at release; hold gate for start.
- Telemetry: emit pinch:metric {norm, profile, triggered}; counters FP/FN when annotations present.

Tiny pseudocode

```js
if (state==='idle' && norm<=cfg.trigger) t0=ts, state='triggered';
if (state==='triggered' && norm>=cfg.release) state='idle';
if (state==='triggered' && ts-t0>=cfg.holdMs) emit('tectangle:gesture', {type:'start'});
```

KPIs

- Latency to start < 150ms; FP/FN rate < 3% on annotated clips.
