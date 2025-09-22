---
id: ww-2025-066
owner: @TTaoGaming
status: active
expires_on: 2025-10-03
guard: test: hex:no-ad-hoc-ui (marker + lint)
flag: HEX_TELEM_STRIPS
revert: remove folder/flag
---
# Webway: Hex Telemetry Strips + CI Guard

## Goal

Extract telemetry strips (sparkline, thresholds, ghost) from v7 demo into a hex adapter/port so visualizations are not ad hoc. Establish a forward-only guard (dated 2025-09-19) ensuring new UI surfaces wire through hex ports.

## Constraints

- License: MIT (repo default) (source: defaults)
- Dependencies: prefer zero; if needed, 1 small lib max (source: defaults)
- Perf: <= 200ms UI budget (source: defaults)
- Privacy/Sec: no telemetry, no secrets (source: defaults)
- CI: must pass; do not break current demos (source: defaults)

## Current Map

- v7 workbench renders strips and sparkline inline (ad hoc) in `demo_fullscreen_sdk_v7_material.html`.
- Seat mapping falls back to hand-heuristics; history/ghost drawn in canvas.
- Tests do not assert sparkline nor enforce hex usage.

## Timebox

20 minutes initial design and scaffolding (source: defaults)

## Research Notes

- Sparkline code found in v2/v5/v6/v7 demos; absent from hex ports (source: repo search)
- Existing Webways cover v7 drawer, toolbar UX, Dino autostart; no guard for ad hoc UI (source: scaffolds)

## Tool Inventory

- npm scripts: e2e/jest puppeteer, hex tier tasks (source: package.json)
- Silk Scribe logs and index (source: HFO/…/SilkScribe)

## Options (Adopt-first)

1. Baseline — Marker + Flag only
   - Wire a feature flag (HEX_TELEM_STRIPS) and place WEBWAY markers. Document adapter shape. No runtime change.
   - Trade-offs: Fast and safe; does not yet enforce usage nor refactor code.
2. Guarded extension — Add adapter type + no-op adapter, gate new UI via adapter import; add lint/test checking markers for files changed after 2025-09-19.
   - Trade-offs: Minimal code; starts CI habit; low risk.
3. Minimal adapter — Implement `createTelemetryStrip()` hex port with pure data → render state; inject into v7; add smoke asserting rows exist and sparkline canvas sized.
   - Trade-offs: Slightly higher risk; still keeps visuals while de-ad-hoc-ifying core logic.

## Recommendation

Option 2 today: add flag + adapter contract + lint/test guard; follow with Option 3 in next slice to migrate v7 without regressions.

## First Slice

- Add WEBWAY markers and HEX_TELEM_STRIPS guard in v7 file at strip code.
- Author adapter contract: inputs (snapshots, thresholds), outputs (norm, fsm, history window, ghost).
- Add CI policy test stub to fail if new UI files lack WEBWAY markers or flag reference (permit legacy via cutoff date 2025-09-19).

## Guard & Flag

- Guard: script `hex:no-ad-hoc-ui` checks WEBWAY markers on changed UI files; Jest smoke stub validates presence of markers.
- Flag: `HEX_TELEM_STRIPS` enabled via `?hex_telem=1` (future slices may switch default).

## Industry Alignment

- Hexagonal/UI ports to separate domain from presentation is standard; marker+flag migration is common in large JS apps (source: industry practice)

## Revert

- Remove the WEBWAY markers and the flag mentions; delete CI stub and script.

## Follow-up

- TTL check: 2025-09-26 — promote adapter and migrate v7 draw loop to use it.
- Additional notes: add finger-curl mini-model as a second visualization via the same port.
