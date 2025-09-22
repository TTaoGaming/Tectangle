---
id: ww-2025-108
owner: @cartographer
status: active
expires_on: 2025-09-28
guard: npm run -s hex:test:unit
flag: FEATURE_GATESHELL_FSM_WATCHDOG
revert: remove folder/flag
---
# Webway: GestureShell FSM Watchdog + Stale Indicator

## Goal

Introduce a small watchdog to reset gesture gates if inputs stall, and surface a stale indicator in the inspector so operators can see when a stream is "stuck". Keep it feature-flagged and isolated to GestureShell OS.

## Constraints

- License: existing project licenses only (no new deps). (source: defaults)
- Dependency budget: 0 new libs; use XState port only. (source: defaults)
- Performance: watchdog check <= O(1), timers ~<= 1 per actor; <200ms guard. (source: defaults)
- Privacy: no telemetry expansion by default. (source: defaults)
- Security: no secrets, browser-only. (source: defaults)
- CI: unit tests must pass. (source: defaults)

## Current Map

- GateFSM exists: idle→primed→held→cooldown, labelOpen=Open_Palm, with hold/cooldown timers. Inspector WinBox shows snapshots. (source: message)
- Bug in gateFsm.js duplicate export. (source: message)
- Feature flags available via src/app/featureFlags.js. (source: code)

## Timebox

20 minutes. (source: defaults)

## Research Notes

- XState after timers are appropriate for watchdog transitions. (source: message)
- Inspector can derive staleness by tracking last snapshot change time. (source: message)
- URL/JS globals pattern for flags already used (globalThis.__flags). (source: code)

## Tool Inventory

- run tests: npm run -s hex:test:unit (Tasks available). (source: codebase)
- feature flags helper: src/app/featureFlags.js. (source: code)
- actor registry: src/ports/xstateRegistry.js. (source: code)
- inspector: src/ui/xstateInspectorWinbox.js. (source: code)

## Options (Adopt-first)

1. Baseline — Machine-local watchdog
   - Add after: { watchdogMs: 'idle' } from primed/held if no events, set context.stale=true; clear on next LABEL. (source: message)
   - Trade-offs: Simple, per-actor, no cross-actor sync; small risk of masking upstream stalls.
2. Guarded extension — External heartbeat event
   - Emit HEARTBEAT from input loop, machine resets if missed; inspector shows lastHeartbeat. (source: message)
   - Trade-offs: Requires wiring producers; more accurate, more moving parts.
3. Minimal adapter — Inspector-only stale detection
   - No machine changes; inspector flags stale if snapshot unchanged for T. (source: message)
   - Trade-offs: Non-invasive; doesn't unstick state automatically.

## Recommendation

Option 1: Machine-local watchdog with Option 3 UI. Fastest reversible slice and improves UX immediately.

## First Slice

- Flag FEATURE_GATESHELL_FSM_WATCHDOG on. gateFsm: add watchdogMs (default 1000ms) in primed and held; transition to idle and set context.stale=true. Clear stale on LABEL. Remove duplicate export bug.
- Inspector: compute ageMs since last change; show context.stale and highlight when ageMs>watchdogMs.

## Guard & Flag

- Guard: unit tests for gateFsm timers. (source: defaults)
- Flag: FEATURE_GATESHELL_FSM_WATCHDOG (globalThis.__flags) (source: code)

## Industry Alignment

- XState timers are standard for timeout safeguards. (source: message)
- Watchdogs are common in realtime input systems. (source: message)

## Revert

- Remove watchdog branches and inspector styling; delete this note; unset FEATURE_GATESHELL_FSM_WATCHDOG.

## Follow-up

- Wire real gesture feed heartbeat; export lastEventTs to telemetry. TTL check: 7 days.
