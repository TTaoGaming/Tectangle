import { createFingerGeometryCore } from '../../src/core/fingerGeometryCore.js';
import assert from 'node:assert';

// WEBWAY:ww-2025-012 TDD: thumb angles event behind option

describe('fingerGeometryCore thumb angles (FEATURE_FINGER_GEOM_THUMB)', () => {
  it('emits thumb angle event when enabled', () => {
    const core = createFingerGeometryCore({ enableThumbAngles:true });
    const events = [];
    core.on(e=> events.push(e));
    // Straight thumb along +X axis (expect near 0 flex)
    core.update({
      t: 1,
      wrist: [0,0,0],
      thumbCMC: [1,0,0],
      thumbMCP: [2,0,0],
      thumbIP:  [3,0,0],
      thumbTip: [4,0,0],
      // index landmarks (required for existing index emission)
      indexMCP:[0,1,0], indexPIP:[0,2,0], indexDIP:[0,3,0], indexTip:[0,4,0]
    });
    const thumbEv = events.find(e=> e.type==='finger:thumb:angles');
  assert(thumbEv, 'thumb angles event missing');
  assert(Math.abs(thumbEv.cmcDeg) < 1, 'cmcDeg not ~0');
  assert(Math.abs(thumbEv.mcpDeg) < 1, 'mcpDeg not ~0');
  assert(Math.abs(thumbEv.ipDeg) < 1, 'ipDeg not ~0');
  });

  it('bent thumb produces positive flexion degrees', () => {
    const core = createFingerGeometryCore({ enableThumbAngles:true });
    let thumbEv;
    core.on(e=> { if(e.type==='finger:thumb:angles') thumbEv = e; });
    // Bend at MCP and IP by moving IP/Tip downward
    core.update({
      t: 2,
      wrist: [0,0,0],
      thumbCMC: [0,0,0],
      thumbMCP: [1,0,0],
      thumbIP:  [2,0.5,0],
      thumbTip: [3,1,0],
      indexMCP:[0,1,0], indexPIP:[0,2,0], indexDIP:[0,3,0], indexTip:[0,4,0]
    });
  assert(thumbEv, 'thumb angles event missing');
  assert(thumbEv.mcpDeg > 0, 'mcpDeg should be > 0 when bent');
  assert(thumbEv.ipDeg > 0, 'ipDeg should be > 0 when bent');
  });
});
