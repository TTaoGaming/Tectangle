// WEBWAY:ww-2025-109: PalmClutch FSM — seats on Open_Palm, primes gestures, fires with velocity confirmation
import { XState } from '../ports/xstatePort.js';
import { flag } from '../ports/featureFlagsPort.js';
import { createKalman1D } from '../math/kalman1d.js';
const { createMachine, createActor, assign } = XState;

export function createPalmClutch(config = {}) {
  if (!flag('FEATURE_GS_PALMCLUTCH', false)) {
    throw new Error('PalmClutch disabled: enable FEATURE_GS_PALMCLUTCH');
  }
  const labelOpen = config.labelOpen ?? 'Open_Palm';
  const minOpenScore = Number(config.minOpenScore ?? 0.6);
  const primeScore = Number(config.primeScore ?? 0.5);
  const confirmVel = Number(config.confirmVel ?? 0.15); // Z velocity magnitude to confirm fire
  const cooldownMs = Number(config.cooldownMs ?? 150);
  const kalman = createKalman1D({ q: config.q ?? 1e-2, r: config.r ?? 2e-2 });

  const machine = createMachine({
    id: config.id || 'palmClutch',
    context: {
      seat: null,
      zPx: 0, // pixel gap proxy for Z
      lastT: 0,
      vZ: 0,
      primed: false,
      stale: false
    },
    initial: 'search',
    states: {
      search: {
        on: {
          FRAME: [
            {
              target: 'seated',
              guard: ({ event }) => event?.label === labelOpen && (event.score ?? 0) >= minOpenScore,
              actions: assign(({ context, event }) => {
                kalman.reset(event.zPx ?? 0, 0);
                return {
                  ...context,
                  seat: event.seat ?? context.seat,
                  zPx: event.zPx ?? 0,
                  lastT: event.t ?? (typeof performance!=='undefined'?performance.now():Date.now()),
                  vZ: 0,
                  primed: false,
                  stale: false
                };
              })
            }
          ]
        }
      },
      seated: {
        on: {
          FRAME: [
            {
              target: 'search',
              guard: ({ event }) => event?.label !== labelOpen,
            },
            {
              actions: assign(({ context, event }) => {
                const t = event.t ?? (typeof performance!=='undefined'?performance.now():Date.now());
                const dt = Math.max(1, t - (context.lastT || t)) / 1000;
                const z = Number(event.zPx ?? context.zPx);
                const st = kalman.step(z, dt);
                const vZ = st.v;
                const primed = (event.gLabel && event.gLabel !== labelOpen && (event.gScore ?? 0) >= primeScore) || context.primed;
                return { ...context, zPx: z, lastT: t, vZ, primed };
              })
            }
          ],
          FIRE_CHECK: {
            target: 'cooldown',
            guard: ({ context }) => context.primed && Math.abs(context.vZ) >= confirmVel,
            actions: assign(({ context }) => ({ ...context, primed: false }))
          }
        }
      },
      cooldown: {
        after: { [cooldownMs]: 'seated' }
      }
    }
  });

  return createActor(machine);
}
