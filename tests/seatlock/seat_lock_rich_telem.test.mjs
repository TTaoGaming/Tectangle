// WEBWAY:ww-2025-018 guard test (mocha)
import { createSeatLockRichAdapter } from '../../src/ui/seatLockRichAdapter.js';
import assert from 'assert';

function makeMock(twoSeats=false){
  let rich = { hands:{ h1:{ seat:'P1', norm:0.42, rawNorm:0.52, velocity:1.2, palmAngleDeg:23, thresholds:{enter:0.3,exit:0.5}, history:[{t:1,norm:0.4,gate:true},{t:2,norm:0.41,gate:true},{t:3,norm:0.42,gate:true}], indexAngles:{ mcpDeg:55, pipDeg:70, dipDeg:33 } } } };
  if(twoSeats){
    rich.hands.h2 = { seat:'P2', norm:0.62, rawNorm:0.72, velocity:0.8, palmAngleDeg:11, thresholds:{enter:0.25,exit:0.45}, history:[{t:1,norm:0.6,gate:true}], indexAngles:{ mcpDeg:45, pipDeg:60, dipDeg:25 } };
  }
  const shell = { getRichSnapshot: ()=> rich };
  const vmCore = { snapshot: ()=>({ seats: twoSeats? {P1:'handA', P2:'handB'} : {P1:'handA'}, hands: Object.fromEntries(Object.entries(rich.hands).map(([k,v])=>[k,{ seat:v.seat, pinch:{ normalizedGap:v.norm }, orient:{ angleDeg:v.palmAngleDeg }, vel:{ velDegPerSec:v.velocity }, flex:{ mcpDeg:v.indexAngles?.mcpDeg, pipDeg:v.indexAngles?.pipDeg, dipDeg:v.indexAngles?.dipDeg } }])) }), tick(){} };
  return { shell, vmCore };
}

describe('seat-lock rich telemetry adapter', ()=>{
  it('remains unlocked until stableFrames met', ()=>{
    const { shell, vmCore } = makeMock();
    const adapter = createSeatLockRichAdapter({ shell, vmCore, stableFrames:3 });
    adapter.tick(); adapter.tick();
    assert.equal(adapter.snapshot().enriched.P1.locked, false, 'should not lock early');
    adapter.tick();
    assert.equal(adapter.snapshot().enriched.P1.locked, true, 'should lock at stable threshold');
  });
  it('exposes rich fields only after lock with joint angles + history slice', ()=>{
    const { shell, vmCore } = makeMock();
    const adapter = createSeatLockRichAdapter({ shell, vmCore, stableFrames:2 });
    adapter.tick();
    assert.equal(adapter.snapshot().enriched.P1.norm, undefined, 'norm hidden pre-lock');
    adapter.tick();
    const e = adapter.snapshot().enriched.P1;
    assert.equal(e.locked, true);
    assert(Math.abs(e.norm - 0.42) < 0.01, 'norm present post-lock');
    assert.equal(e.historyLen, 3);
    assert.equal(e.jointAngles.index.mcpDeg, 55);
    assert.ok(Array.isArray(e.history) && e.history.length===3, 'history slice present');
  });
  it('supports multiple seats dynamically', ()=>{
    const { shell, vmCore } = makeMock(true);
    const adapter = createSeatLockRichAdapter({ shell, vmCore, stableFrames:1 });
    adapter.tick(); // immediate lock due to stableFrames=1
    const snap = adapter.snapshot();
    assert.equal(Object.keys(snap.enriched).length, 2, 'two seats enriched');
    assert.equal(snap.enriched.P2.locked, true);
    assert(snap.enriched.P2.jointAngles.index.mcpDeg === 45);
  });
});