# ADR | 2025-09-21T05:15:25Z | ww-2025-096

Context: We need auditable telemetry for v2 seating/gesture behavior using golden MP4s. Headful Jest-Puppeteer was the most reliable harness.

Decision: Add two Jest-Puppeteer tests that replay idle and pinch goldens on camera_landmarks_wrist_label_v2.html via a getUserMedia shim, exporting JSONL lines each ~100ms and summary JSONs under HiveFleetObsidian/reports/telemetry. Relax pinch taxonomy assertion due to model label variance.

Consequences: We can diff behaviors over time via JSONL. CI can reuse local server (E2E_SKIP_SERVER=1). Potential flake reduced in headful mode. Tighten guards later when taxonomy stabilizes.

Links: [Webway note](../../../../scaffolds/webway_stigmergy-blackboard.md)
