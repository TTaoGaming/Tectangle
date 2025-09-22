/* WEBWAY:ww-2025-011 normalization detection test */
import assert from 'assert';
import { createOverlayOpsPort } from '../../src/ports/overlayOpsPort.js';

describe('overlayOpsPort normalization detection', ()=>{
  it('leaves 0..1 landmarks unchanged', ()=>{
    const hand = Array.from({length:21}, (_,i)=>[ Math.random(), Math.random(), 0 ]);
    globalThis.__hexLastHands = [ hand ];
    const port = createOverlayOpsPort({ getFrame:()=>({}), getSeats:()=>({}), getVideoDims:()=>({width:640,height:480}) });
    const sample = port.sample();
    assert.equal(sample.coordinateSpace, 'normalized');
    // Compare first few points expecting within small epsilon (no shift)
    const EPS = 1e-6;
    for(let i=0;i<5;i++){
      const orig = hand[i]; const op = sample.ops[i];
      assert(Math.abs(orig[0]-op.x) < EPS, `x unchanged for unit landmarks (${orig[0]} vs ${op.x})`);
      assert(Math.abs(orig[1]-op.y) < EPS, `y unchanged for unit landmarks (${orig[1]} vs ${op.y})`);
    }
  });
  it('converts -1..1 landmarks properly', ()=>{
    const hand = Array.from({length:21}, (_,i)=>[ (Math.random()*2-1), (Math.random()*2-1), 0 ]);
    globalThis.__hexLastHands = [ hand ];
    const port = createOverlayOpsPort({ getFrame:()=>({}), getSeats:()=>({}), getVideoDims:()=>({width:640,height:480}) });
    const sample = port.sample();
    for(let i=0;i<5;i++){
      const orig = hand[i]; const op = sample.ops[i];
      const expectX = orig[0]*0.5 + 0.5; const expectY = orig[1]*0.5 + 0.5;
      assert(Math.abs(expectX-op.x) < 1e-9, 'x converted from -1..1');
      assert(Math.abs(expectY-op.y) < 1e-9, 'y converted from -1..1');
    }
  });
});
