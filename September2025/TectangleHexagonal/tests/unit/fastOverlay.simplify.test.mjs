import assert from 'assert';
import { createFastOverlay } from '../../src/ui/fastOverlay.js';
import { createOverlayOpsPort } from '../../src/ports/overlayOpsPort.js';

// WEBWAY:ww-2025-009 guard test ensuring normalized path when flag enabled

describe('fastOverlay simplify (WEBWAY:ww-2025-009)', () => {
  function mockFrameFrom(hand){
    return { landmarks: hand };
  }
  const rightHand21 = Array.from({length:21}, (_,i)=>[i/21, i/21, 0]); // already 0..1 normalized

  it('emits normalized coordinates when FEATURE_FAST_OVERLAY_SIMPLIFY enabled', () => {
    globalThis.__flags = Object.assign({}, globalThis.__flags||{}, { FEATURE_FAST_OVERLAY_SIMPLIFY:true });
    globalThis.__hexLastHands = [ rightHand21 ];
    const port = createOverlayOpsPort({ getFrame:()=>mockFrameFrom(rightHand21), getSeats:()=>({}) });
    const sample = port.sample();
    assert.equal(sample.coordinateSpace, 'normalized');
    assert.ok(sample.ops.length>=21, 'expected at least 21 ops');
    // All coordinates should be within [0,1]
    for(const o of sample.ops){
      assert(o.x>=0 && o.x<=1, 'x not normalized');
      assert(o.y>=0 && o.y<=1, 'y not normalized');
    }
  });

  it('legacy path expectation updated: coordinateSpace stays normalized after overlay redo', () => {
    globalThis.__flags = Object.assign({}, globalThis.__flags||{}, { FEATURE_FAST_OVERLAY_SIMPLIFY:false });
    globalThis.__hexLastHands = [ rightHand21 ];
    const port = createOverlayOpsPort({ getFrame:()=>mockFrameFrom(rightHand21), getSeats:()=>({}) });
    const sample = port.sample();
    assert.equal(sample.coordinateSpace, 'normalized');
  });
});
