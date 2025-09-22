import { strict as assert } from 'assert';
import { describe, it } from 'node:test';
import { PinchFSM } from '../src/fsm/pinchFsm.mjs';

function step(fsm, t, P, gated) { return fsm.update(t, P, gated); }

describe('PinchFSM', () => {
  it('debounces before Pinch and emits keyDown once', () => {
    const fsm = new PinchFSM({ tEnter: 0.2, tExit: 0.3, debounceMs: 50, anchorHoldMs: 200 });
    let t = 0;
    let r = step(fsm, t, 0.19, true); // Possible
    assert.equal(r.state, 'Possible'); assert.equal(r.keyDown, false);
    t += 40; r = step(fsm, t, 0.19, true); // still Possible (not enough debounce)
    assert.equal(r.state, 'Possible'); assert.equal(r.keyDown, false);
    t += 20; r = step(fsm, t, 0.19, true); // crosses debounce → Pinch + keyDown
    assert.equal(r.state, 'Pinch'); assert.equal(r.keyDown, true);
    t += 10; r = step(fsm, t, 0.19, true); // remain Pinch, no extra keyDown
    assert.equal(r.keyDown, false);
  });

  it('exits to Open and emits keyUp when P > tExit', () => {
    const fsm = new PinchFSM({ tEnter: 0.2, tExit: 0.3, debounceMs: 0, anchorHoldMs: 1000 });
    let t = 0;
    let r = step(fsm, t, 0.19, true); // Possible immediately (debounce=0)
    t += 1; r = step(fsm, t, 0.19, true); // Pinch
    assert.equal(r.state, 'Pinch'); assert.equal(r.keyDown, true);
    t += 1; r = step(fsm, t, 0.31, true); // Exit
    assert.equal(r.state, 'Open'); assert.equal(r.keyUp, true);
  });

  it('anchorHold transitions to Anchored after hold', () => {
    const fsm = new PinchFSM({ tEnter: 0.2, tExit: 0.3, debounceMs: 0, anchorHoldMs: 100 });
    let t = 0;
    step(fsm, t, 0.19, true); // Possible
    t += 1; step(fsm, t, 0.19, true); // Pinch
    t += 110; const r = step(fsm, t, 0.19, true); // Anchored
    assert.equal(r.state, 'Anchored');
  });

  it('palm gate false prevents entry and forces exit', () => {
    const fsm = new PinchFSM({ tEnter: 0.2, tExit: 0.3, debounceMs: 0, anchorHoldMs: 100 });
    let t = 0;
    let r = step(fsm, t, 0.19, false); // gate off
    assert.equal(r.state, 'Open');
    r = step(fsm, t, 0.19, true); // Possible
    t += 1; r = step(fsm, t, 0.19, true); // Pinch
    assert.equal(r.state, 'Pinch');
    t += 1; r = step(fsm, t, 0.19, false); // gate off forces Open
    assert.equal(r.state, 'Open'); assert.equal(r.keyUp, true);
  });
});
