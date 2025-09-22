# SRL | 2025-09-21T00:00:00Z | ww-2025-132

Focus: WinBox anomalies, strangler plan for cards, wrist HUD label inconsistency

Signals: Manual runs show occasional WinBox chrome/marker mismatches while e2e factory guard passes; camera card snapshot drift likely due to dynamic overlays; wrist HUD labels (idle/trigger/held) unstable under MP4 replay

Decisions queued: Adopt cards strangler facade (v2) and migrate incrementally; stabilize camera snapshots in CI; normalize wrist HUD label enums and add JSONL idle guard

Next audit: 2025-09-23
