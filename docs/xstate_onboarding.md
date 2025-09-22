# XState v5 — Onboarding (GestureShell OS + Hive Orchestration)

Status: ready. Repo already includes xstate ^5.22.0 in package.json.

## Quick checks

- Verify import (browser/Node):
  - From Hex port (preferred): `import { XState } from '../September2025/TectangleHexagonal/src/ports/xstatePort.js'`
  - Or direct: `import { createMachine, createActor, assign } from 'xstate'`

## 1) Minimal machine

```js
import { XState } from '../September2025/TectangleHexagonal/src/ports/xstatePort.js';
const { createMachine, createActor } = XState;

const machine = createMachine({
  id: 'hello',
  initial: 'idle',
  states: {
    idle: { on: { GO: 'active' } },
    active: {}
  }
});

const actor = createActor(machine);
actor.start();
actor.send({ type: 'GO' });
```

## 2) Context, guards, actions

```js
import { XState } from '../September2025/TectangleHexagonal/src/ports/xstatePort.js';
const { createMachine, createActor, assign } = XState;

const gateMachine = createMachine({
  id: 'gate',
  context: { label: null, score: 0 },
  initial: 'idle',
  states: {
    idle: {
      on: {
        LABEL: {
          target: 'primed',
          guard: ({ event }) => event.label !== 'Open_Palm' && (event.score ?? 0) >= 0.45,
          actions: assign(({ context, event }) => ({ ...context, label: event.label, score: event.score }))
        }
      }
    },
    primed: {
      on: {
        LABEL: {
          target: 'idle',
          guard: ({ event }) => event.label === 'Open_Palm'
        }
      }
    }
  }
});
```

## 3) Timers (hold/cooldown) with `after`

```js
const holdMachine = createMachine({
  id: 'hold',
  initial: 'idle',
  states: {
    idle: { on: { DOWN: 'pressing' } },
    pressing: {
      after: { 150: 'held' }, // 150ms to become held
      on: { UP: 'idle' }
    },
    held: { on: { UP: 'cooldown' } },
    cooldown: { after: { 200: 'idle' } } // 200ms cooldown
  }
});
```

## 4) Parallel + actors (per-seat or per-specialist)

```js
const seatMachine = createMachine({ /* gate/hold/cooldown per seat */ });
const seats = {
  P1: createActor(seatMachine).start(),
  P2: createActor(seatMachine).start()
};

// feed per-seat events
seats.P1.send({ type: 'LABEL', label: 'Pinch', score: 0.9, t: performance.now() });
```

Parallel root:

```js
const root = createMachine({
  type: 'parallel',
  states: {
    seats: {},  // manages P1..Pn actors
    telemetry: {} // logs transitions
  }
});
```

## 5) Observability

```js
const a = createActor(gateMachine).start();
a.subscribe(snapshot => {
  if (snapshot.changed) {
    // snapshot.value = state; snapshot.context = data
    // emit to JSONL ring or console
  }
});
```

## Mapping to your stack

- GestureShell OS
  - SeatManager: spawns one gate/hold machine per seat (P1..P4).
  - GateFSM: Open → Pose → Open with hysteresis, `after` timers for hold/cooldown.
  - TouchSynth: separate machine translates gate states into DOWN/HOLD/DRAG/UP.
  - Telemetry: subscribe() each actor; log { t, seat, state, label, score }.

- Crew AI / Specialists
  - One actor per specialist; orchestrator machine routes intents/events.
  - Use `invoke`/`fromPromise` for LLM/tool calls; cancel on state exit.
  - Parallel states coordinate concurrent tools; guards select winning path.

- Land Graph (dataflow)
  - Treat each stage (detector → aligner → gate → touch) as an actor.
  - Use events as edges; keep side-effects in invoked services.

## Gotchas (v5)

- Start/stop: `createActor(machine).start()`; remember to stop for cleanup.
- Timers are per-actor; don’t block JS thread during long tasks — prefer `invoke`.
- Keep machines pure: compute in actions/guards, do side-effects in services.

## Next steps (repo)

- Fill `September2025/TectangleHexagonal/src/controllers/gateFsm.js` using patterns above.
- Add a minimal unit test to `September2025/TectangleHexagonal/tests/unit/` asserting IDLE → PRIMED → IDLE with timers.
- Wire under GestureShell OS only; keep older demos flag-free.
