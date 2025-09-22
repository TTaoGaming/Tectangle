<!--
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
- [ ] Re-evaluate this artifact against current Hexagonal goals
- [ ] Ensure onboarding guidance is still accurate
- [ ] Log decisions in TODO_2025-09-16.md
-->

# Tectangle Hex • Negative-latency calibration (plan)

## Goal

- Align predicted Time of Impact (TOI) with Actual TOI and bias it earlier (negative latency) to offset camera + smoothing + processing delay.

## Method (trace-driven, reversible)

- Metronome session: user pinches exactly on beats at various tempos (e.g., 60/90/120 BPM), per hand and per finger.
- Record analysis JSONL (frames + events + TOI predictions) via AnalysisRecorder.
- Offline calibration computes per-hand/per-finger offsets so predicted TOI fires earlier by target lead (e.g., 15–30 ms).

## Artifacts

- Analysis JSONL: contains per-frame norm/rawNorm, vRel/aRel, gate, toiPredV/toiPredA and per-event down/up with actual duration.
- Calibration output: offsets.json { "Right:index": 28, "Right:thumb": 22, ... } in ms.

## Application

- At runtime, when a speculative down occurs, schedule the actuation at (now + toiPredV - offset). Ensure non-negative schedule time.
- Keep a safety window; cancel on kinematic violation.

## Notes

- Larger hysteresis lowers the entry threshold → earlier downs, but may raise false positives; prefer explicit offsets over drifting thresholds.
- Use toiPredA only when acceleration is stable; default to velocity TOI.
- Optional confirmations: palm cone, velocity direction, joint-angle plausibility.

## Status

- CalibrationAdapter shim exists (src/ports/calibrationAdapter.js). Not wired.
