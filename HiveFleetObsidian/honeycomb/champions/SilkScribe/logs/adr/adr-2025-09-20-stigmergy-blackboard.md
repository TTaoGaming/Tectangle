# ADR | 2025-09-20T00:00:00Z | ww-2025-094

Context: Demos (gesture_tasks_offline_v3, SDK v7 material, IHC v13) already deliver desired behaviors with standards-based components.
Decision: Adopt-first. Keep IHC v13 shell frozen; use V14 for gated research. Wire MediaPipe Tasks GestureRecognizer into SDK v7 facade; add minimal controller persistence + FSM adapter; keep experimental metrics behind flags.
Consequences: Faster delivery, lower risk; clear guards via existing smokes; reversible via flags and adapter removal.
Links: [Webway note](../../../../scaffolds/webway_stigmergy-blackboard.md)
