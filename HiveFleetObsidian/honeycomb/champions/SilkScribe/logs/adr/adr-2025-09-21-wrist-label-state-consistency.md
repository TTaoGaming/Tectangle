# ADR | 2025-09-21T00:00:00Z | ww-2025-095

Context: We integrated GestureRecognizer into the camera wrist-label demo and need a guard to ensure the on-screen state matches the recognizer's top label. We also want JSONL from the v3 guard to explicitly include Open_Palm entries for auditability.

Decision: Add two tests: (1) a Puppeteer smoke that mocks getUserMedia and asserts the camera demo's state equals the top GestureRecognizer label; (2) a JSONL validator that checks for Open_Palm presence for both Left and Right in the v3 guard output. Wire npm scripts and a composite guard runner.

Consequences: The CI surface now includes behavioral verification of the camera demo and explicit JSONL checks, improving confidence in gesture-to-UI wiring and golden guard integrity. Minimal overhead; fully local.

Links: [Webway note](../../../../scaffolds/webway_ww-2025-095_open_palm_ci_guard.md)
