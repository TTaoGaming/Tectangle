// WEBWAY:ww-2025-068 — unit tests (mocha) for seatMagnetManager autosnap behavior
import { strict as assert } from 'assert';
import { createSeatMagnetManager } from '../../src/app/seatMagnetManager.js';

describe('seatMagnetManager (autosnap)', () => {
  it('autosnaps within window when wrist re-enters radius', () => {
    const t0 = 1000; let now = t0; const nowFn = () => now; const events = [];
    const mgr = createSeatMagnetManager({ radiusNorm: 0.08, autosnapWindowMs: 10*60*1000, onEvent: (e)=>events.push(e), nowFn });
    mgr.setAnchor('P1', 0.5, 0.5, t0);
    // occlusion: no detections for a bit
    now = t0 + 2000;
    mgr.onFrame({ dets: [], seats: {}, autosnap: true });
    // re-entry within radius
    now = t0 + 3000;
    mgr.onFrame({ dets: [{ hand:'left', handId:null, landmarks: [[0.51, 0.505, 0]] }], seats: {}, autosnap: true });
    assert.ok(events.some(e=>e.type==='seat:snap' && e.seat==='P1'), 'expected seat:snap for P1');
  });

  it('does not autosnap after window expiry', () => {
    const t0 = 5000; let now = t0; const nowFn = () => now; const events = [];
    const mgr = createSeatMagnetManager({ radiusNorm: 0.08, autosnapWindowMs: 1000, onEvent: (e)=>events.push(e), nowFn });
    mgr.setAnchor('P2', 0.2, 0.2, t0);
    // expiry
    now = t0 + 5000;
    mgr.onFrame({ dets: [{ hand:'right', handId:null, landmarks: [[0.205, 0.205, 0]] }], seats: {}, autosnap: true });
    assert.ok(!events.some(e=>e.type==='seat:snap' && e.seat==='P2'), 'should not snap after window');
  });

  it('enforces singleton seat and maxSeats', () => {
    const events = []; const mgr = createSeatMagnetManager({ maxSeats: 1, onEvent: (e)=>events.push(e) });
    mgr.setAnchor('P1', 0.1, 0.1, Date.now());
    mgr.onFrame({ dets: [{ hand:'left', handId:null, landmarks: [[0.1,0.1,0]] }], seats: {}, autosnap: true });
    assert.ok(events.some(e=>e.type==='seat:snap' && e.seat==='P1'));
    mgr.setAnchor('P2', 0.2, 0.2, Date.now());
    mgr.onFrame({ dets: [{ hand:'right', handId:null, landmarks: [[0.2,0.2,0]] }], seats: {}, autosnap: true });
    assert.ok(!events.some(e=>e.type==='seat:snap' && e.seat==='P2'));
  });
});
