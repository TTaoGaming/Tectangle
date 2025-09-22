---
id: ww-2025-103
owner: @ttao
status: active
expires_on: 2025-10-10
guard: Page/core replays produce consistent frames; tests reference this hex
flag: FEATURE_REPLAY_HEX
revert: remove file and hex/replayLandmarksHex.js
---
# Webway: ReplayLandmarks Hex

## Goal
Provide a deterministic replay hex that feeds recorded landmarks into the page/core for CI and tuning.

## Constraints
- No network in CI beyond local files; accept JSONL input. (source: defaults)
- Keep coupling minimal; expose under hex registry when present. (source: message)

## Current Map
- main.js exposes replay hooks; v2 page lacks a neutral replay hex. (source: codebase)

## Timebox
20 minutes (defaults)

## Research Notes
- parseJsonl/normalizeFrames patterns already used in tests. (source: repo)

## Tool Inventory
- Jest-Puppeteer, http-server, tests/replay/* utilities.

## Options (Adopt-first)
1. Baseline — Script-only replays in tests.
2. Guarded extension — Hex with small API: loadFromUrl, replay, stop. (chosen)
3. Full adapter — Bus + analysis export (defer).

## Recommendation
Option 2: hex-level replay now; wire to future __hex bus later.

## First Slice
- Implement replay hex file and register to registry.

## Guard & Flag
- Guard: add e2e using this hex later.
- Flag: FEATURE_REPLAY_HEX (doc only now).

## Industry Alignment
- Deterministic replays are common for CV/ML pipelines in CI.

## Revert
- Delete the hex file and remove registry registration.

## Follow-up
- Add adapters to inject frames into specific demos via a port.