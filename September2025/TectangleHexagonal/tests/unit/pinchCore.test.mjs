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
import { createPinchCore } from '../../src/core/pinchCore.js';

// Helper: build a frame with normalized gap set by placing indexTip at (0,0) and thumbTip at (norm,0).
// Use fixedKnuckleSpan=1 in core config so norm == euclidean distance.
function frame(t, norm, opts={}){
  const wrist = Object.prototype.hasOwnProperty.call(opts, 'wrist') ? opts.wrist : [0,0,0];
  const indexMCP = Object.prototype.hasOwnProperty.call(opts, 'indexMCP') ? opts.indexMCP : [1,0,0];
  const pinkyMCP = Object.prototype.hasOwnProperty.call(opts, 'pinkyMCP') ? opts.pinkyMCP : [0,1,0];
  const hand = Object.prototype.hasOwnProperty.call(opts, 'hand') ? opts.hand : null;
  return {
    t,
    indexTip: [0, 0, 0],
    thumbTip: [norm, 0, 0],
    hand,
    // Landmarks for palm gating
    wrist, indexMCP, pinkyMCP,
  };
}

describe('PinchCore (domain, deterministic)', ()=>{
  it('emits non-speculative down when crossing enter, and up after exit (no debounce)', ()=>{
    const core = createPinchCore({
      fixedKnuckleSpan: 1,
      palmGate: false,
      enableSpeculative: false,
      enterThresh: 0.5,
      exitThresh: 0.7,
      enterDebounceMs: 0,
      exitDebounceMs: 0,
      oneEuro: { minCutoff: 1e6, beta: 0, dCutoff: 1e6 }, // approximate passthrough
    });
    const events = [];
    const off = core.on(e=> events.push(e));
    // Decrease norm across enter
    [1.0, 0.8, 0.6, 0.49].forEach((n,i)=> core.update(frame(1000 + i*10, n, { wrist:[0,0,0], indexMCP:[0,1,0], pinkyMCP:[1,0,0] })));
    // Increase across exit
    [0.6, 0.7, 0.8].forEach((n,i)=> core.update(frame(1045 + i*10, n, { wrist:[0,0,0], indexMCP:[0,1,0], pinkyMCP:[1,0,0] })));
    off();
    const types = events.map(e=>e.type);
    assert.ok(types.includes('pinch:down'), 'expected pinch:down');
    assert.ok(types.includes('pinch:up'), 'expected pinch:up');
    const down = events.find(e=>e.type==='pinch:down');
    assert.strictEqual(!!down.speculative, false, 'down should be non-speculative');
  });

  it('palm gate blocks pinch:down when palm angle exceeds cone', ()=>{
    // With the landmark defaults in frame(), palm normal is +Z => angle ~ 180deg, so gate should fail for small cone
    const core = createPinchCore({ fixedKnuckleSpan:1, palmGate:true, palmConeDeg: 30, enableSpeculative:false, oneEuro:{minCutoff:1e6,beta:0,dCutoff:1e6}, enterThresh:0.5 });
    const events = [];
    core.on(e=> events.push(e));
    // Try to cross enter, but gate must block
    [1.0, 0.6, 0.49].forEach((n,i)=> core.update(frame(1000 + i*16, n, { hand:'Right' })));
    assert.strictEqual(events.find(e=> e.type==='pinch:down'), undefined, 'no down when gated');
  });

  it('speculative down confirms when crossing enter soon; cancels if not confirmed', ()=>{
    // allowSpec condition: gated + toiV in (-40..120)ms. We will bring norm down quickly to small values.
    const mkCore = ()=> createPinchCore({ fixedKnuckleSpan:1, palmGate:false, enableSpeculative:true, enterThresh:0.5, exitThresh:0.7, oneEuro:{minCutoff:1e6,beta:0,dCutoff:1e6} });

    // Confirm path
    let core = mkCore();
    const ev1=[]; core.on(e=>ev1.push(e));
    const gated = { wrist:[0,0,0], indexMCP:[0,1,0], pinkyMCP:[1,0,0] };
    core.update(frame(1000, 0.60, gated)); // approaching
    core.update(frame(1010, 0.55, gated));
    // Jump across enter with higher velocity so toiV < 120ms -> triggers speculative down
    core.update(frame(1020, 0.46, gated)); // crossing enter here (enter=0.5)
    // Next frame stays below enter -> confirm
    core.update(frame(1030, 0.44, gated));
    assert.ok(ev1.some(e=> e.type==='pinch:down' && e.speculative===true), 'speculative down emitted');
    assert.ok(ev1.some(e=> e.type==='pinch:confirm'), 'confirm emitted after crossing enter');

    // Cancel path (never crosses, time passes)
    core = mkCore();
    const ev2=[]; core.on(e=>ev2.push(e));
    core.update(frame(2000, 0.60, gated));
    core.update(frame(2010, 0.55, gated));
    core.update(frame(2020, 0.46, gated)); // speculative down at crossing
    // Drift away (no crossing within ~120ms window)
    core.update(frame(2145, 0.53)); // ~125ms later, above enter
    core.update(frame(2245, 0.56));
    assert.ok(ev2.some(e=> e.type==='pinch:down' && e.speculative===true), 'speculative down emitted');
    assert.ok(ev2.some(e=> e.type==='pinch:cancel'), 'cancel emitted when not confirmed');
  });

  it('emits toiActualStop when approach velocity crosses zero', ()=>{
    const core = createPinchCore({ fixedKnuckleSpan:1, palmGate:false, enableSpeculative:false, oneEuro:{minCutoff:1e6,beta:0,dCutoff:1e6}, enterThresh:0.5 });
    const events=[]; core.on(e=>events.push(e));
    // Approach (norm decreasing), then pull away (increasing) -> v crosses 0 once.
    core.update(frame(3000, 0.90));
    core.update(frame(3010, 0.70));
    core.update(frame(3020, 0.60)); // still approaching
    core.update(frame(3030, 0.61)); // reversed -> should trigger toiActualStop
    const stop = events.find(e=> e.type==='pinch:toiActualStop');
    assert.ok(stop, 'toiActualStop event emitted');
    // Returned state includes approachStopTimeMs
    const s = core.update(frame(3040, 0.62));
    assert.ok(Number.isInteger(s.approachStopTimeMs) || s.approachStopTimeMs===null, 'approachStopTimeMs is exposed');
  });

  it('no down when gap never crosses enter (motion only)', ()=>{
    const core = createPinchCore({ fixedKnuckleSpan:1, palmGate:false, enableSpeculative:false, enterThresh:0.4, oneEuro:{minCutoff:1e6,beta:0,dCutoff:1e6} });
    const events=[]; core.on(e=>events.push(e));
    [0.9,0.85,0.82,0.81,0.8,0.79,0.78].forEach((n,i)=> core.update(frame(4000 + i*15, n)));
    assert.strictEqual(events.find(e=> e.type==='pinch:down'), undefined, 'should not fire down');
  });
});
