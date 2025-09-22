# ADR | 2025-09-20T00:00:00Z | ww-2025-093

Context: Need a downloadable, offline hand-tracking project with strong visuals and a clean JS API.

Decision: Build a tiny wrapper module around Mediapipe HandLandmarker and vendor drawing helpers; demo page imports it. Guard with puppeteer screenshot.

Consequences: Minimal new surface, aligns with current stack; reversible via flag. Enables stable snapshots and future packaging.

Links: [Webway note](../../../../scaffolds/webway_hands-visuals-api-starter.md)
