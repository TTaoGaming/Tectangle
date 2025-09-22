import assert from 'assert';
import { createOverlayOpsPort } from '../../src/ports/overlayOpsPort.js';

// WEBWAY:ww-2025-010 pixel -> normalized verification

describe('overlayOpsPort pixel normalization (WEBWAY:ww-2025-010)', () => {
  it('normalizes pixel landmarks using injected video dims', () => {
    // Simulate a 1280x720 frame with a simple diagonal hand
    const vw=1280, vh=720;
    const hand = Array.from({length:21}, (_,i)=> [ (i/20)*vw, (i/20)*vh, 0 ] );
    globalThis.__hexLastHands = [ hand ];
    const port = createOverlayOpsPort({
      getFrame:()=>({ landmarks: hand }),
      getSeats:()=>({}),
      getVideoDims: ()=>({ width: vw, height: vh })
    });
    const sample = port.sample();
    assert.equal(sample.coordinateSpace, 'normalized');
    const xs = sample.ops.map(o=>o.x);
    const ys = sample.ops.map(o=>o.y);
    // Expect first near 0, last near 1 after normalization
    assert(xs[0] < 0.05 && ys[0] < 0.05, 'first point not near origin');
    assert(xs[xs.length-1] > 0.95 && ys[ys.length-1] > 0.95, 'last point not near 1');
  });
});
