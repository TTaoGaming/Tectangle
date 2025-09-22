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
import { createGameEventBridge } from '../../src/app/gameEventBridge.js';

function fakeFrame(angleDeg){
  // produce a frame where wrist->indexMCP forms desired angle relative to +X
  const rad = angleDeg * Math.PI/180;
  const wrist = [0,0,0];
  const indexMCP = [Math.cos(rad), Math.sin(rad), 0];
  return { wrist, indexMCP };
}

describe('gameEventBridge', () => {
  it('maps pinch down/up to actions with orientation bucket', () => {
    const bridge = createGameEventBridge();
    const events = [];
    bridge.on(e=>events.push(e));
    bridge.onPinchEvent({ type:'pinch:down', t:0, seat:'P1', hand:'Right', frame: fakeFrame(10) });
    bridge.onPinchEvent({ type:'pinch:up', t:120, seat:'P1', hand:'Right', frame: fakeFrame(200) });
    assert.strictEqual(events.length, 2);
    assert.strictEqual(events[0].action, 'BTN_PRIMARY');
    assert.strictEqual(events[0].orientBucket, 'UP');
    assert.strictEqual(events[1].action, 'BTN_RELEASE');
    assert.strictEqual(events[1].orientBucket, 'DOWN');
  });

  it('allows swapping to single-key profile with payloads', () => {
    const bridge = createGameEventBridge({ profile: { use: 'single-key', params: { key: 'KeyZ', keyLabel: 'Z' } } });
    const actions = [];
    bridge.on(a => actions.push(a));
    bridge.onPinchEvent({ type:'pinch:down', t:10, seat:'P2', hand:'Left', frame: fakeFrame(350) });
    bridge.onPinchEvent({ type:'pinch:up', t:120, seat:'P2', hand:'Left', frame: fakeFrame(170) });
    assert.strictEqual(actions.length, 2);
    assert.strictEqual(actions[0].action, 'KEY_DOWN');
    assert.deepStrictEqual(actions[0].payload, { key: 'KeyZ', keyLabel: 'Z', mode: 'down', extra: null });
    assert.strictEqual(actions[0].profileId, 'single-key');
    assert.strictEqual(actions[1].action, 'KEY_UP');
    assert.strictEqual(actions[1].payload.mode, 'up');
  });

  it('exposes profile metadata via API', () => {
    const bridge = createGameEventBridge();
    const legacy = bridge.getProfile();
    assert.strictEqual(legacy.id, 'legacy-primary');
    bridge.setProfile({ use: 'seat-multiplex', params: { seatActions: { P1: { down: 'P1_FIRE', up: 'P1_RELEASE' } } } });
    const seatProfile = bridge.getProfile();
    assert.strictEqual(seatProfile.id, 'seat-multiplex');
    const profiles = bridge.listProfiles();
    assert.ok(Array.isArray(profiles));
    assert.ok(profiles.find(p => p.id === 'seat-multiplex'));
  });
});
