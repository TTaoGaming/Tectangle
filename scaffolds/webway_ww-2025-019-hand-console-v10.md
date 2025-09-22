---
id: ww-2025-019
owner: @system
status: active
expires_on: 2025-10-12
guard: seatlock tests pass
flag: FEATURE_HAND_CONSOLE_V10
revert: remove file + integrated_hand_console_v10.html + flag
---
# Webway: Hand Console V10 Research Telemetry
Goal: Provide research-grade live visualization of seat-lock enriched telemetry (norm, rawNorm, velocity, acceleration, palmAngle, index joint angles, stability frames, history slice) plus sparklines for quick drift detection.
Proven path: Cloned from V9 (which cloned stable V7) adding metrics table + sparkline rendering and heavy viz toggle.
Files touched: `September2025/TectangleHexagonal/dev/integrated_hand_console_v10.html`
Markers: WEBWAY:ww-2025-019
Next steps: (1) Consider adding thumb joint angles; (2) Add export-to-JSON button; (3) Add lock acquisition countdown indicator.

Rationale: Enables immediate verification that adapter outputs expected stabilized values across seats, reducing debugging latency.
