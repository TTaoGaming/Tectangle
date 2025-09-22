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

describe('ControllerRouterCore', () => {
  it('assigns P1 then P2 on successive pinch:down (Right then Left)', () => {
    const r = createControllerRouter({ seats:['P1','P2'], enabled:true, cfg:{ pairing:{ strictConcurrent:true }, lostAfterMs:500 } });
    const downR = { type:'pinch:down', hand:'Right', handId:'R1', t:1000 };
    const s1 = r.onPinchEvent(downR);
    // Ensure both hands are concurrently observed before second pinch
    r.onFrame({ t:1200, hand:'Right', handId:'R1', wrist:[0.2,0.6,0] });
    r.onFrame({ t:1210, hand:'Left', handId:'L1', wrist:[0.8,0.6,0] });
    r.onFrame({ t:1220, hand:'Right', handId:'R1', wrist:[0.2,0.6,0] });
    const downL = { type:'pinch:down', hand:'Left', handId:'L1', t:1500 };
    const s2 = r.onPinchEvent(downL);
    assert.strictEqual(s1, 'P1');
    assert.strictEqual(s2, 'P2');
    const st = r.getState();
    const map = new Map(st.map);
    assert.strictEqual(map.get('id:R1'), 'P1');
    assert.strictEqual(map.get('id:L1'), 'P2');
  });

  it('reacquires by proximity without pinch after loss', () => {
    const r = createControllerRouter({ seats:['P1','P2'], enabled:true, cfg:{ lostAfterMs:200, reserveTtlMs:2000, snapDist:0.2 } });
    // Assign P1 to R1
    r.onPinchEvent({ type:'pinch:down', hand:'Right', handId:'R1', t:0 });
    // Frames for R1 at position (0.2, 0.5)
    r.onFrame({ t:100, hand:'Right', handId:'R1', wrist:[0.2,0.5,0] });
    r.onFrame({ t:250, hand:'Right', handId:'R1', wrist:[0.2,0.5,0] });
    // Simulate loss beyond lostAfterMs
    r.onFrame({ t:450, hand:'Left', handId:'L1', wrist:[0.8,0.5,0] });
    // Now L1 moves near R1's last position within snapDist
    r.onFrame({ t:600, hand:'Left', handId:'L1', wrist:[0.21,0.49,0] });
    const seat = r.getControllerForHand('id:L1');
    assert.strictEqual(seat, 'P1');
  });
});
