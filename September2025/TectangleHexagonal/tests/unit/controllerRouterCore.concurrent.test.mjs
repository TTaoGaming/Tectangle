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

import { strict as assert } from 'assert';
import { createControllerRouter } from '../../src/app/controllerRouterCore.js';

// Deterministic fallback keeps tests stable even if wrist isn't provided.
function frame(t, hand, handId, wrist){
  return { t, hand, handId, wrist: wrist || deterministicWrist(hand, handId) };
}

function deterministicWrist(hand, handId){
  if(hand === 'Right') return [0.25, 0.7, 0];
  if(hand === 'Left') return [0.75, 0.7, 0];
  const seedBase = typeof handId === 'number'
    ? handId
    : (handId ? Array.from(String(handId)).reduce((sum, ch) => sum + ch.charCodeAt(0), 0) : 0);
  const x = 0.2 + ((seedBase % 5) * 0.15);
  const y = 0.5 + (((Math.floor(seedBase / 5)) % 3) * 0.1);
  return [Number(x.toFixed(2)), Number(y.toFixed(2)), 0];
}

describe('ControllerRouter concurrent cap + pairing', ()=>{
  it('caps seats by max concurrent hands seen', ()=>{
    const r = createControllerRouter({ cfg:{ pairing:{ enabled:true, seats:['P1','P2','P3','P4'], strictConcurrent:true }, lostAfterMs:500 } });
    // One hand active -> maxConcurrent=1
    r.onFrame(frame(0,'Right', 1, [0.2,0.7,0]));
    // First pinch assigns P1
    const p1 = r.onPinchEvent({ type:'pinch:down', t:10, hand:'Right', handId:1 });
    assert.equal(p1, 'P1');
    // Without concurrent second hand yet, attempt to assign another seat should fail
    const p2Early = r.onPinchEvent({ type:'pinch:down', t:15, hand:'Left', handId:2 });
    assert.equal(p2Early, null);
    // Now introduce second hand concurrently -> maxConcurrent=2
    r.onFrame(frame(16,'Left', 2, [0.8,0.7,0]));
    r.onFrame(frame(17,'Right', 1, [0.2,0.7,0]));
    const p2 = r.onPinchEvent({ type:'pinch:down', t:18, hand:'Left', handId:2 });
    assert.equal(p2, 'P2');
    // Without 3rd/4th concurrent hands, P3/P4 not available
    const p3Attempt = r.onPinchEvent({ type:'pinch:down', t:19, hand:'Right', handId:3 });
    assert.equal(p3Attempt, null);
  });

  it('allows P3/P4 when maxConcurrent reaches 3/4', ()=>{
    const r = createControllerRouter({ cfg:{ pairing:{ enabled:true, seats:['P1','P2','P3','P4'], strictConcurrent:true }, lostAfterMs:500 } });
    // See three concurrent hands
    r.onFrame(frame(0,'A', 11, [0.1,0.7,0]));
    r.onFrame(frame(0,'B', 22, [0.5,0.7,0]));
    r.onFrame(frame(0,'C', 33, [0.9,0.7,0]));
    // Three pinches -> P1,P2,P3
    assert.equal(r.onPinchEvent({ type:'pinch:down', t:5, hand:'A', handId:11 }), 'P1');
    assert.equal(r.onPinchEvent({ type:'pinch:down', t:6, hand:'B', handId:22 }), 'P2');
    assert.equal(r.onPinchEvent({ type:'pinch:down', t:7, hand:'C', handId:33 }), 'P3');
    // Now a fourth appears concurrently, enabling P4
    r.onFrame(frame(8,'D', 44, [0.7,0.7,0]));
    assert.equal(r.onPinchEvent({ type:'pinch:down', t:9, hand:'D', handId:44 }), 'P4');
  });

  it('reacquires lost seat by proximity snap', ()=>{
    const r = createControllerRouter({ cfg:{ pairing:{ enabled:true, seats:['P1','P2'], strictConcurrent:true }, lostAfterMs:100, reserveTtlMs:2000, snapDist:0.2 } });
    // Two hands paired
    r.onFrame(frame(0,'R', 1, [0.2,0.7,0]));
    r.onFrame(frame(0,'L', 2, [0.8,0.7,0]));
    assert.equal(r.onPinchEvent({ type:'pinch:down', t:5, hand:'R', handId:1 }), 'P1');
    assert.equal(r.onPinchEvent({ type:'pinch:down', t:6, hand:'L', handId:2 }), 'P2');
    // R hand lost after t=250; reserve P1 at last pos
    r.onFrame(frame(250,'L', 2, [0.8,0.7,0]));
    // New hand appears near P1 position -> should snap to P1
    r.onFrame(frame(300,'X', 3, [0.21,0.69,0]));
    // No pinch; onFrame should assign by proximity from reserve
    const state = r.getState();
    const map = new Map(state.map);
    assert.equal(map.get('id:3'), 'P1');
  });
});




