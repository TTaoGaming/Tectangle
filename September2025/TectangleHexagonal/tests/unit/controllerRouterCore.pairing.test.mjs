/*
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
 - [ ] Re-evaluate this artifact against current Hexagonal goals
 - [ ] Run this test with the latest September2025 build
 - [ ] Log decisions in TODO_2025-09-16.md
*/

import assert from 'assert';
import { createControllerRouter } from '../../src/app/controllerRouterCore.js';

describe('ControllerRouterCore pairing and reacquire (label-free)', ()=>{
  it('assigns first N pinch:down to seats in order when pairing active', ()=>{
    const r = createControllerRouter({ seats:['P1','P2','P3'], cfg:{ preferByHandLabel:false, pairing:{ enabled:true, seats:['P1','P2','P3'] } } });
    const A='id:A', B='id:B', C='id:C';
    const t0=0;
    // frames just to seed lastSeen/lastPos
    r.onFrame({ t:t0+10, handId:'A', wrist:[0.1,0.1] });
    r.onFrame({ t:t0+10, handId:'B', wrist:[0.8,0.1] });
    r.onFrame({ t:t0+10, handId:'C', wrist:[0.5,0.8] });
    const s1 = r.onPinchEvent({ type:'pinch:down', t:t0+20, handId:'A' });
    const s2 = r.onPinchEvent({ type:'pinch:down', t:t0+30, handId:'B' });
    const s3 = r.onPinchEvent({ type:'pinch:down', t:t0+40, handId:'C' });
    assert.strictEqual(s1, 'P1');
    assert.strictEqual(s2, 'P2');
    assert.strictEqual(s3, 'P3');
  });

  it('reacquires seat by proximity after loss without pinch', ()=>{
    const r = createControllerRouter({ seats:['P1','P2'], cfg:{ lostAfterMs: 100, reserveTtlMs: 5000, snapDist: 0.2, preferByHandLabel:false, pairing:{ enabled:true, seats:['P1','P2'] } } });
    const t0=0;
    // Assign A->P1, B->P2
    r.onFrame({ t:t0+10, handId:'A', wrist:[0.1,0.1] });
    r.onFrame({ t:t0+10, handId:'B', wrist:[0.8,0.1] });
    r.onPinchEvent({ type:'pinch:down', t:t0+20, handId:'A' });
    r.onPinchEvent({ type:'pinch:down', t:t0+30, handId:'B' });
    // Both disappear long enough to be marked lost/reserved
    r.onFrame({ t:t0+200, handId:'B', wrist:[0.8,0.1] }); // only B appears briefly
    r.onFrame({ t:t0+350, handId:'A', wrist:[0.11,0.09] }); // A comes back near its old spot
    // onFrame should snap A back to P1 without needing pinch
    const seat = r.getControllerForHand('id:A');
    assert.strictEqual(seat, 'P1');
  });
});
