---
id: ww-2025-082
owner: @TTaoGaming
status: active
expires_on: 2025-09-27
guard: e2e: September2025/TectangleHexagonal/tests/e2e/xr_emu_vrm_bridge.smoke.test.js
flag: FEATURE_PINCH_STANDARDS_BRIDGE
revert: remove FEATURE_PINCH_STANDARDS_BRIDGE and adapter files
---
# Webway: Pinch → Standards Bridge (WebXR, VRM, MPE)

## Goal

Unify your proven pinch pipeline (Kalman 1D prediction, hysteresis, joint-angle and velocity confirmation, palm gating) with industry standards so it powers both today’s web demo and tomorrow’s VR/game/creative tools without rewrites.

## Constraints

- Perf: <= 200 ms end-to-end from hand frame to action (source: defaults)
- Deps: <= 1 small adapter lib per surface (XR, VRM, MIDI) (source: defaults)
- Privacy: no telemetry; local processing only (source: defaults)
- Security: no secrets committed (source: defaults)
- CI: must pass; add a smoke e2e (source: defaults)
- License: three-vrm (MIT), Kalidokit (MIT), WebXR/Web MIDI are web standards (source: message+industry)

## Current Map

- You have robust pinch detection with: Kalman 1D, hysteresis, joint-angle + velocity confirmation, palm gating, and seat/ghost persistence via Seat Magnet Manager (source: message+repo)
- Demo harness v7 + overlay, unit tests passing, one e2e for ghost persistence pending autosnap tweak (source: message)

## Timebox

20 minutes to land the first reversible slice behind a flag (source: defaults)

## Research Notes

- WebXR Device API: emits select/selectstart/selectend; hand joints via XRHand; can be emulated in-page for non-XR contexts (source: industry)
- VRM (three-vrm) + Kalidokit: established retargeting; finger curl maps; quick to adopt for avatar feedback (source: industry)
- Web MIDI API (MPE): map pinch strength/distance vectors to MPE pitch/CC; creative tool bridge (source: industry)
- Your palm gating and hysteresis align with standard input debouncing and gesture confirmation best practices (source: message)

## Tool Inventory

- npm scripts: hex tiers, e2e via jest+puppeteer; local http server tasks available (source: repo)
- Tests: unit (79 passing), e2e harness present; golden assets exist (source: message)
- Flags used: seatmag/auto, FINGER_ATLAS; add umbrella FEATURE_PINCH_STANDARDS_BRIDGE with sub-flags FEATURE_XR_EMU, FEATURE_VRM, FEATURE_MPE_BRIDGE (source: message)

## Options (Adopt-first)

1. Baseline — Keep custom pipeline only in demo
   - How: No new adapters; continue bespoke DOM events.
   - Trade-offs: Fast now, poor portability to XR/VRM/DAW; harder ecosystem alignment.
2. Guarded extension — XR Emulation Adapter
   - How: Wrap your pinch confirm to emit WebXR-like select/selectend plus XRHand joint curls; behind FEATURE_XR_EMU. Provide a small scene reticle.
   - Trade-offs: Minimal code; instantly compatible with XR input semantics; no avatar yet.
3. Minimal adapter — VRM + MPE bridge
   - How: Use Kalidokit to retarget finger curls to a VRM avatar; map seat anchor deltas to Web MIDI MPE CC/pitch; behind FEATURE_VRM and FEATURE_MPE_BRIDGE.
   - Trade-offs: Slight deps; big feedback value and creative-tool reach.

## Recommendation

Option 2 now, then Option 3. Emit standard WebXR events first to validate semantics, then add a tiny VRM/MPE adapter for feedback and tool virtualization.

## First Slice

- Add an XR emu adapter (no device needed) that:
  - Listens to your pinch-confirmed state and dispatches selectstart/selectend on a target element.
  - Publishes a lightweight XRHand-like joint curl value for P1 via a simple API.
- Guard behind FEATURE_XR_EMU within FEATURE_PINCH_STANDARDS_BRIDGE.
- Add a jest-puppeteer smoke: when flag is on, a test page receives selectstart on pinch and updates a counter.

## Guard & Flag

- Guard: e2e smoke at September2025/TectangleHexagonal/tests/e2e/xr_emu_vrm_bridge.smoke.test.js
- Flag: FEATURE_PINCH_STANDARDS_BRIDGE (sub: FEATURE_XR_EMU, FEATURE_VRM, FEATURE_MPE_BRIDGE)

## Industry Alignment

- Standard: WebXR Device API input events and hand joints (source: industry)
- State-of-the-art: three-vrm + Kalidokit for avatar retarget; Web MIDI MPE for expressive control (source: industry)

## Revert

Remove FEATURE_PINCH_STANDARDS_BRIDGE usage and delete the adapter files; no data migration.

## Follow-up

- TTL check: If not adopted within 7 days, expire and archive.
- Additional notes: After XR emu proves stable, add VRM visual and optional MPE mapping with opt-in consent.
