# ADR | 2025-09-21T00:00:00Z | ww-2025-090

Context: We want a deterministic CI guard that confirms two-hands presence and Open_Palm on both hands when playing the golden idle MP4, leveraging v3 offline JSONL hooks.
Decision: Add a Jest e2e test (`September2025/TectangleHexagonal/tests/e2e/open_palm_idle_jsonl.test.js`) that asserts twoHands>=1 and Open_Palm seen for Left and Right. Keep it independent of runtime flags; rely on the frozen v3 harness.
Consequences: Faster feedback and reproducible failures with JSONL artifacts; slight increase in e2e suite time. Future: roll this into commit tier and possibly tighten thresholds.
Links: [Webway note](../../../../scaffolds/webway_ww-2025-090_twohands_idle_openpalms.md)
