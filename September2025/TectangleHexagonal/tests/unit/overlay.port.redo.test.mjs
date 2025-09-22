import assert from 'assert';
import { createOverlayOpsPort } from '../../src/ports/overlayOpsPort.js';

// WEBWAY:ww-2025-010 guard test

describe('overlayOpsPort redo (WEBWAY:ww-2025-010)', () => {
  function makeHand(){
    return Array.from({length:21}, (_,i)=> [ (i/20)-0.5, (i/20)-0.5, 0 ] ); // -0.5..0.5 normalized subset
  }
  it('emits normalized ops in 0..1 space', () => {
    globalThis.__hexLastHands = [ makeHand() ];
    const port = createOverlayOpsPort({ getFrame:()=>({ landmarks: makeHand() }), getSeats:()=>({ P1:'H1' }) });
    const s = port.sample();
    assert.equal(s.coordinateSpace, 'normalized');
    assert.ok(s.ops.length >= 21, 'expected >=21 ops');
    for(const o of s.ops){
      assert(o.x>=0 && o.x<=1, 'x out of range');
      assert(o.y>=0 && o.y<=1, 'y out of range');
    }
  });
});
