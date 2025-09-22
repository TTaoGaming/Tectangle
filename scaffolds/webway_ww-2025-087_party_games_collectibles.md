---
id: ww-2025-087
owner: @webcartographer
status: active
expires_on: 2025-10-13
guard: ci:smoke-party-quickdraw (3 trials; detects DRAW! window; increments coins on win; a11y title)
flag: FEATURE_PARTY_GAMES, FEATURE_COLLECTIBLES, FEATURE_3D_VIEWER
revert: remove party demo + flags + index entries; keep Arcade Hub intact
---
# Webway: Party games + collectibles (gesture, proprioception, 3D on phone)

## Goal

Deliver a tiny but delightful “party” seed: quick, replayable gesture mini‑games that improve body awareness and reward play with cosmetic collectibles (coins → cosmetics), viewable as lightweight 3D on phones. Keep payments optional; enable deterministic crafting with time‑gated unlocks.

## Constraints

- License: open web + in‑repo assets; avoid closed ecosystems initially (source: defaults)
- Dependencies: +1 small 3D viewer (model‑viewer) allowed; Gesture Tasks via CDN (source: message)
- Perf: sub‑200ms gesture→feedback; 60 FPS target on mid‑range phones (source: defaults)
- Privacy: localStorage for coins/progress; no tracking by default (source: message)
- CI: smoke verifies the quickdraw loop and collectible counter (source: message)

## Current Map

- Gesture demos + Arcade Hub exist; iframe bridges proven (source: repo)
- Gesture Tasks CDN pattern shipped (Closed_Fist) (source: repo)
- Governance (Webways, SRL/ADR) and flags in place (source: repo)

## Timebox

Planning/logs 20m; Quick Draw baseline 60–90m; smoke 40m (source: defaults)

## Research Notes

- Party loops: simple “ready… set… DRAW!” with honest reaction windows creates social fun and measurable progress. (source: message)
- Collectibles: deterministic crafting over time avoids pay‑to‑win while allowing optional cosmetics revenue. (source: message)
- On‑device 3D: `<model-viewer>` or three.js with GLTF keeps it lightweight for phones. (source: message)

## Tool Inventory

- MediaPipe Tasks Gesture Recognizer (CDN), model‑viewer or three.js, localStorage, jest+puppeteer for smoke. (source: message)

## Options (Adopt‑first)

1. Quick Draw (single player) — Closed_Fist within window wins; add score+coins.
   - Trade‑offs: fastest seed; local fun; primes infra.
2. Pass‑and‑play (family) — 2–4 players alternate rounds; simple leaderboard.
   - Trade‑offs: a bit more UI/state; high delight.
3. 3D cabinet — Add a cosmetic shelf with a GLTF viewer; deterministic crafting with timers.
   - Trade‑offs: adds assets and viewer; showcases value/beauty.

## Recommendation

Option 1 now; layer Option 2 and 3 once the loop is sticky.

## First Slice

- `dev/party_quickdraw.html`: idle → random wait → “DRAW!” → short response window (e.g., 400ms). Recognize Closed_Fist; if win, +1 score and +1 coin to localStorage. Include reset.
- WEBWAY markers; expose `window.__pqSim.fireOnce()` for smoke.

## Guard & Flag

- Guard: `ci:smoke-party-quickdraw` — open page, skip wait by calling a test hook to trigger DRAW!, simulate a win via `__pqSim`, verify score/coins.
- Flags: `FEATURE_PARTY_GAMES`, `FEATURE_COLLECTIBLES`, `FEATURE_3D_VIEWER`.

## Industry Alignment

- Skill loops + cosmetics monetize ethically when progression remains deterministic/time‑gated. (source: message)
- On‑device ML + web 3D are mature enough for approachable mobile experiences. (source: message)

## Revert

- Delete the page and flag mentions; remove SRL/ADR entries and index updates.

## Follow‑up

- Add pass‑and‑play and leaderboard; introduce a tiny cosmetic viewer; consider daily challenges.
- Explore haptics/audio for feedback; A/B reaction window to tune difficulty.
