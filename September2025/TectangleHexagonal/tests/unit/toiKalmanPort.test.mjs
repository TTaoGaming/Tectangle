/*
STIGMERGY REVIEW HEADER
Status: New
Review started: 2025-09-18T00:00-06:00
Expires: 2025-09-25T00:00-06:00 (auto-expire after 7 days)
*/

import assert from 'assert';
import { createToiKalmanCV } from '../../src/ports/toiKalmanPort.js';

describe('ToiKalmanCV', ()=>{
  it('predicts TOI for a clean monotonic approach', ()=>{
    // More responsive Kalman to adapt quickly to linear motion
    const toi = createToiKalmanCV({ q:1e-2, r:1e-4 });
    // Simulate norm descending linearly from 0.9 to 0.5 over 200ms, thresh=0.7.
    // Frame times at 50ms steps.
    const t0 = 1000; const enter = 0.7; const samples = [
      {t:t0+0,   n:0.90},
      {t:t0+50,  n:0.80},
      {t:t0+100, n:0.70},
      {t:t0+150, n:0.60},
    ];
    let pred = null;
    for(const s of samples){ const r = toi.step({ t:s.t, norm:s.n, enterThresh:enter }); pred = r.toiPredAbsK ?? pred; }
    // Expected crossing is at 100ms from t0.
  assert.ok(pred !== null, 'should predict a TOI');
  assert.ok(Math.abs(pred - (t0+100)) <= 40, `pred within 40ms: got ${pred}`);
  });

  it('yields null when moving away or insufficient info', ()=>{
    const toi = createToiKalmanCV({ q:5e-4, r:5e-3 });
    const t0=1000; const enter=0.7;
    // Increasing norm (moving away)
    const r1 = toi.step({ t:t0+0, norm:0.60, enterThresh:enter });
    const r2 = toi.step({ t:t0+40, norm:0.62, enterThresh:enter });
    assert.strictEqual(r1.toiPredAbsK, null);
    assert.strictEqual(r2.toiPredAbsK, null);
  });

  it('reset clears internal state', ()=>{
    const toi = createToiKalmanCV({ q:5e-4, r:5e-3 });
    const t0=1000; const enter=0.7;
    toi.step({ t:t0+0, norm:0.90, enterThresh:enter });
    toi.reset();
    const r = toi.step({ t:t0+10, norm:0.90, enterThresh:enter });
    assert.ok(r.x >= 0.80 && r.x <= 1.0, 'state reinitialized near measurement');
  });
});
