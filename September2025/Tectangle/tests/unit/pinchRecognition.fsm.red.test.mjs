import { strict as assert } from 'assert';
import eventBus from '../../src/EventBusManager.js';
import PinchRecognitionManager from '../../src/PinchRecognitionManager.js';

describe('PinchRecognitionManager FSM (phase-0)', function() {
  let mgr;
  beforeEach(function() {
    eventBus.clear();
    mgr = new PinchRecognitionManager();
    mgr.start();
  });

  afterEach(function() {
    try { mgr.stop(); } catch (e) {}
    eventBus.clear();
  });

  it('emits tectangle:gesture start and end and telemetry counter', function() {
    const makeLandmarks = (thumbX, indexX, knA = 0.0, knB = 0.1) => {
      const lm = [];
      for (let i = 0; i < 21; i++) lm.push([0, 0, 0]);
      lm[4] = [thumbX, 0, 0]; // thumb tip
      lm[8] = [indexX, 0, 0]; // index tip
      lm[5] = [knA, 0, 0]; // knuckle A
      lm[17] = [knB, 0, 0]; // knuckle B
      return lm;
    };

    // Trigger: palmSpan = 0.1 -> triggerRatio 0.4 => dist <= 0.04
    const downLm = makeLandmarks(0.5, 0.539, 0.0, 0.1);
    eventBus.publish('landmark:smoothed', { landmarks: downLm, frameId: 1, timestamp: Date.now() });

    const recent = eventBus.getRecent(20);
    const startEnv = recent.find(e => e.event === 'tectangle:gesture' && e.detail && e.detail.type === 'start');
    assert.ok(startEnv, 'expected tectangle:gesture start');

    const telemetryEnv = recent.find(e => e.event === 'telemetry:counter' && e.detail && e.detail.metric === 'telemetry.pinch.count');
    assert.ok(telemetryEnv, 'expected telemetry:counter increment');

    // Release: set index further away; dist >= 0.08 (releaseRatio 0.8 * palmSpan 0.1)
    const upLm = makeLandmarks(0.5, 0.581, 0.0, 0.1);
    eventBus.publish('landmark:smoothed', { landmarks: upLm, frameId: 2, timestamp: Date.now() });

    const recent2 = eventBus.getRecent(30);
    const endEnv = recent2.find(e => e.event === 'tectangle:gesture' && e.detail && e.detail.type === 'end');
    assert.ok(endEnv, 'expected tectangle:gesture end');
  });
});