id: ww-2025-073
owner: @TTaoGaming
status: active
expires_on: 2025-10-10
guard: hex:tier:commit (PR) must pass Dino P1/P2 smoke counts and TOI delta bounds
flag: FEATURE_DINO_PINCH
revert: remove folder/flag
---

# Webway: Dino pinch with Kalman lookahead

Goal: Play Dino Runner using gesture pinch with predictive latency (Kalman/One-Euro), triple-check fusion, and TOI telemetry.
Proven path: Reuse existing SDK offline smokes + v3 Kalman e2e; adapt Space key mapping from prior P1 tests.
Files touched: adapters (P1/P2), tests (unit/integration/smoke), Side Panel UI.
Markers: WEBWAY:ww-2025-073:
Next steps:

- Add P1 adapter and unit/integration tests.
- Add TOI telemetry counters and Side Panel table.
- Create palm-forward and palm-away JSONL smokes; wire to CI guards.
- Duplicate adapter for P2 and add dual panel Dino runner.
