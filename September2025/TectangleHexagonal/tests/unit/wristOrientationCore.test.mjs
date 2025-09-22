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

function frameAt(angleDeg, t=0){
  const rad = angleDeg * Math.PI/180;
  const wrist = [0,0,0];
  const indexMCP = [Math.cos(rad), Math.sin(rad), 0];
  return { t, wrist, indexMCP, palmValid: true };
}

describe('wristOrientationCore', () => {
  it('emits bucket changes for UP RIGHT DOWN LEFT', () => {
    const core = createWristOrientationCore();
    const events = [];
    core.on(e=>events.push(e));
    core.update(frameAt(0,0));    // UP
    core.update(frameAt(10,10));  // still UP suppressed
    core.update(frameAt(90,20));  // RIGHT
    core.update(frameAt(200,30)); // DOWN
    core.update(frameAt(270,40)); // LEFT
    assert.ok(events.length >= 4, 'Expected at least 4 bucket change events');
  const buckets = events.filter(e=>e.type==='wrist:orientation').map(e=>e.bucket);
  assert.deepStrictEqual(buckets, ['UP','RIGHT','DOWN','LEFT']);
  const oEvents = events.filter(e=>e.type==='wrist:orientation');
  assert.strictEqual(oEvents[0].flags.up, true);
  assert.strictEqual(oEvents[1].flags.right, true);
  assert.strictEqual(oEvents[2].flags.down, true);
  assert.strictEqual(oEvents[3].flags.left, true);
  });

  it('respects palm gate (no events when palmValid=false)', () => {
    const core = createWristOrientationCore();
    const events = [];
    core.on(e=>events.push(e));
  core.update({ t:0, wrist:[0,0,0], indexMCP:[1,0,0], palmValid:false });
    assert.strictEqual(events.length, 0);
  });
});
