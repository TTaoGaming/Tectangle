---
id: ww-2025-105
owner: @ttao
status: active
expires_on: 2025-10-12
guard: hex:test:unit for facade contract + minimal e2e smoke routes
flag: FEATURE_SDK_FACADE_V0
revert: remove facade files and feature flag
---
# Webway: SDK/API v0 Facade (IManager-style)

## Goal

Expose a stable, minimal public API to initialize, configure keymaps, subscribe to events, and export telemetry, so any demo/game can adopt gesture input without touching internals.

## Constraints

- Public surface must be tiny and stable; breaking changes require version bump.
- No network; fully in-browser; works with ReplayLandmarks for tests.
- Hex architecture: facade is a hex; adapters wrap detectors and sinks.

## Current Map

- Settings hex present; Registry exists; ReplayLandmarks hex available.
- No unified facade; pages wire components manually.

## Timebox

20 minutes (defaults)

## Research Notes

- User request: `IManager` with `init/setKeyMap/on/exportTelemetry` (source: TommyNotesSeptember2025.txt)
- Prior SDK v3/v5 notes in scaffolds show desired shape (source: scaffolds/webway_sdk_*).

## Tool Inventory

- Jest unit tests; jest-puppeteer e2e; Tasks to serve on 8080.

## Options (Adopt-first)

1. Baseline — Thin event bus + methods: init, on, off, setKeyMap, exportTelemetry.
   - Trade-offs: Minimal; easy to adopt; leaves room to grow.
2. Guarded extension — Add plugin stubs (pinch predictor, wrist compass, telemetry sinks).
   - Trade-offs: Slightly larger surface; still modular.
3. Minimal adapter — Provide `fromPage()` helpers to bind existing demos quickly.
   - Trade-offs: Coupling to pages; reversible.

## Recommendation

Start with Option 1. Add plugin stubs later as separate hexes.

## First Slice

- Define TypeScript-like JSDoc typedefs for events and options.
- Implement facade singleton under `src/hex/sdk/facade_v0.js` with the five methods.
- Bridge existing Settings hex and emit telemetry events.

## Guard & Flag

- Guard: unit tests for event bus and keymap setter; e2e smoke initializes facade on a demo page.
- Flag: FEATURE_SDK_FACADE_V0 controls exposure on pages.

## Industry Alignment

- Public facades isolate internal churn; common in SDK design (Stripe/Mapbox style minimal surface).

## Revert

- Delete facade files and remove flag; pages remain functional without facade.

## Follow-up

- Add `plugins/` for predictor, quantization, and sinks (CSV/JSONL/WebMIDI).
