// WEBWAY:ww-2025-098 — xstate per-seat gesture FSM (guarded)
// Minimal stub to validate wiring; no behavior change unless enabled.
// Contract:
// - createSeatGestureMachine({ seatName, onTransition }) returns { start(), stop(), send(event) }
// - Events: { type: 'label', label: string|null, score?: number, t?: number }
// - States: idle -> active -> idle (enter on non-Open_Palm label when score>min; exit on Open_Palm)

import { createMachine, fromPromise, interpret } from 'xstate';

export function createSeatGestureMachine({ seatName = 'P1', labelIdle = 'Open_Palm', minScore = 0.45, onTransition } = {}){
  const machine = createMachine({
    id: `seat-${seatName}`,
    context: { lastLabel: null, lastScore: 0 },
    initial: 'idle',
    states: {
      idle: {
        on: {
          label: [{
            guard: ({ event }) => !!event && event.label && event.label !== labelIdle && (event.score == null || event.score >= minScore),
            target: 'active'
          }, { actions: ['store'] }]
        }
      },
      active: {
        on: {
          label: [{
            guard: ({ event }) => !event || !event.label || event.label === labelIdle,
            target: 'idle'
          }, { actions: ['store'] }]
        }
      }
    }
  }, {
    actions: {
      store: ({ context, event }) => {
        if(!event) return; context.lastLabel = event.label || null; context.lastScore = Number(event.score||0);
      }
    }
  });

  const service = interpret(machine);
  if(typeof onTransition === 'function') service.onTransition((s)=> onTransition({ seat: seatName, state: s.value, ctx: s.context }));
  return {
    start(){ service.start(); return this; },
    stop(){ try{ service.stop(); } catch{} },
    send(ev){ service.send(ev); }
  };
}
