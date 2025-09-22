// GateFSM: Open -> Pose -> Open clutch with hold/cooldown timers.
// WEBWAY:ww-2025-108: Feature-flagged watchdog + stale context for GSOS
// XState v5 patterns via the Hex port wrapper (import from ports/xstatePort.js).
// This is intentionally minimal and inspectable; wire to GestureShell OS only.

import { XState } from '../ports/xstatePort.js';
import { flag } from '../ports/featureFlagsPort.js';
const { createMachine, createActor, assign } = XState;

export function createGateMachine(config = {}) {
  const minScore = Number(config.minScore ?? 0.45);
  const holdMs = Number(config.holdMs ?? 150);
  const cooldownMs = Number(config.cooldownMs ?? 200);
  const labelOpen = config.labelOpen ?? 'Open_Palm';
  // Watchdog: feature-flagged; default 1000ms when enabled. Can be overridden via config.watchdogMs.
  const watchdogEnabled = (typeof config.watchdogMs === 'number') || flag('FEATURE_GATESHELL_FSM_WATCHDOG', false);
  const watchdogMs = typeof config.watchdogMs === 'number' ? Number(config.watchdogMs) : 1000;

  const machine = createMachine({
    id: config.id || 'gate',
    context: { label: null, score: 0, t: 0, stale: false, watchdogMs: watchdogEnabled ? watchdogMs : 0 },
    initial: 'idle',
    states: {
      idle: {
        on: {
          LABEL: {
            target: 'primed',
            guard: ({ event }) => !!event && event.label && event.label !== labelOpen && (event.score ?? 0) >= minScore,
            actions: assign(({ context, event }) => ({
              ...context,
              label: event.label,
              score: event.score ?? 0,
              t: event.t ?? (typeof performance!=='undefined'?performance.now():Date.now()),
              stale: false
            }))
          }
        }
      },
      primed: {
        after: Object.assign(
          { [holdMs]: 'held' },
          watchdogEnabled ? { [watchdogMs]: { target: 'idle', actions: assign(({ context }) => ({ ...context, stale: true })) } } : {}
        ),
        on: {
          LABEL: [
            {
              target: 'idle',
              guard: ({ event }) => event?.label === labelOpen
            },
            {
              actions: assign(({ context, event }) => ({
                ...context,
                label: event.label,
                score: event.score ?? 0,
                t: event.t ?? (typeof performance!=='undefined'?performance.now():Date.now()),
                stale: false
              }))
            }
          ]
        }
      },
      held: {
        after: watchdogEnabled ? { [watchdogMs]: { target: 'idle', actions: assign(({ context }) => ({ ...context, stale: true })) } } : undefined,
        on: {
          LABEL: {
            target: 'cooldown',
            guard: ({ event }) => event?.label === labelOpen
          }
        }
      },
      cooldown: {
        after: { [cooldownMs]: 'idle' }
      }
    }
  });

  const actor = createActor(machine);
  return actor;
}
