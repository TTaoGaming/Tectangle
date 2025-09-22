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
import { interpolateEnter, toiPredictorVelocity, toiPredictorAccel } from '../../src/ports/toiPort.js';

describe('TOIPort predictors', ()=>{
  it('interpolates enter crossing between samples', ()=>{
    const t = interpolateEnter(1000, 0.9, 1060, 0.5, 0.7); // linear 0.9->0.5 in 60ms crosses 0.7 halfway
    assert.strictEqual(t, 1030);
  });
  it('predicts absolute enter time with velocity', ()=>{
    const { toiPredAbsV } = toiPredictorVelocity({ t:1000, norm:0.9, vRel:-1.0, enterThresh:0.7 }); // s=0.2, v=1 per s
    assert.strictEqual(Math.round(toiPredAbsV), 1200);
  });
  it('predicts absolute enter time with acceleration when viable', ()=>{
    const { toiPredAbsA } = toiPredictorAccel({ t:1000, norm:0.9, vRel:-0.5, aRel:-1.0, enterThresh:0.7 });
    assert.ok(toiPredAbsA===null || (toiPredAbsA>=1000 && toiPredAbsA<2000));
  });
});
