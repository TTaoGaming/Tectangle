---
id: ww-2025-075
owner: @TTaoGaming
status: active
expires_on: 2025-10-10
guard: hex:tier:commit must fail when Dino smokes report 0 downs/ups
flag: FEATURE_DINO_SMOKE_FAILFAST
revert: remove folder/flag
---

# Webway: Dino smokes fail-fast on zero engagement

Goal: Ensure sidecar smokes and CLI exit non-zero when no downs/ups occur, surfacing regressions early.
Proven path: Add explicit assertions to `v5_dino_sidecar_smoke` and non-zero exit in `run_v5_dino_p1_only.js`.
Files touched: `tests/e2e/v5_dino_sidecar_smoke.test.js`, `tests/smoke/run_v5_dino_p1_only.js`.
Markers: WEBWAY:ww-2025-075:
Next steps:

- Add assertion: `expect(summary.downs).toBeGreaterThan(0)` after ready sentinel.
- Exit with code 1 in CLI when counters are zero.
