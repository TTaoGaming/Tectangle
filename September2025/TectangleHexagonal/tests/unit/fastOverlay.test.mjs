/**
 * Failing test scaffold for a new ultra-light overlay pipeline (fastOverlay).
 * Red design: produce a list of primitive draw ops (no direct canvas mutation) so
 * rendering can be swapped (2D canvas, WebGL, offscreen, recording) without changing logic.
 *
 * Contract (expected from module to be implemented):
 *   createFastOverlay({ getFrame, getSeats }) => { computeOps(), drawTo(ctx, ops) }
 *     - computeOps() returns array of ops: { kind:'dot', x, y, r, color } only (for now)
 *     - Skips work if no frame or no landmarks
 *     - Accepts both normalized [x,y,z] in -1..1 or pixel coords (>=0..videoWidth)
 *
 * This test intentionally FAILS now (module missing) to drive v6 implementation.
 */

import assert from 'assert';

let overlayModErr = null;
let createFastOverlay;
try {
  ({ createFastOverlay } = await import('../../src/ui/fastOverlay.js'));
} catch (e) {
  overlayModErr = e;
}

describe('fastOverlay (expected to fail initially)', () => {
  it('module should load', () => {
    // Force failure until implemented
    assert.ok(createFastOverlay, 'createFastOverlay not implemented yet');
  });

  it('computeOps returns dot ops for a single hand (normalized)', () => {
    if(!createFastOverlay) return assert.fail('createFastOverlay missing');
    const fakeHand = Array.from({length:21}, (_,i)=> [ (i/20)-0.5, (i/20)-0.5, 0 ] );
    const frame = { landmarks: fakeHand };
    const fo = createFastOverlay({ getFrame: ()=>frame, getSeats: ()=>({ P1:'H1', P2:null }) });
    const ops = fo.computeOps();
    assert.ok(Array.isArray(ops), 'ops should be array');
    assert.ok(ops.length>=21, 'should have at least 21 dot ops');
    const first = ops[0];
    assert.equal(first.kind, 'dot');
    assert.ok('x' in first && 'y' in first && 'r' in first && 'color' in first, 'dot op missing fields');
  });
});
