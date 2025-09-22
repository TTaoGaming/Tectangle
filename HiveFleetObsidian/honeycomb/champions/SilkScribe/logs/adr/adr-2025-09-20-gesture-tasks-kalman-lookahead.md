# ADR | 2025-09-20T05:05:00Z | ww-2025-085

Context: We want adopt-before-invent: robust labeled gestures (Tasks) + short-horizon Kalman prediction for user-defined latency and consistent game seating.
Decision: Introduce a feature-flagged Gesture Tasks adapter producing label streams; add Kalman early lookahead to synthesize SelectPred; guard with a smoke using a synthetic label hook.
Consequences: One new dep; measurable latency control; reversible via flags; clear path to richer labels and per-seat tuning.
Links: [Webway note](../../../../scaffolds/webway_ww-2025-085_gesture_tasks_kalman_lookahead.md)
