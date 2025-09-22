import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ControllerTracker } from '../src/identity/controllerTracker.mjs';

function hand(handed, x) {
  return {
    handedness: [{ categoryName: handed, score: 0.99 }],
    landmarks: [{ x, y: 0.5, z: 0 }],
  };
}

describe('ControllerTracker', () => {
  it('maintains IDs when hand order swaps', () => {
    const tr = new ControllerTracker({ swapThreshold: 0.5 });
    const t0 = 0, t1 = 33, t2 = 66;
    const a0 = tr.assign([hand('Left', 0.2), hand('Right', 0.8)], t0);
    assert.equal(a0[0].id, 'L0');
    assert.equal(a0[1].id, 'R0');
    // swap order but same positions
    const a1 = tr.assign([hand('Right', 0.8), hand('Left', 0.2)], t1);
    assert.equal(a1[0].id, 'R0');
    assert.equal(a1[1].id, 'L0');
    // slight move still within threshold
    const a2 = tr.assign([hand('Right', 0.78), hand('Left', 0.22)], t2);
    assert.equal(a2[0].id, 'R0');
    assert.equal(a2[1].id, 'L0');
  });
});
