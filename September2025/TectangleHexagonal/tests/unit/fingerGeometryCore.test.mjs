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

import { createFingerGeometryCore } from '../../src/core/fingerGeometryCore.js';
import { strict as assert } from 'assert';

describe('fingerGeometryCore', () => {
  it('computes increasing flexion when tip curls toward wrist', () => {
    const core = createFingerGeometryCore();
    const events = [];
    core.on(e=>events.push(e));
    // Baseline nearly straight
    core.update({ t:0,
      wrist:[0,0,0],
      indexMCP:[1,0,0],
      indexPIP:[2,0,0],
      indexDIP:[3,0,0],
      indexTip:[4,0,0]
    });
    // Curl: move tip downward (in -y), bending at PIP and DIP
    core.update({ t:16,
      wrist:[0,0,0],
      indexMCP:[1,0,0],
      indexPIP:[2,0,0],
      indexDIP:[3,-0.5,0],
      indexTip:[3.5,-1,0]
    });
    const first = events[0];
    const second = events[1];
    assert.ok(first && second, 'two angle events');
    // Expect some DIP flexion increase
  // Expect DIP flexion angle to decrease if finger curls downward (vector geometry) but PIP flexion increases.
  // Safer check: total curvature sum grows.
  const firstFlex = (first.pipDeg||0)+(first.dipDeg||0);
  const secondFlex = (second.pipDeg||0)+(second.dipDeg||0);
  assert.ok(secondFlex > firstFlex, 'flexion increased after curl');
  });
});
