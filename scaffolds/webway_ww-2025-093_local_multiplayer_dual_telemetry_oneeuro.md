---
id: ww-2025-093
owner: @you
status: active
expires_on: 2025-10-05
guard: npm run -s hex:tier:commit
flag: FEATURE_ONEEURO_DUAL_TELEM
revert: remove FEATURE_ONEEURO_DUAL_TELEM wiring and this note
---
# Webway: Local multiplayer + dual telemetry + OneEuro exposure

## Goal

Deliver a reversible slice on the v7 fullscreen workbench enabling: P2 sidecar wiring for local multiplayer; dual-seat telemetry panels (wrist xyz, palm cone, gesture+confidence, sparkline); and user-exposed One Euro smoothing alongside existing Kalman.

## Constraints

- License: OSS-compatible, no GPL transitive (source: defaults)
- Deps: <=1 small lib; prefer zero (source: defaults)
- Perf: <=200ms end-to-end latency (source: defaults)
- Privacy/Security: no telemetry exfil; no secrets (source: defaults)
- CI: must pass existing goldens/smokes (source: defaults)

## Current Map

- Base: September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v7_material.html (source: codebase)
- Features present: seat magnets + lock HUD, XR emu bridge, Kalman tray (LA/Q/R), P1 Dino sidecar, drawer with P1/P2 cards (source: codebase)
- Docs/logs: multiple related webways and SRL/ADR entries exist (source: codebase)

## Timebox

20 minutes (source: defaults)

## Research Notes

- OneEuro defaults seen in out/analysis.pinch.jsonl: {min:2.2,beta:0.04,d:1.2} (source: codebase)
- Test helpers: __simulateOcclusion/__simulateReentry/__seatMagState in v7 demo (source: codebase)
- CI guards: golden MP4, UI snapshots, drawer open smoke, seatmag ghost persistence (source: codebase)

## Tool Inventory

- npm scripts: hex:goldens, hex:smoke:golden, hex:test:unit, hex:tier:commit (source: package.json)
- VS Code tasks: "Run hex unit tests", "Run hex golden verify", "Hex: boundary lint" (source: .vscode/tasks, workspace tools)

## Options (Adopt-first)

1. Baseline — Clone P1 Dino sidecar for P2 with seat-aware channel; add basic telemetry readouts; keep Kalman only.
   - Trade-offs: Fastest, but no OneEuro and limited UX.
2. Guarded extension — Add P2 sidecar + telemetry; expose OneEuro controls under FEATURE_ONEEURO_DUAL_TELEM; keep Kalman tray.
   - Trade-offs: Minimal risk with flag; CI guards cover UI.
3. Minimal adapter — Create adapter to multiplexer sidecar messages per seat; OneEuro config via URL params only.
   - Trade-offs: Lowest surface change, but less discoverable.

## Recommendation

Option 2 for safe, visible progress behind a flag.

## First Slice

- Instantiate P2 Dino sidecar with distinct channel (seat=2).
- Add telemetry window per seat (draggable): wrist xyz, palm cone toggle, gesture+confidence, sparkline.
- Expose OneEuro controls (min, beta, d) next to Kalman tray; default off.

## Guard & Flag

- Guard: run goldens + drawer UI contract + ghost persistence smoke.
- Flag: FEATURE_ONEEURO_DUAL_TELEM

## Industry Alignment

- OneEuro smoothing widely used for hand tracking UIs; Kalman co-exists for predictive stabilization.

## Revert

Remove FEATURE_ONEEURO_DUAL_TELEM code branches and this webway; sidecar P2 can be left inert if guarded.

## Follow-up

- Wire spatial zones and wrist persistence to re-snap flows; add tests.
- Add exporter of telemetry JSONL slices for both seats.
