---
id: ww-2025-077
owner: @TTaoGaming
status: active
expires_on: 2025-10-10
guard: hex:tier:daily must assert non-empty pinchTelem and TOI samples on golden clips
flag: FEATURE_TELEM_TOI_GUARD
revert: remove folder/flag
---

# Webway: Telemetry guard for TOI samples

Goal: Make missing telemetry visible by failing when pinch telemetry or TOI samples are empty during golden playback.
Proven path: Add checks in telemetry goldens and the SDK guard to assert non-empty arrays.
Files touched: telemetry golden tests, sdk guard scripts.
Markers: WEBWAY:ww-2025-077:
Next steps:

- In goldens, assert `pinchTelem.length > 0` and `toi.samples.length > 0`.
- In guard, fail when counts are zero; surface in CI status.
