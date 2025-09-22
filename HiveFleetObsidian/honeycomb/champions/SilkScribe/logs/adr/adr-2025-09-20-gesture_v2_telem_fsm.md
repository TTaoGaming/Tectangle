# ADR | 2025-09-20T00:00:00Z | ww-2025-092

Context: Need offline-friendly demo that surfaces rich gesture telemetry and a sticky event model to drive sidecar games/tools.

Decision: Add `gesture_tasks_offline_v2.html` with a live telemetry table and a tiny FSM (Closed_Fist enter/exit hysteresis) that emits Select to Dino. Guard behind FEATURE_GESTURE_TELEM_V2. Keep local ESM/WASM/model.

Consequences: Easier tuning and debugging; enables SDK facade wiring later. CI impact minimal (demo-only). Follow-ups to add automated smoke and multi-gesture support.

Links: [Webway note](../../../../scaffolds/webway_ww-2025-092_gesture_v2_telem_fsm.md)
