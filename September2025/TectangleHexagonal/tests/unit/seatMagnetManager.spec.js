// WEBWAY:ww-2025-068 — unit tests for seatMagnetManager autosnap behavior
import { createSeatMagnetManager } from '../../src/app/seatMagnetManager.js';

describe('seatMagnetManager', () => {
  test('autosnaps within window when wrist enters radius', () => {
    const t0 = 1000;
    let now = t0;
    const nowFn = () => now;
    const events = [];
    const mgr = createSeatMagnetManager({ radiusNorm: 0.08, autosnapWindowMs: 600000, onEvent: (e)=>events.push(e), nowFn });
    // establish anchor for P1 at (0.5,0.5)
    mgr.setAnchor('P1', 0.5, 0.5, t0);
    // unseated wrist enters within radius shortly after
    now = t0 + 1000;
    mgr.onFrame({ dets: [{ hand:'left', handId:null, landmarks: [[0.51, 0.505, 0]] }], seats: {}, autosnap: true });
    expect(events.find(e=>e.type==='seat:snap' && e.seat==='P1')).toBeTruthy();
  });

  test('does not autosnap after window expires', () => {
    const t0 = 2000; let now = t0; const nowFn = () => now; const events = [];
    const mgr = createSeatMagnetManager({ radiusNorm: 0.08, autosnapWindowMs: 1000, onEvent: (e)=>events.push(e), nowFn });
    mgr.setAnchor('P2', 0.2, 0.2, t0);
    // move time beyond window
    now = t0 + 5000;
    mgr.onFrame({ dets: [{ hand:'right', handId:null, landmarks: [[0.205, 0.205, 0]] }], seats: {}, autosnap: true });
    expect(events.find(e=>e.type==='seat:snap' && e.seat==='P2')).toBeFalsy();
  });

  test('enforces singleton seats and maxSeats', () => {
    const events = []; const mgr = createSeatMagnetManager({ maxSeats: 1, onEvent: (e)=>events.push(e) });
    mgr.setAnchor('P1', 0.1, 0.1, Date.now());
    mgr.onFrame({ dets: [{ hand:'left', handId:null, landmarks: [[0.1,0.1,0]] }], seats: {}, autosnap: true });
    expect(events.find(e=>e.type==='seat:snap' && e.seat==='P1')).toBeTruthy();
    // second seat anchor should not be assigned due to maxSeats=1
    mgr.setAnchor('P2', 0.2, 0.2, Date.now());
    mgr.onFrame({ dets: [{ hand:'right', handId:null, landmarks: [[0.2,0.2,0]] }], seats: {}, autosnap: true });
    expect(events.find(e=>e.type==='seat:snap' && e.seat==='P2')).toBeFalsy();
  });
});
