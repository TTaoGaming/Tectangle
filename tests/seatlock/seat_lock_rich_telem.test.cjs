// WEBWAY:ww-2025-018 guard test
const { createSeatLockRichAdapter } = require('../../src/ui/seatLockRichAdapter.js');

function makeMock(){
  let rich = { hands:{ h1:{ seat:'P1', norm:0.42, rawNorm:0.52, velocity:1.2, palmAngleDeg:23, thresholds:{enter:0.3,exit:0.5}, history:[1,2,3] } } };
  const shell = { getRichSnapshot: ()=> rich };
  const vmCore = { snapshot: ()=>({ seats:{P1:'handA'}, hands:{ h1:{ seat:'P1', pinch:{ normalizedGap:0.44 }, orient:{ angleDeg:22 }, vel:{ velDegPerSec:1.1 } } } }), tick(){} };
  return { shell, vmCore };
}

test('enriched remains locked=false until stableFrames met', ()=>{
  const { shell, vmCore } = makeMock();
  const adapter = createSeatLockRichAdapter({ shell, vmCore, stableFrames:3 });
  adapter.tick(); adapter.tick();
  expect(adapter.snapshot().enriched.P1.locked).toBe(false);
  adapter.tick();
  expect(adapter.snapshot().enriched.P1.locked).toBe(true);
});

test('rich fields present only after lock', ()=>{
  const { shell, vmCore } = makeMock();
  const adapter = createSeatLockRichAdapter({ shell, vmCore, stableFrames:2 });
  adapter.tick(); // frame 1 (not locked)
  expect(adapter.snapshot().enriched.P1.norm).toBeUndefined();
  adapter.tick(); // frame 2 -> locked
  const e = adapter.snapshot().enriched.P1;
  expect(e.locked).toBe(true);
  expect(e.norm).toBeCloseTo(0.42,2);
  expect(e.historyLen).toBe(3);
});