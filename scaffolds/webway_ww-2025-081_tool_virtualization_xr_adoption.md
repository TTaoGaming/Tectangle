---
id: ww-2025-081
owner: @spatial-input
status: active
expires_on: 2025-10-10
guard: ci: unit + golden + new xr smoke
flag: FEATURE_XR_EMU, FEATURE_VRM
revert: disable flags; remove adapter; keep seatMag/ghost core
---
# Webway: Tool Virtualization XR — adopt-first stack

## Goal

Create the smallest safe slice to deliver "tool virtualization" usable in simple games and XR scenes on mobile (mono camera) by adopting standards and proven adapters: WebXR controller surface + VRM avatar retargeting.

## Constraints

- License: MIT/Apache only (three.js, three-vrm, Kalidokit, Babylon.js) (source: defaults)
- Perf: <200ms/frame end-to-end on mid Android; minimal GC churn (source: defaults)
- Privacy/Security: no telemetry, no secrets (source: defaults)
- CI: existing tiers pass; new XR smoke added; all under flags (source: defaults)

## Current Map

- SeatMag + ghost persistence implemented and tested; v7 harness; golden assets. Overlay/manager already emit stable seated landmarks in occlusion (source: repo)

## Timebox

20 minutes for planning; 2–3 days to ship first slice (source: defaults)

## Research Notes

- VRM provides standardized humanoid rig; three-vrm (MIT) is widely used (source: message)
- Kalidokit provides MediaPipe → VRM retargeting + smoothing (source: message)
- WebXR Device API + Input Profiles are the standard controller contract for browsers/engines (Babylon/Three) (source: message)

## Tool Inventory

- three.js, three-vrm, Kalidokit (MIT)
- Babylon.js (MIT) optional sample scene for XR controller compatibility
- Existing tests: Jest+Puppeteer e2e, unit; add XR smoke (source: repo)

## Options (Adopt-first)

1. WebXR controller emulation + VRM retarget (no heavy physics)
   - Hook seat/pinch/pose to WebXR select/squeeze/pose; retarget seated landmarks (live/ghost) to VRM via Kalidokit.
   - Trade-offs: No collisions; simplest path; highest compatibility.
2. Add light constraints/springs (no rigid bodies)
   - Critically damped smoothing for fingers; minimal inertia feel without physics engine.
   - Trade-offs: Slight tuning; very low overhead.
3. Physics integration (Rapier) for interactions (later)
   - Only for scenes needing contact/collisions.
   - Trade-offs: Complexity and perf risk; keep behind feature flag.

## Recommendation

Option 1 now, Option 2 if needed for feel; reserve Option 3 for real interactions.

## First Slice

- FEATURE_XR_EMU: Adapter translating seat events to WebXR select/squeeze; expose pose from seated wrist.
- FEATURE_VRM: Kalidokit retargeter consuming getSeatedLandmarks(seat) → three-vrm avatar.
- Smoke e2e: "VRM visible during occlusion; select works" on mobile profile.

## Guard & Flag

- Guard: unit + golden + XR smoke must pass.
- Flags: FEATURE_XR_EMU, FEATURE_VRM (default off).

## Industry Alignment

- WebXR + Input Profiles are standard; VRM is de facto avatar standard for web; Kalidokit is proven retargeter.

## Revert

- Disable FEATURE_XR_EMU/FEATURE_VRM; remove adapter modules; keep SeatMag/ghost core untouched.

## Follow-up

- Add Babylon.js sample scene; optional marker AR via mind-ar.js; consider Rapier only where interactions are required.
