<!--
STIGMERGY REVIEW HEADER
Status: Draft
Review started: 2025-09-17T08-41-03Z
Expires: 2025-09-24T08-41-03Z (auto-expire after 7 days)

Checklist:
- [ ] Link to relevant manifest rows
- [ ] Capture new findings after each session
- [ ] Promote resolved items to TODO_today summary
-->

# Telemetry & Session Sync - Blackboard

## Focus
Tempo/phase alignment, Ableton-Link style quantization, SRL instrumentation.

## Sources to Ingest
- [ ] (manifest) ../import_manifest.md
- [ ] metrics/doc_inventory_summary.md (scan for relevant entries)

## Active Findings
- `TAGS-MVP-Modular-Monolith-backup` verified production anchor/telemetry behaviour (29k-line monolith) ? cross-link for event schema parity.
- `Spatial Anchor MPE v25.7.10/camera-MPE-current` retains production-ready orientation-aware MIDI pipeline; high churn (~57k lines) across CameraPipeline modules warrants extraction into Hex telemetry schema.
- `handsfree/handsfree/camera-MPE` production bundle documents orientation-aware MIDI mapping (96-note matrix, persistent settings) and clean deployment flow via `PRODUCTION-CLEANUP.md`. Capture logging/telemetry hooks before migrating.
- `archive-august-3-2025-physics-cleanup/archive-clean-hand-tracking/` exposes FPS/status reporting scaffolds; mirror camera/MediaPipe/Three.js status blocks and dependency-progress events in Hex telemetry UI.
- August Tectangle Sprint/integration-spec.md sets telemetry contract for pinch events (timestamp, worldPos, normalizedDistance, velocity). Ensure Hex telemetry schema aligns and logs duration/confidence for hold events.


## Open Questions
- _None yet_

## Next Extraction Targets
- Trace how `camera-MPE/index.html` emits state (wrist orientation, instrument switches) and define telemetry schema for Hex session sync.
- Port orientation-aware MIDI telemetry events into Hex instrumentation after schema defined.










