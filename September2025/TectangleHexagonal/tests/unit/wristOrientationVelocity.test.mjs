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

import { createWristOrientationCore } from '../../src/core/wristOrientationCore.js';
import { strict as assert } from 'assert';

describe('wristOrientationCore velocity', () => {
  it('emits wrist:orientationVel with correct sign and magnitude (shortest path unwrap)', () => {
    const core = createWristOrientationCore({ emitUnchanged:true });
    const events = [];
    core.on(e=>events.push(e));
    // frame 1 angle 350
    core.update({ t:0, wrist:[0,0,0], indexMCP:[Math.cos(350*Math.PI/180), Math.sin(350*Math.PI/180),0] });
    // frame 2 angle 10 after 100ms (should be +20 deg over .1s => 200 deg/s, not -340)
    core.update({ t:100, wrist:[0,0,0], indexMCP:[Math.cos(10*Math.PI/180), Math.sin(10*Math.PI/180),0] });
    const velEvt = events.find(e=>e.type==='wrist:orientationVel');
    assert.ok(velEvt, 'velocity event emitted');
    assert.ok(Math.abs(velEvt.velDegPerSec - 200) < 5, 'velocity magnitude ~200 deg/s');
    assert.ok(velEvt.velDegPerSec>0, 'positive direction');
  });
});
