# ADR | 2025-09-21T23:59:00Z | ww-2025-109

Context: We want a gesture language driven by FSMs where hands are ignored until Open_Palm, which seats them and begins calibration. During Open_Palm, we sample pixel and knuckle spans to estimate absolute Z; wrist orientation corrects intrinsics. Gestures are treated like key presses: PRIMED when plausible and FIRE on state change with velocity confirmation and a 1D Kalman lookahead for Z.

Decision: Implement a PalmClutch FSM behind FEATURE_GS_PALMCLUTCH, add a zero-dependency 1D Kalman helper for Z-velocity lookahead, wire to GestureShell OS demo, and emit JSONL on FIRE. Keep revert simple by flipping the flag and removing PalmClutch wiring.

Consequences: Slight compute overhead for Kalman; better stability and lower felt latency. Clear observability via the XState inspector and JSONL events. Maintains older v2 stability by isolating changes to GestureShell OS.

Links: [Webway note](../../../../scaffolds/webway_palm-clutch-kalman-z-calibration.md)
