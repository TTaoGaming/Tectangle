# Agent Progress Log

- Timestamp: 2025-09-18T23:40Z
- Marker: WEBWAY:ww-2025-061

Summary

- Normalized E2E test base URLs to derive from SITE_BASE/E2E_PORT/E2E_HOST instead of hardcoded :8080.
- Switched golden clip references to absolute paths to prevent 404s caused by relative resolution under /dev pages.
- Added WEBWAY note: `scaffolds/webway_ww-2025-061.md` with TTL and guard.

Files touched

- September2025/TectangleHexagonal/tests/e2e/v5_dino_sidecar_smoke.test.js
- September2025/TectangleHexagonal/tests/e2e/v5_dino_iframe_integration.test.js
- September2025/TectangleHexagonal/tests/e2e/v5_dino_p1_only_pinches.test.js
- tests/e2e/v3_kalman_sidecar_dino.test.js

Next steps

- Run headed e2e with E2E_PORT=8091 and verify Space echo and pinch downs register.
- Optionally extend env-base normalization to smoke/golden runners used by CI.

---

- Timestamp: 2025-09-19T00:15Z
- Marker: WEBWAY:ww-2025-072

Summary

- Added "Tectangle Hexagonal — One‑page rollup" to root README capturing North Star, phases, time horizons, pinch logic, and next‑48h focus.
- Tiered test scripts available: repeat/commit/hourly/daily/weekly; use local server for smokes.

Immediate actions (next 48h)

1) Config: keyboard mapping
	- Task: wrist‑quaternion → key map + 4 pinches/hand; JSON import/export; Wrist Compass editor stub.
	- Output: schema `config/keymap.schema.json`, loader, and Side Panel editor.

2) SDK/API v0
	- Task: define `IManager` base and public facade `InputSDK` with `init/setKeyMap/on/exportTelemetry`.
	- Output: `src/sdk/manager.ts` (interface), `src/sdk/index.ts` (facade), adapters for camera/landmarks.

3) Pinch reliability
	- Task: triple‑check fusion (distance ratio + velocity/accel + joint‑angle); velocity‑release clamp; sticky FSM.
	- Output: unit + offline smokes; telemetry counters; guard thresholds documented.

4) Side Panel and telemetry UX
	- Task: one Start/Stop/Export button; Pinch Stats table; remove floating HUD remnants.
	- Output: updated panel; feature flags for debug toggles.

5) CameraManager startup logs
	- Task: on boot, log resolution, FPS, FOV/transform; capture alignment warnings.

6) Offline smokes (positive/negative)
	- Task: add two JSONL‑driven runs: allowed palm‑forward pinch (triggers) and gated palm‑away (no trigger).

7) Two‑player dino sidecar
	- Task: dual panel runner; P1/P2 adapters; tests; wire into hex demos.

8) CI guard UI
	- Task: ensure guard surface in PR checks; add badges to README.

How to run

- Fast local tier: `npm run -s hex:tier:repeat` (start local server if smokes need it).

---

## Golden JSONL for Open_Palm Idle (WEBWAY:ww-2025-095)

- The v3 offline demo guard produces a JSONL we consider the golden master for Open_Palm idle.
- Artifacts:
	- JSONL: `September2025/TectangleHexagonal/out/open_palm_idle.golden.jsonl`
	- Summary: `September2025/TectangleHexagonal/out/open_palm_idle.golden.summary.json`
- Regenerate and validate via: `npm run -s hex:openpalm:idle` (ensure a local server is running).

---

## Agent playbook — Clone + Freeze + Diff (GSOS) (WEBWAY:ww-2025-107)

Operating rules

1. When cloning a working demo (e.g., v2 → GSOS):

   - Copy head styles (inline `<style>` and stylesheet `<link>` tags) into the new page.
   - Inject the source page’s main module as a module script so ESM imports resolve relative to the document.
   - Add a minimal fallback CSS to ensure full-screen, responsive layout even if head copy fails.
   - Preserve test hooks and stable `data-testid`s.
   - Gate new logic behind a feature flag (e.g., `FEATURE_SEAT_MANAGER_V1`).

2. Visual baseline + diff:

   - Freeze baseline (v2): `npm run hex:visual:freeze`
   - Diff GSOS against baseline: `npm run hex:visual:diff`
   - If `jest-image-snapshot` is missing, the test suite skips safely.
   - Tests hide the `<video>` element to reduce flakiness; HUD/overlay/shell still render.

3. Test server & models:

   - Default E2E port is 8091 under Jest-Puppeteer; override with `E2E_PORT` or `SITE_BASE` as needed.
   - Ensure models exist before running visuals/smokes:
     - `npm run -s hex:gesture:model`; `npm run -s hex:hand:model`

Artifacts & locations

- Visual test: `September2025/TectangleHexagonal/tests/e2e/visual_clone_parity.test.js`
- Setup: `September2025/TectangleHexagonal/tests/e2e/setupImageSnapshot.js`
- GSOS page: `September2025/TectangleHexagonal/dev/gesture_shell_os_v1.html`
- v2 page: `September2025/TectangleHexagonal/dev/camera_landmarks_wrist_label_v2.html`

