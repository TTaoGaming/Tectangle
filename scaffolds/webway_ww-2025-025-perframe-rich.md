---
id: ww-2025-025
owner: @spatial
status: active
expires_on: 2025-10-08
guard: smoke: verify_v11_sidecar_stream + verify_v11_postlock_perframe
flag: FEATURE_HAND_CONSOLE_V11
revert: remove folder/flag
---
# Webway: Post-lock per-frame rich + sidecar
Goal: Emit rich telemetry every frame after seat-lock and expose an out-of-band sidecar for diagnostics.
Proven path: V10 per-frame metrics + V11 broadcaster; Puppeteer smokes validate stream and continuity.
Files touched: September2025/TectangleHexagonal/dev/integrated_hand_console_v11.html, September2025/TectangleHexagonal/dev/rich_sidecar.html, tests/smoke/verify_v11_sidecar_stream.mjs, tests/smoke/verify_v11_postlock_perframe.mjs, September2025/TectangleHexagonal/TODO_2025-09-17.md
Markers: WEBWAY:ww-2025-025:
Next steps: Centralize throttle; ensure adapter merges per-frame values without events; decouple to hex UI module.
