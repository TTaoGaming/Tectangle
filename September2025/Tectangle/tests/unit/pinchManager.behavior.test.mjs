import { strict as assert } from 'assert';
import eventBus from '../../src/EventBusManager.js';
import PinchManager, { __HEADER__ } from '../../src/managers/PinchManager.js';
import * as pinchBaseline from '../../src/gesture/pinchBaseline.js';

describe('PinchManager behavior (phase-0 smoke)', function() {
  beforeEach(function() {
    eventBus.clear();
    try { pinchBaseline.stop(); } catch (e) {}
  });

  after(function() {
    try { pinchBaseline.stop(); } catch (e) {}
    eventBus.clear();
  });

  it('preserves header and baseline pinch emits pinch:down then pinch:up and telemetry increments', function() {
    // header assertion for existing manager (do not overwrite existing file)
    assert.equal(__HEADER__, 'PinchManager.v1');

    // start baseline detector that listens for landmark:smoothed
    pinchBaseline.start();

    // helper to create landmarks array of length 21
    const makeLandmarks = (thumb, index) => {
      const lm = [];
      for (let i = 0; i < 21; i++) lm.push([0, 0, 0]);
      lm[4] = thumb;
      lm[8] = index;
      return lm;
    };

    // emit a 'close' frame to trigger pinch:down (dist <= 0.03)
    const downPayload = {
      landmarks: makeLandmarks([0.5, 0.5, 0], [0.505, 0.5, 0]),
      frameId: 1,
      timestamp: Date.now()
    };
    eventBus.publish('landmark:smoothed', downPayload);

    const recent1 = eventBus.getRecent(10);
    const downEnv = recent1.find(e => e.event === 'pinch:down');
    assert.ok(downEnv, 'expected pinch:down to be published');
    // telemetry emitted via pinchTelemetry.incrementPinchCount
    const telemetryEnv = recent1.find(e => e.event === 'telemetry:counter' && e.detail && e.detail.metric === 'telemetry.pinch.count');
    assert.ok(telemetryEnv, 'expected telemetry:counter for pinch to be published');

    // emit 'open' frame to trigger pinch:up (dist >= 0.05)
    const upPayload = {
      landmarks: makeLandmarks([0.5, 0.5, 0], [0.7, 0.5, 0]),
      frameId: 2,
      timestamp: Date.now()
    };
    eventBus.publish('landmark:smoothed', upPayload);

    const recent2 = eventBus.getRecent(20);
    const upEnv = recent2.find(e => e.event === 'pinch:up');
    assert.ok(upEnv, 'expected pinch:up to be published');

  });
});