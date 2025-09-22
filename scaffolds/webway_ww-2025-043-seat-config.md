---
id: ww-2025-043
owner: @tommy
status: active
expires_on: 2025-09-25
guard: npm run -s hex:test:unit && npm run -s hex:telemetry:golden:idle && npm run -s hex:telemetry:golden:twohands
flag: FEATURE_SEAT_CONFIG
revert: remove folder/flag
---
# Webway: Seat-scoped config (presets + params)
Goal: Let users pick presets and tweak lookahead/hysteresis/anchor/knuckle per seat; persist locally and propagate to runtime.
Proven path: Facade exposes get/set seat config; AppShell stores per-seat with localStorage; demo UI behind feature flag.
Files touched: src/app/seatConfigStore.js; src/sdk/hexInputFacade.js; src/app/appShell.js; dev/demo_fullscreen_sdk_v3_kalman.html
Markers: WEBWAY:ww-2025-043:
Next steps: add unit tests for hysteresis invariants; wire anchor delay into router/app logic; add calibration flow for knuckle span.
