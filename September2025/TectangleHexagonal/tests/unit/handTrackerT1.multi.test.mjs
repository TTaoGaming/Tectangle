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
import { createHandTrackerT1 } from '../../src/ports/handTrackerT1.js';

describe('handTrackerT1 multi-hand capacity', () => {
  function makeLandmarks(x, y){
    const lm = [];
    for(let i=0;i<21;i++){
      lm.push([x + i*0.001, y + i*0.001, 0]);
    }
    return lm;
  }

  it('tracks four simultaneous detections with unique ids and seats', () => {
    const tracker = createHandTrackerT1({ maxTracks: 4, seats: ['P1','P2','P3','P4'] });
    const dets = [
      { rawLabel:'Left', wrist:[0.10,0.20,0], landmarks:makeLandmarks(0.10,0.20) },
      { rawLabel:'Right', wrist:[0.70,0.20,0], landmarks:makeLandmarks(0.70,0.20) },
      { rawLabel:'Left', wrist:[0.15,0.70,0], landmarks:makeLandmarks(0.15,0.70) },
      { rawLabel:'Right', wrist:[0.75,0.70,0], landmarks:makeLandmarks(0.75,0.70) }
    ];
    const res = tracker.assign(dets, 0);
    const ids = res.map(a => a && a.handId).filter(Boolean);
    const seats = res.map(a => a && a.controllerId).filter(Boolean);
    assert.equal(ids.length, 4, 'expected four tracked handIds');
    assert.equal(new Set(ids).size, 4, 'expected unique handIds');
    assert.equal(new Set(seats).size, 4, 'expected unique seats');
  });
});
