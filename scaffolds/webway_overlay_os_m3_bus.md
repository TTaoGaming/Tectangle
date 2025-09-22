---
id: ww-2025-094
owner: @TTaoGaming
status: active
expires_on: 2025-09-27
guard: npm run -s hex:overlay:verify
flag: FEATURE_OS_BUS_V1
revert: remove overlay files + scripts
---
# Webway: Overlay OS (M3 + Bus)

## Goal
Professional-grade overlay OS aligned to Material 3; two-hand landmark viz and clutch FSM sparkline with primed/armed gating to avoid false triggers.

## Constraints
- Adopt-first: MediaPipe Tasks; BroadcastChannel for intra-page IPC (no external deps)
- Perf: <= 200ms TTI; low CPU while idle
- Privacy/Security: no telemetry; same-origin only; no secrets
- CI: must pass unit + smoke and integrate with Hex tiers

## Current Map
- overlay_os_v1.html exists (camera bg, dock, windows) — now M3-aligned
- Placeholder apps exist — now bus-wired
- Tests/CI minimal; added unit+smoke and scripts

## Timebox
20 minutes (source: defaults)

## Research Notes
- M3 tokens already present in dev/design (source: repo)
- Prior UI demos used tokens; reusing canon (source: repo)
- Bus via BroadcastChannel avoids heavy state mgmt (source: defaults)

## Tool Inventory
- npm scripts: hex:overlay:unit|smoke|verify (source: repo)
- Tests: unit (FSM) + smoke (windows+bus) (source: repo)
- Pages: overlay_os_v1.html, apps/app_* (source: repo)

## Options (Adopt-first)
1. Baseline — Synthetic feed to bus; apps render two-hands + FSM sparkline.
   - Trade-offs: No real sensor yet; good for CI and UI iteration.
2. Guarded extension — Hook MediaPipe recognizer publisher to bus topics overlay:landmarks and overlay:fsm.
   - Trade-offs: Add adapter layer; still reversible.
3. Minimal adapter — Use SharedWorker for fanout when multiple tabs; fallback to BroadcastChannel.
   - Trade-offs: More moving parts; only if needed.

## Recommendation
Option 2 next: connect recognizer outputs to bus topics behind a flag.

## First Slice
- Align M3; add bus + FSM; wire apps; tests + scripts.

## Guard & Flag
- Guard: npm run -s hex:overlay:verify
- Flag: FEATURE_OS_BUS_V1

## Industry Alignment
- Material Design 3 tokens for surface/shape/elevation
- Web standard BroadcastChannel for intra-page comms

## Revert
Remove WEBWAY markers, delete src/overlay/* and tests, drop overlay scripts.

## Follow-up
- Replace synthetic feed with real recognizer publisher
- Add threshold/cooldown sliders behind dev flag
- Visual regression for windows (golden)
