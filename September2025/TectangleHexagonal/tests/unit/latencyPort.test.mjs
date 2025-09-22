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
import { createLatencyPort } from '../../src/ports/latencyPort.js';

describe('LatencyPort', ()=>{
  it('computes median lag over window', ()=>{
    const lp = createLatencyPort({ windowSize: 5 });
    // lags: 10, 20, 30, 40, 50 -> median = 30
    [10,20,30,40,50].forEach((lag,i)=> lp.addSample(1000, 1000+lag));
    assert.strictEqual(lp.getLagMs(), 30);
  });
  it('applies user offset and returns effective schedule time', ()=>{
    const lp = createLatencyPort();
    lp.setUserOffsetMs(25);
    const now = 2000; const sched = lp.getEffectiveScheduleNow(now);
    assert.strictEqual(sched, now+25);
    assert.strictEqual(lp.getUserOffsetMs(), 25);
  });
});
