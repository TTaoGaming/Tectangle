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
import path from 'path';

// We will import the core once implemented. For now, dynamic optional require.
let core;
try { core = await import('../../src/core/seatConcurrencyCore.js'); } catch(e){ /* module not yet implemented */ }

function mkHands(t, list){
  // list: [{id, wrist:[x,y,z]?}]
  return { t, hands: list.map(h=>({ id: h.id, wrist: h.wrist||[0,0,0] })) };
}

// Contract we expect seatConcurrencyCore to satisfy:
// createSeatConcurrencyCore({ staleTimeoutMs, peakWindowMs, sustainFramesForPeak }) -> { update(frameHands) -> state }
// state: { t, current, peakWindow, peakEver, unlockSeats, activeIds:Set, recentlyLost:Set }
// Rules:
//  - current = #hands in this frame
//  - peakWindow = max concurrent count in sliding window [t-peakWindowMs, t]
//  - unlockSeats = peakWindow (capped optional) when sustain condition met; otherwise previous unlockSeats
//  - sustainFramesForPeak: require that the new peakWindow value has appeared in at least sustainFramesForPeak *consecutive* frames before raising unlockSeats
//  - staleTimeoutMs: a hand absent for > staleTimeoutMs appears again counts as new (affects sustain continuity)

const CONFIG = { staleTimeoutMs: 500, peakWindowMs: 2500, sustainFramesForPeak: 3 };

describe('seatConcurrencyCore (TDD)', ()=>{
  it('exports factory after implementation', ()=>{
    if(!core){ assert.fail('seatConcurrencyCore.js not implemented yet'); }
    assert.equal(typeof core.createSeatConcurrencyCore, 'function');
  });

  it('tracks current and peakWindow over time', ()=>{
    if(!core){ return assert.ok(true, 'skip until implemented'); }
    const c = core.createSeatConcurrencyCore(CONFIG);
    let s;
    s = c.update(mkHands(0, [{id:'A'}]));
    assert.equal(s.current, 1); assert.equal(s.peakWindow, 1);
    s = c.update(mkHands(100, [{id:'A'},{id:'B'}]));
    assert.equal(s.current, 2); assert.equal(s.peakWindow, 2);
    s = c.update(mkHands(600, [{id:'A'}])); // B gone, still within window
    assert.equal(s.current, 1); assert.equal(s.peakWindow, 2, 'peakWindow should retain max until drops out of window');
    s = c.update(mkHands(3000, [{id:'A'}])); // beyond window -> peak resets to current
    assert.equal(s.peakWindow, 1, 'old peak outside sliding window');
  });

  it('requires sustain frames before increasing unlockSeats', ()=>{
    if(!core){ return assert.ok(true, 'skip until implemented'); }
    const c = core.createSeatConcurrencyCore(CONFIG);
    let s;
    s = c.update(mkHands(0, [{id:'A'}]));
    assert.equal(s.unlockSeats, 1);
    // Two-hand concurrency appears but only 1 frame -> should NOT raise yet
    s = c.update(mkHands(50, [{id:'A'},{id:'B'}]));
    assert.equal(s.unlockSeats, 1, 'not enough sustain frames');
    // second consecutive frame with 2 hands
    s = c.update(mkHands(100, [{id:'A'},{id:'B'}]));
    assert.equal(s.unlockSeats, 1, 'still need 3 sustain frames');
    // third consecutive frame -> raise
    s = c.update(mkHands(150, [{id:'A'},{id:'B'}]));
    assert.equal(s.unlockSeats, 2, 'unlock after sustain threshold met');
  });

  it('drops sustain counter if concurrency dips', ()=>{
    if(!core){ return assert.ok(true, 'skip until implemented'); }
    const c = core.createSeatConcurrencyCore(CONFIG);
    c.update(mkHands(0, [{id:'A'}]));
    c.update(mkHands(50, [{id:'A'},{id:'B'}]));
    c.update(mkHands(100, [{id:'A'}])); // dip resets sustain
    let s = c.update(mkHands(150, [{id:'A'},{id:'B'}]));
    assert.equal(s.unlockSeats, 1, 'sustain reset after dip');
    s = c.update(mkHands(200, [{id:'A'},{id:'B'}]));
    s = c.update(mkHands(250, [{id:'A'},{id:'B'}]));
    assert.equal(s.unlockSeats, 2, 'raised again after new sustained run');
  });

  it('treats reappearing hand after stale timeout as new for sustain continuity', ()=>{
    if(!core){ return assert.ok(true, 'skip until implemented'); }
    const c = core.createSeatConcurrencyCore(CONFIG);
    c.update(mkHands(0, [{id:'A'}]));
    c.update(mkHands(50, [{id:'A'},{id:'B'}]));
    c.update(mkHands(100, [{id:'A'},{id:'B'}]));
    // B disappears long enough to be stale
    c.update(mkHands(700, [{id:'A'}])); // > staleTimeoutMs
    const s = c.update(mkHands(750, [{id:'A'},{id:'B'}]));
    // sustain should start over -> unlockSeats still 1
    assert.equal(s.unlockSeats, 1, 'stale re-entry resets sustain');
  });

  it('never decreases unlockSeats even if peakWindow falls', ()=>{
    if(!core){ return assert.ok(true, 'skip until implemented'); }
    const c = core.createSeatConcurrencyCore(CONFIG);
    c.update(mkHands(0, [{id:'A'}]));
    c.update(mkHands(50, [{id:'A'},{id:'B'}]));
    c.update(mkHands(100, [{id:'A'},{id:'B'}]));
    c.update(mkHands(150, [{id:'A'},{id:'B'}])); // sustain -> unlock to 2
    let s = c.update(mkHands(3000, [{id:'A'}])); // window resets
    assert.equal(s.unlockSeats, 2, 'unlocks are monotonic');
  });
});
