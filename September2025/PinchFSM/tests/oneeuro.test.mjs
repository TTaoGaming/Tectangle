import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { OneEuroFilter, OneEuroPresets } from '../src/filters/oneEuro.mjs';

describe('OneEuroFilter', () => {
  it('passes through constant signal', () => {
    const f = new OneEuroFilter(OneEuroPresets.Balanced);
    let t = 0;
    const vals = [];
    for (let i = 0; i < 10; i++) {
      t += 33; // ~30fps
      vals.push(f.filter(0.5, t));
    }
    // after init, it should remain close to 0.5
    assert.ok(Math.abs(vals.at(-1) - 0.5) < 1e-6);
  });

  it('handles ramp monotonically', () => {
    const f = new OneEuroFilter({ minCutoff: 1.0, beta: 0.0, dCutoff: 1.0 });
    let t = 0;
    let prev = -Infinity;
    for (let i = 0; i < 15; i++) {
      t += 33;
      const y = f.filter(i / 10, t);
      assert.ok(y >= prev - 1e-6);
      prev = y;
    }
  });
});
