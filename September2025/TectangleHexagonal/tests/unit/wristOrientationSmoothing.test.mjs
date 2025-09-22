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
import { createWristOrientationCore } from '../../src/core/wristOrientationCore.js';

function frame(angle, t){ const r=angle*Math.PI/180; return { t, wrist:[0,0,0], indexMCP:[Math.cos(r), Math.sin(r), 0], palmValid:true }; }

describe('wristOrientationCore smoothing', () => {
  it('smooth angle lags behind raw after jump', () => {
    const core = createWristOrientationCore({ smoothAlpha:0.2, emitUnchanged:true });
    let last=null; core.on(e=> last=e);
    core.update(frame(0,0));
    const first = last;
    core.update(frame(180,10)); // big jump
    const second = last;
    assert.ok(first && second, 'Expected events');
    // raw should equal 180; smooth should be between 0 and 180 (lagging)
    assert.strictEqual(second.angleDeg, 180);
    assert.ok(second.smoothAngleDeg > 0 && second.smoothAngleDeg < 180, 'Smooth angle should lag raw jump');
  });
});
