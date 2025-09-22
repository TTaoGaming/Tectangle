import { strict as assert } from 'node:assert';
import { createLandmarkSmoother } from '../../src/processing/landmark_smoother.js';

function hand(points){
  return points.map(([x,y,z=0])=>({x,y,z}));
}

describe('landmark_smoother keyed isolation', () => {
  it('keeps per-hand state separated by keys even if indices swap', () => {
    const sm = createLandmarkSmoother({ oneEuro: { minCutoff: 1.0, beta: 0.0, dCutoff: 1.0 } });
    const A0 = hand([[0.10,0.10,0],[0,0,0]]); // wrist at 0.10
    const B0 = hand([[0.80,0.80,0],[0,0,0]]); // wrist at 0.80
    // Frame 1: order [A,B], keys ['id:A','id:B']
    let out = sm.push({ t: 0, hands:[A0,B0], keys:['id:A','id:B'] });
    // Frame 2: swap order [B,A], keys ['id:B','id:A']
    const A1 = hand([[0.11,0.11,0],[0,0,0]]);
    const B1 = hand([[0.79,0.79,0],[0,0,0]]);
    out = sm.push({ t: 16, hands:[B1,A1], keys:['id:B','id:A'] });
    // Expect first hand in frame2 (B) has smoothed near ~0.79; second (A) near ~0.11
    const wristB = out[0][0];
    const wristA = out[1][0];
    assert.ok(Math.abs(wristB.x - 0.79) < 0.05, 'B wrist should be near its own trajectory');
    assert.ok(Math.abs(wristA.x - 0.11) < 0.05, 'A wrist should be near its own trajectory');
  });
});
