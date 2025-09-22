// WEBWAY:ww-2025-008: unit guard for Hand Console ViewModel
import assert from 'assert';
import { createHandConsoleViewModel } from '../../src/ui/createHandConsoleViewModel.js';

describe('handConsoleViewModel (WEBWAY:ww-2025-008)', () => {
  before(() => { globalThis.__flags = Object.assign({}, globalThis.__flags||{}, { FEATURE_HAND_CONSOLE_VM:true }); });

  it('aggregates pinch + orientation + flex + vel and exposes snapshot shape', () => {
    const vm = createHandConsoleViewModel();
    assert(vm, 'expected vm when flag enabled');
    const events = [
      { type:'pinch:down', t:1, handKey:'H1', seat:'P1' },
      { type:'wrist:orientation', t:2, handKey:'H1', angleDeg:10 },
      { type:'wrist:orientationVel', t:3, handKey:'H1', velDegPerSec:25 },
      { type:'finger:index:angles', t:4, handKey:'H1', mcp:12, pip:30 },
      { type:'pinch:up', t:5, handKey:'H1', seat:'P1' },
      { type:'frame:landmarks', t:6, frame:{ landmarks:[{x:0,y:0,z:0}] } }
    ];
    events.forEach(e => vm.onEvent(e));
    vm.tick();
    const snap = vm.snapshot();
    assert(snap.hands.H1, 'H1 hand aggregate present');
    assert.strictEqual(snap.seats.P1, 'H1');
    assert(Array.isArray(snap.pinchLog), 'pinchLog array');
    assert(snap.pinchLog.length >= 2, 'pinchLog captured pinch events');
    assert(snap.hands.H1.orient && snap.hands.H1.flex && snap.hands.H1.vel, 'orientation/flex/vel aggregated');
    assert(snap.lastFrame && snap.lastFrame.landmarks, 'lastFrame landmarks captured');
    assert(snap.diag.frames >= 1, 'frames incremented');
  });

  it('respects pinchLog size limit', () => {
    const vm = createHandConsoleViewModel({ pinchLogSize: 10 });
    for(let i=0;i<25;i++) vm.onEvent({ type:'pinch:down', t:i, handKey:'H1' });
    const snap = vm.snapshot();
    assert(snap.pinchLog.length <= 10, 'pinchLog trimmed to size');
  });
});

// WEBWAY:ww-2025-008:end