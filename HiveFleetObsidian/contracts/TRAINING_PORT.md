# Training/Virtualization Port (HFO)

## Purpose

Define a contract for tool virtualization and training: holodeck-style sessions (VR/projector) with TUI/haptic feedback, measurable skill gains, and optional third‑party validation.

## Contract

- Inputs: `scenario` (task), `modality` ('vr'|'projector'|'tui'), `tools` (virtual), `config` (haptics/TUI), `traces` (JSONL), `metrics` (targets)
- Outputs: `sessionReport` (KPIs), `heatmaps` (attention/pose), `replays`, `export` for validators
- Success: measurable improvement vs. baseline; validator checks pass when applied

## Modes

- VR/projector overlays: spatial training scenes
- TUI/haptics: tactile/hud feedback for emulation
- Replay: golden trace playback vs. live

## KPIs (examples)

- Latency (ms), Accuracy (%), Stability (no teleport), Task success rate, Time‑to‑competence, Retention (7/30), Revenue per session (if commercial)

## Third‑party validation

- Export artifacts (CSV/JSON) for external exams/validators; keep adapters optional

## CLI

- Seed: `node HiveFleetObsidian/tools/training_seed.mjs`

## Notes

- Exams later; today focus on tools that show immediate performance gains (e.g., party/multiplayer gesture games) to fund research.
