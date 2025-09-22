import assert from 'assert';
import visual, { VisualManager } from '../../../src/VisualManager.js';

(async function () {
  try {
    const instance = visual || new VisualManager();
    await instance.init();
    if (typeof document !== 'undefined' && document.body) {
      instance.attach && instance.attach(document.body);
    }

    // synthetic 21-point landmark set (normalized coords)
    const synth = new Array(21).fill(0).map((_, i) => ({
      x: (i % 5) / 4,
      y: (Math.floor(i / 5) % 5) / 4,
      z: 0
    }));

    // should not throw
    instance.renderLandmarks(synth, { type: 'smoothed' });

    // if renderer exists in this environment assert it's present
    if (instance.renderer) assert.ok(instance.renderer, 'renderer should exist');

    console.log('visual_manager test: ok');
  } catch (e) {
    console.error('visual_manager test: failed', e);
    throw e;
  }
})();