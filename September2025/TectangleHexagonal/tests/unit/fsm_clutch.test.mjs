import assert from 'node:assert/strict';
import { createClutchFSM } from '../../src/overlay/fsm_clutch.mjs';

describe('Clutch FSM', ()=>{
  it('arms after sustained open and cools down on exit', ()=>{
    let t=0; const fsm=createClutchFSM({ enter:0.8, exit:0.6, armMinMs:100, cooldownMs:200, now:()=> t });
    // idle -> primed when open >= enter
    t=0; let s=fsm.step({ open:0.9 }); assert.equal(s.state,'primed');
    // before dwell, stays primed
    t=80; s=fsm.step({ open:0.9 }); assert.equal(s.state,'primed');
    // after dwell, armed
    t=120; s=fsm.step({ open:0.9 }); assert.equal(s.state,'armed');
    // drop below exit -> idle and cooldown kicks in
    t=140; s=fsm.step({ open:0.5 }); assert.equal(s.state,'idle');
    // within cooldown, cannot re-arm even if open high
    t=300; s=fsm.step({ open:0.95 }); assert.equal(s.state,'idle');
    // after cooldown, can re-prime
    t=350; s=fsm.step({ open:0.95 }); assert.equal(s.state,'primed');
  });
});
