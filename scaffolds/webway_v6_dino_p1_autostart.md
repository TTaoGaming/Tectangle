---
id: ww-2025-059
owner: @ttao
status: active
expires_on: 2025-10-03
guard: jest: v6_dino_ui_snapshot
flag: FLAG_V6_DINO_P1
revert: remove guarded block or set flag to 0
---
# Webway: v6 Dino P1 autostart + echo

## Goal

Autostart a Dino Runner instance for P1 on the v6 demo and mirror valid P1 pinch events to Space, with a visual snapshot guard.

## Constraints

- License: local assets only (source: message)
- Dependencies: reuse existing sidecar, no new libs (source: codebase)
- Perf: <=200ms added latency budget (source: defaults)
- Privacy/Sec: no external telemetry, no secrets (source: defaults)
- CI: tests must pass, server port conflicts handled via env (source: message)

## Current Map

v6 demo has lock-in HUD; no autostarted Dino instance; tests exist for v5 visuals. (source: codebase)

## Timebox

20 minutes (source: defaults)

## Research Notes

- Sidecar `createDinoSidecar` posts `dino:key` and can target iframe (source: dev/sidecars/dino_sidecar.mjs)
- Golden clip: `/September2025/TectangleHexagonal/videos/golden/golden.two_hands_pinch_seq.v1.mp4` (source: codebase)
- Visual guard pattern: byte-size baseline from v5 (source: tests)

## Tool Inventory

- npm scripts + jest-puppeteer (source: package.json)
- Local http-server via tasks (source: codebase)

## Options (Adopt-first)

1. Baseline — Always attach on load
   - Trade-offs: might fire before lock and cause ambiguity
2. Guarded extension — Attach on first P1 lock and synthesize echo
   - Trade-offs: slight complexity; clear mapping seat→instance
3. Minimal adapter — Use single-window injection only
   - Trade-offs: risks contamination when P2 added next

## Recommendation

Option 2: attach on P1 lock; synthesize Space press for echo.

## First Slice

- Add guarded autostart iframe and bridge
- Attach sidecar on P1 lock; post `dino:key` down/up once
- Expose `__diag.dinoEcho` and gate ready sentinel
- Add v6 visual snapshot test (byte-size baseline)

## Guard & Flag

- Guard: jest test `v6_dino_ui_snapshot.test.js`
- Flag: `FLAG_V6_DINO_P1` (URL param `flag_v6_dino_p1=0` to disable)

## Industry Alignment

- Feature flagging and visual regression are standard (source: defaults)

## Revert

- Delete guarded block or set flag to 0 in URL/search params

## Follow-up

- Add P2 second instance, isolate targets; dual snapshot
- Tighten visual diff with perceptual metric when stable
