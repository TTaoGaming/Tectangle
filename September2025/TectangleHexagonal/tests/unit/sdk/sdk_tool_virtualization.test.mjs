import assert from 'assert';
import { HexInput } from '../../../src/sdk/hexInputFacade.js';

function fakeShellWithBridge(){
  const listeners = new Set();
  const actionListeners = new Set();
  const shell = {
    onEvent(h){ listeners.add(h); return ()=>listeners.delete(h); },
    onAction(h){ actionListeners.add(h); return ()=>actionListeners.delete(h); },
    // Test helpers: simulate gesture→tool actions routed by a bridge
    _gestureToKeyboard(key){ actionListeners.forEach(h=>h({ type:'keyboard:press', key })); },
    _gestureToMouse(x,y,btn='left'){ actionListeners.forEach(h=>h({ type:'mouse:click', x, y, btn })); },
    _gestureToTouch(x,y){ actionListeners.forEach(h=>h({ type:'touch:tap', x, y })); },
    _gestureToPen(points){ actionListeners.forEach(h=>h({ type:'pen:stroke', points })); },
    _gestureToGamepad(btn){ actionListeners.forEach(h=>h({ type:'gamepad:button', button: btn })); },
  };
  return shell;
}

describe('SDK — tool virtualization (adapter surface via action channel)', () => {
  it('emits keyboard press actions', async () => {
    const fake = fakeShellWithBridge();
    const api = HexInput.create({ factories: { createAppShell: () => fake } });
    let seen = null; const off = api.onAction(a => seen = a);
    fake._gestureToKeyboard('KeyK');
    off();
    assert.ok(seen && seen.type==='keyboard:press' && seen.key==='KeyK');
  });

  it('emits mouse click / touch tap / pen stroke / gamepad button', async () => {
    const fake = fakeShellWithBridge();
    const api = HexInput.create({ factories: { createAppShell: () => fake } });
    const got = [];
    const off = api.onAction(a => got.push(a));
    fake._gestureToMouse(100, 200, 'left');
    fake._gestureToTouch(10, 20);
    fake._gestureToPen([{x:1,y:1},{x:2,y:2}]);
    fake._gestureToGamepad('A');
    off();
    const types = got.map(a=>a.type).sort();
    assert.deepStrictEqual(types, ['gamepad:button','mouse:click','pen:stroke','touch:tap'].sort());
  });
});
