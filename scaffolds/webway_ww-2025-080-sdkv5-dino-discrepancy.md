---
id: ww-2025-080
owner: @TTaoGaming
status: active
expires_on: 2025-09-26
guard: e2e: v5_dino_sidecar_smoke must observe downs>0 and probe.downs>=1
flag: FEATURE_SIDECAR_DINO_V5, FEATURE_V5_READY_SENTINEL, FEATURE_V5_AUTOPLAY_PROBE
revert: remove URL param attach and launch-attach flag, revert test gate
---
# Webway: Align SDK v5 Dino sidecar — tests vs manual

## Goal

Align automated tests and manual demo so Dino sidecar consistently receives pinch events and injects Space, with a guard that fails fast on zero engagement.

## Constraints

- License: Dino runner (BSD-3) locally served (source: message)
- Deps budget: 0 new runtime deps (source: defaults)
- Perf budget: <=200ms perceived input latency (source: defaults)
- Privacy: no telemetry exfil; local only (source: defaults)
- Security: no secrets; same-origin iframe (source: message)
- CI: must pass existing tiers; add fail-fast e2e (source: codebase)

## Current Map

- Facade supports on(type, handler) and generic on(handler) — fixed recently (source: September2025/TectangleHexagonal/src/sdk/hexInputFacade.js)
- Dino sidecar subscribes to typed events ('pinch:down'|'pinch:confirm'|'pinch:up') and filters by seat (source: dev/sidecars/dino_sidecar.mjs)
- v5 e2e adds fail-fast on zero downs and probes __sdk via typed listeners (source: tests/e2e/v5_dino_sidecar_smoke.test.js)
- Manual flow: Launch Dino button does NOT call dino.attach; attach happens only via URL param ?dino=1 (source: dev/demo_fullscreen_sdk_v5_material.html)

## Timebox

20 minutes initial slice; extend if guard exposes flaky focus/autoplay (source: defaults)

## Research Notes

- Root cause of earlier “silent no-op” was facade API mismatch; now resolved by typed handler map (source: codebase)
- Current discrepancy: tests pass because they set dino=1, auto-dock iframe, nudge autoplay, and probe; manual use of Launch Dino without dino=1 never attaches sidecar (source: codebase)
- Secondary friction: iframe needs focus/user gesture; tests nudge via canvas click and retries; manual may skip (source: codebase)
- Standards: UI Events KeyboardEvent not trusted across frames; robust pattern is postMessage + target doc.dispatchEvent + focus nudges (source: defaults/industry)
- Media Autoplay Policy requires muted/autoplay and gesture; demo uses muted+autoplay probe flag (source: codebase)

## Tool Inventory

- Local server tasks: "Start local static server 8091" (source: .vscode tasks)
- E2E: tests/e2e/v5_dino_sidecar_smoke.test.js (source: codebase)
- Smoke CLI: tests/smoke/run_v5_dino_p1_only.js (source: codebase)
- Facade: src/sdk/hexInputFacade.js (source: codebase)
- Demo: dev/demo_fullscreen_sdk_v5_material.html (source: codebase)

## Options (Adopt-first)

1. Baseline — Document URL params for manual parity (dino=1&autostart=1&clip=...&la=100)
   - Trade-offs: No code change; relies on operator to remember flags; still subject to focus flake.
2. Guarded extension — Attach sidecar on Launch button behind FEATURE_SIDECAR_DINO_LAUNCH_ATTACH; keep ?dino=1 path too.
   - Trade-offs: Small code path in demo only; improves manual UX; reversible by flag.
3. Minimal adapter — Add sdk.on shim that accepts both shapes and logs misuse; telemetry counter when zero typed subscribers fire.
   - Trade-offs: Slight runtime overhead; broader than demo needs.

## Recommendation

Option 2: Make manual "Launch Dino" attach the sidecar under a feature flag; retain test flags. This removes the main discrepancy while staying reversible.

## First Slice

- In demo file, on btnLaunchDino click, if not attached yet: dino.attach({ sdk }) guarded by FEATURE_SIDECAR_DINO_LAUNCH_ATTACH.
- Ensure nudge focus loop remains; no change to sidecar.
- No API behavior changes; unit tests remain green.

## Guard & Flag

- Guard: v5_dino_sidecar_smoke must see summary.downs>0 and probe.downs>=1 on golden clip.
- Flag: FEATURE_SIDECAR_DINO_LAUNCH_ATTACH (new, default off) + existing FEATURE_SIDECAR_DINO_V5.

## Industry Alignment

- Event subscription precedent: DOM addEventListener(type, handler) vs generic bus; facade now mirrors this (source: codebase/standard)
- Input injection across iframes: prefer postMessage protocol plus target frame dispatch; do not rely on isTrusted KeyboardEvents (source: standard practice)
- Autoplay: HTML Media policy — muted/autoplay and user gesture nudges (source: standard)

## Revert

Disable FEATURE_SIDECAR_DINO_LAUNCH_ATTACH and remove the launch-attach snippet; tests continue using dino=1 path.

## Follow-up

- Add a visible hint in the demo when sidecar is not attached; show a toggle to attach.
- Add a small telemetry counter for missing handId to observe tracker dropouts.
- TTL check on 2025-09-26: if manual parity holds, remove the flag and keep attach-by-launch as default.
