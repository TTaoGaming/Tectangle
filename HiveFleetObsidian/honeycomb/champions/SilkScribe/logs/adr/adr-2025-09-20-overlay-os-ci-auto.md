# ADR | 2025-09-20T00:00:00Z | ww-2025-095

Context: Overlay OS smoke was flaky due to racing dock clicks vs window creation and server path normalization. Deterministic readiness was missing.

Decision: Add URL query flag ?auto=1 to overlay_os_v1.html to auto-open Sparkline and HandViz windows and set window.__overlayReady early. Update smoke to load with ?auto=1.

Consequences: CI is deterministic without depending on navigator.webdriver. Synthetic feed remains default ensuring no camera dependency. Manual demos can omit ?auto and rely on dock interactions.

Links: [Webway note](../../../../scaffolds/webway_overlay_os_tasks_bridge.md)
