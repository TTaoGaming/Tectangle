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

// TEMP-SKIP: Quarantined due to syntax error under mocha ESM run; will reinstate after hex test stabilization.
import { strict as assert } from "assert";
import { createLookAheadCore } from "../../src/core/lookAheadCore.js";

describe('lookAheadCore', () => {
  function frame(t, gap){
    return {
      t,
      indexTip: [0, 0, 0],
      thumbTip: [gap, 0, 0]
    };
  }

  it('projects constant velocity gap closing into the future', () => {
    const core = createLookAheadCore({
      leadMs: 150,
      oneEuro: { minCutoff: 1000, beta: 0, dCutoff: 1000 },
      maxAbsAcceleration: 1e6
    });

    let result;
    const gaps = [0.040, 0.037, 0.034, 0.031, 0.028];
    gaps.forEach((gap, idx) => {
      result = core.update(frame(idx * 10, gap));
    });

    assert.ok(result.ok, 'result should be ok');
    assert.ok(result.gap.now > result.gap.predicted, 'predicted gap should be smaller than current gap');
    assert.ok(result.toi.velocityMs > 0 && result.toi.velocityMs < 300, 'velocity TOI in ms should be finite');
    assert.equal(result.toi.leadSatisfied, true, 'lead window should be sufficient for predictive trigger');
  });

  it('tracks acceleration and adjusts prediction accordingly', () => {
    const core = createLookAheadCore({
      leadMs: 120,
      oneEuro: { minCutoff: 1000, beta: 0, dCutoff: 1000 },
      accelAlpha: 0.5,
      maxAbsAcceleration: 1e5
    });

    const gaps = [0.050, 0.047, 0.041, 0.032, 0.020]; // accelerating closure
    let res = null;
    gaps.forEach((gap, idx) => {
      res = core.update(frame(idx * 12, gap));
    });

    assert.ok(res.ok, 'result should be ok');
    assert.ok(res.acceleration.along < 0, 'relative acceleration should indicate increasing closure speed');
    assert.ok(res.gap.predicted < res.gap.now, 'predicted gap should anticipate pinch');
    assert.ok(res.toi.accelMs <= res.toi.velocityMs, 'accel-based TOI should be at least as fast as velocity-only');
  });

  it('reports infinity when hands move apart', () => {
    const core = createLookAheadCore({
      leadMs: 100,
      oneEuro: { minCutoff: 1000, beta: 0, dCutoff: 1000 }
    });

    let last;
    [0.030, 0.034, 0.039, 0.045].forEach((gap, idx) => {
      last = core.update(frame(idx * 15, gap));
    });

    assert.ok(last.ok);
    assert(Number.isFinite(last.gap.now));
    assert.strictEqual(last.toi.velocityMs, Infinity);
    assert.strictEqual(last.toi.accelMs, Infinity);
    assert.equal(last.toi.leadSatisfied, false);
  });
});
