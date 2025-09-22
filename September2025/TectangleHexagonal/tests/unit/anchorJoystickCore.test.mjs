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

import { strict as assert } from "assert";
import { createAnchorJoystickCore } from "../../src/core/anchorJoystickCore.js";

describe('anchorJoystickCore', () => {
  function frame(t, x = 0.5, y = 0.5) {
    return {
      t,
      indexTip: [x + 0.02, y + 0.02, 0],
      thumbTip: [x - 0.02, y - 0.02, 0],
      hand: 'Right'
    };
  }

  it('anchors immediately when confirmHoldMs is zero and updates vector', () => {
    const core = createAnchorJoystickCore({ confirmHoldMs: 0, minUpdateDelta: 0 });
    const events = [];
    core.on(e => events.push(e));

    core.updateFrame(frame(0));
    core.onPinchEvent({ type: 'pinch:down', hand: 'Right', t: 0 }, { handKey: 'hand:Right' });

    const start = events.find(e => e.type === 'anchor:start');
    assert.ok(start, 'anchor:start emitted');
    assert.deepEqual(start.vector, [0, 0, 0]);

    core.updateFrame(frame(50, 0.6, 0.5), { handKey: 'hand:Right' });
    const update = events.find(e => e.type === 'anchor:update');
    assert.ok(update, 'anchor:update emitted');
    assert.ok(update.vector[0] > 0, 'vector reflects movement');

    core.onPinchEvent({ type: 'pinch:up', hand: 'Right', t: 100 }, { handKey: 'hand:Right' });
    const end = events.find(e => e.type === 'anchor:end');
    assert.ok(end, 'anchor:end emitted');
  });

  it('waits for hold confirmation before starting anchor', () => {
    const core = createAnchorJoystickCore({ confirmHoldMs: 120, minUpdateDelta: 0 });
    const events = [];
    core.on(e => events.push(e));

    core.updateFrame(frame(0));
    core.onPinchEvent({ type: 'pinch:down', hand: 'Right', t: 0 }, { handKey: 'hand:Right' });
    assert.ok(!events.some(e => e.type === 'anchor:start'), 'no start before hold');

    core.updateFrame(frame(130));
    core.onPinchEvent({ type: 'pinch:hold', hand: 'Right', t: 130 }, { handKey: 'hand:Right' });
    const start = events.find(e => e.type === 'anchor:start');
    assert.ok(start, 'anchor:start emitted after hold');

    core.onPinchEvent({ type: 'pinch:cancel', hand: 'Right', t: 150 }, { handKey: 'hand:Right' });
    const cancel = events.find(e => e.type === 'anchor:cancel');
    assert.ok(cancel, 'anchor:cancel emitted');
  });
});
