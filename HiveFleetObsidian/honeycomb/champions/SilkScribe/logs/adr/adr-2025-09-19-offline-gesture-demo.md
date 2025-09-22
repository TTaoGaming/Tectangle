# ADR | 2025-09-19T00:00:00Z | ww-2025-089

Context: Need an offline gesture demo matching online behavior; CDN not allowed.
Decision: Serve tasks-vision ESM/wasm from local node_modules and fetch the official gesture_recognizer.task into assets. Add dev page and npm script.
Consequences: Works offline; minimal integration; easy revert. Next step is optional adapter wiring behind a flag.
Links: [Webway note](../../../../scaffolds/webway_ww-2025-089_offline_gesture_demo.md)
