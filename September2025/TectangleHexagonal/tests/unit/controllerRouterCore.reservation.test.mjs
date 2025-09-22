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

import { strict as assert } from 'assert';
import { createControllerRouter } from '../../src/app/controllerRouterCore.js';

const F = (t, hand, handId, wrist) => ({ t, hand, handId, wrist: wrist||[0.5,0.6,0] });

describe('ControllerRouter reservations and snap-any', ()=>{
  it('reserves P1 for 60s and snaps next hand near it when only one reserved seat exists', ()=>{
    const r = createControllerRouter({ cfg:{ lostAfterMs:200, reserveTtlMs:60_000, snapDist:0.25, pairing:{ enabled:true, seats:['P1','P2'], strictConcurrent:true } } });
    // Two hands concurrent -> unlock P2
    r.onFrame(F(0,'A', 1, [0.2,0.7,0]));
    r.onFrame(F(0,'B', 2, [0.8,0.7,0]));
    // Pair P1 and P2
    assert.equal(r.onPinchEvent({ type:'pinch:down', t:10, hand:'A', handId:1 }), 'P1');
    assert.equal(r.onPinchEvent({ type:'pinch:down', t:11, hand:'B', handId:2 }), 'P2');
    // Lose A after 300ms -> reserve P1
    r.onFrame(F(350,'B', 2, [0.8,0.7,0]));
    const st1 = r.getState();
    const res1 = st1.reserved.find(r=> r.seat==='P1');
    assert.ok(res1, 'P1 should be reserved');
    // Now only P2 in view (one active of max 2)
    // A new hand appears near P1 reserved spot -> should snap to P1 without pinch
    r.onFrame(F(800,'C', 3, [res1.pos[0]+0.05, res1.pos[1]+0.05, 0]));
    const st2 = r.getState();
    const map2 = new Map(st2.map);
    assert.equal(map2.get('id:3'), 'P1');
  });
});
