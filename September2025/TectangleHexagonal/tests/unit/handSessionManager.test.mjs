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

import { createHandSessionManager } from '../../src/app/handSessionManager.js';
import assert from 'assert';
import { createMinimalPinchCore } from './helpers/minimalPinchCore.js';

function makeFrame(t, hand, indexTipDist, cfg={}){
  // Create a synthetic frame where knuckle span ~0.2 so norm = dist/0.2
  const span = 0.2; // indexMCP(0,0) pinkyMCP(span,0)
  const half = indexTipDist/2;
  return {
    t,
    hand,
    indexTip:[0.5 + half, 0.5, 0],
    thumbTip:[0.5 - half, 0.5, 0],
    indexMCP:[0.4,0.6,0],
    pinkyMCP:[0.6,0.6,0],
    wrist:[0.5,0.7,0],
    handId: cfg.handId != null ? cfg.handId : null,
  };
}

describe('handSessionManager', () => {
  it('emits ordered pinch events for two hands', () => {
    const events = [];
  const hsm = createHandSessionManager({ pinch:{ enterThresh:0.5, exitThresh:0.7, palmGate:false }, createCore: createMinimalPinchCore });
    hsm.on(e=> events.push(e));
  // Right hand pinch cycle (ensure explicit exit cross with extra frame)
  hsm.onFrame(makeFrame(0,'Right', 0.11)); // norm .55 (no down)
  hsm.onFrame(makeFrame(10,'Right', 0.08)); // norm .40 -> down
  hsm.onFrame(makeFrame(40,'Right', 0.16)); // norm .80 -> up
  // Left hand pinch cycle
  hsm.onFrame(makeFrame(100,'Left', 0.08)); // down
  hsm.onFrame(makeFrame(140,'Left', 0.16)); // up

    const downs = events.filter(e=> e.type==='pinch:down');
    const ups = events.filter(e=> e.type==='pinch:up');
    assert.strictEqual(downs.length, 2, 'two downs');
    assert.strictEqual(ups.length, 2, 'two ups');
    assert.strictEqual(downs[0].hand, 'Right');
    assert.strictEqual(downs[1].hand, 'Left');
  });
});
