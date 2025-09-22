---
id: ww-2025-111
owner: @you
status: active
expires_on: 2025-10-21
guard: npm run -s hex:overlay:verify
flag: FEATURE_GSOS_PANELS
revert: remove GSOS page + flag
---
# Webway: GSOS WinBox Panels + E2E

## Goal

Make GSOS shell open inspectable panels (XState, MediaPipe) reliably with Material Web UI, detectable in e2e.

## Constraints

- No bundler; raw ESM over static server.
- Tests must pass in CI; no external downloads required.
- Keep v2 stable; GSOS gated.

## Current Map

- GSOS scaffold page exists with bottom bar.
- WinBox wrapper with CDN + stub fallback.
- XState/MediaPipe panels implemented but e2e was flaky.

## Timebox

20 minutes (source: defaults)

## Research Notes

- xstate bare import failed; fallback to /node_modules/xstate/dist/xstate.esm.js (source: codebase)
- Shadow DOM clicks need composedPath and capture phase (source: codebase)
- Tests can probe data-testid and window markers (source: codebase)

## Tool Inventory

- jest-puppeteer, http-server, WinBox, Material Web (source: codebase)

## Options (Adopt-first)

1. Baseline — pure WinBox + Material; rely on ESM/import maps.
   - Trade-offs: brittle on static server.
2. Guarded extension — add UMD + DOM stub fallbacks and test markers.
   - Trade-offs: more code, but robust.
3. Minimal adapter — shim open hooks (__gso.openApp) and data-testids.
   - Trade-offs: test-specific wiring.

## Recommendation

Option 2 with Option 3 hooks for reliability.

## First Slice

- Add stub window creation with data-testids and __wbTest markers.
- Event delegation for Material buttons using composedPath.
- Programmatic open hook (window.__gso.openApp).

## Guard & Flag

- Guard: hex:overlay:verify
- Flag: FEATURE_GSOS_PANELS

## Industry Alignment

- XState v5 patterns; WinBox fallback is common for e2e.

## Revert

Remove GSOS scaffolds and stub markers; disable FEATURE_GSOS_PANELS.

## Follow-up

- Add golden MP4 playback e2e.
- Wire Recognizer/OneEuro/Lookahead panels.
