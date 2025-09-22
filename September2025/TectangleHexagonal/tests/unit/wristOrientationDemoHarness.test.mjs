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

// This test exercises multi-event sequence resembling two hands switching orientation buckets.
// It validates that per-hand cores (simulated) produce independent streams.

function simulate(core, seq){
  const out=[]; core.on(e=>out.push(e));
  for(const f of seq){ core.update(f); }
  return out;
}

function frame(angle, t){ const r=angle*Math.PI/180; return { t, wrist:[0,0,0], indexMCP:[Math.cos(r), Math.sin(r), 0], palmValid:true }; }

describe('wristOrientationDemoHarness (logical)', () => {
  it('independent streams produce proper bucket order', () => {
    const coreA = createWristOrientationCore();
    const coreB = createWristOrientationCore();
    const aSeq = [frame(0,0), frame(100,10), frame(190,20), frame(280,30)];
    const bSeq = [frame(10,0), frame(80,10), frame(170,20), frame(260,30)];
    const aOut = simulate(coreA, aSeq);
    const bOut = simulate(coreB, bSeq);
  const aBuckets = aOut.filter(e=>e.type==='wrist:orientation').map(e=>e.bucket);
  const bBuckets = bOut.filter(e=>e.type==='wrist:orientation').map(e=>e.bucket);
  assert.deepStrictEqual(aBuckets, ['UP','RIGHT','DOWN','LEFT']);
  assert.deepStrictEqual(bBuckets, ['UP','RIGHT','DOWN','LEFT']);
  });
});
