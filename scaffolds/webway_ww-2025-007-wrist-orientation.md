---
id: ww-2025-007
owner: @TTaoGaming
status: active
expires_on: 2025-10-08
guard: hex:verify:fast
flag: FEATURE_WRIST_ORIENT_V1
revert: remove folder/flag
---
# Webway: Planar Wrist Orientation Core

Goal: Introduce a pure planar wrist orientation core that emits raw + smoothed (EMA) wrist→indexMCP angles (0–360°) and bucketized cardinal directions (UP/RIGHT/DOWN/LEFT) to downstream bridges while remaining fully feature‑flagged for safe incremental adoption.

Proven path: Mirrors existing pinchCore purity pattern (stateless update, event emission) and HandSessionManager lifecycle extraction (WEBWAY:ww-2025-006). Smoothing via EMA on unit vector (α default 0.25) is a known low-latency stabilizer used in prior pinch distance smoothing.

Files touched:
- `September2025/TectangleHexagonal/src/core/wristOrientationCore.js` (new emitter with raw & smoothed angle, bucket flags)  
- `September2025/TectangleHexagonal/src/app/handSessionManager.js` (optional per-hand orientation core, gated)  
- `September2025/TectangleHexagonal/src/app/appShell.js` (flag wiring + exposure of orientation events)  
- `September2025/TectangleHexagonal/src/app/gameEventBridge.js` (consumes latest bucket for action mapping)  
- `September2025/TectangleHexagonal/dev/wrist_orientation_demo.html` (visual harness)  
- Tests: `wristOrientationCore.test.mjs`, `wristOrientationSmoothing.test.mjs`, `wristOrientationDemoHarness.test.mjs`.

Markers: WEBWAY:ww-2025-006 present in integration sites; orientation-specific logic is behind FEATURE_WRIST_ORIENT_V1.

SRL (Silk Scribe Rollup):
1. Vector Choice: indexMCP chosen (stable & always present) instead of middleMCP simplifying reliability; future 3D upgrade can derive yaw/pitch from additional points.  
2. Angle Domain: 0–360° (Math.atan2) allows simple bucket thresholds; avoids discontinuity at negative range boundary.  
3. Buckets: Inclusive quadrants (0°=RIGHT, 90°=DOWN, 180°=LEFT, 270°=UP) enable deterministic cardinal mapping; smoothing does not re-bucket unless threshold crossed.  
4. Smoothing: EMA over unit vector prevents wrap issues at 359→0 by smoothing vectors then re-normalizing; avoids angular jump artifacts.  
5. Event Contract: `{ type:'wrist:orientation', t, angleDeg, smoothAngleDeg, bucket, flags:{up,right,down,left}, handKey }` stable; downstream may ignore `smoothAngleDeg` for latency-critical paths.  
6. Suppression: Unless `emitUnchanged`, events only fire on bucket change or >~0.5° delta to reduce noise load on bridges.  
7. Revert Simplicity: Delete core file, demo page, tests, flag lines; HandSessionManager/appShell remove orientation branch; no schema or golden changes required.  
8. Upgrade Path: Extend to quaternion (compute palm normal vs camera) → derive roll/pitch; add angular velocity + dwell telemetry; integrate into gameBridge for gesture combos.  
9. Risk Mitigation: Feature flag defaults off; tests enforce independent core instances (no shared state) to catch accidental singletons.  
10. Stability: EMA alpha tunable via constructor; future adaptive smoothing can switch α based on angular speed (same principle as OneEuro).

Next steps:
- Add quaternion-based 3D orientation (pitch/roll) behind `FEATURE_WRIST_ORIENT_3D`.  
- Angular velocity events (`wrist:orientationVel`) for gesture combos (flick up/down).  
- Dwell telemetry: time-in-bucket histograms per seat for analytics adapter.  
- Config surface exposing smoothing alpha and emitUnchanged to dev UI.  

Markers: WEBWAY:ww-2025-007 will be added if integration lines expand (currently minimal new file; integration markers reuse ww-2025-006 to avoid marker proliferation in same block).

Next review: before `expires_on` decide: (a) promote to stable (remove flag, roll into core README section) or (b) drop if unused.
