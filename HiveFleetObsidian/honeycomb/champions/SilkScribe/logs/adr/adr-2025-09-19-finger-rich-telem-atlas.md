# ADR | 2025-09-19T02:10:00Z | ww-2025-067

Context: We need realistic finger telemetry (curl, pinch norm, rig pose) from golden MP4 playback; current visuals are ad hoc and not persisted.
Decision: Add a `fingerRecorder` port and FINGER_ATLAS flag to record JSONL and draw simple rig/curl overlays; add a CI smoke that asserts JSONL line count and overlay presence.
Consequences: Enables physics-based tuning and stable UX guards without breaking demos; later slices can add plausibility checks and richer charts.
Links: [Webway note](../../../../scaffolds/webway_ww-2025-067_finger_rich_telem_atlas.md)
