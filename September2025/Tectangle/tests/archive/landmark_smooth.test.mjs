/**
 * landmark_smooth.test.mjs
 *
 * Basic unit test for LandmarkSmoothManager smoothing behavior.
 *
 * How to run:
 *  - From project root:
 *      node --experimental-modules "August Tectangle Sprint/tectangle-gesture-keyboard-mobile/tests/unit/landmark_smooth.test.mjs"
 *  - Or use your preferred test runner that supports ESM (.mjs)
 */

import assert from 'node:assert/strict';
import LandmarkSmoothManager from '../../../src/LandmarkSmoothManager.js';

(async function main() {
  const manager = new LandmarkSmoothManager({ fps: 30 });
  await manager.init();
  manager.start();

  const smoothedRecords = [];
  manager.addEventListener('landmark:smoothed', (payload) => {
    // payload.landmarks is array of positions (x,y,z)
    smoothedRecords.push(payload);
  });

  const rawSamples = [];
  const smoothedSamples = [];

  const frames = 20;
  const baseTs = Date.now();

  for (let i = 0; i < frames; i++) {
    const rawX = 0.5 + ((i % 2) ? 0.02 : -0.02);
    rawSamples.push(rawX);
    const frame = {
      frameId: i,
      timestamp: baseTs + Math.round(i * (1000 / 30)),
      landmarks: [{ x: rawX, y: 0, z: 0 }]
    };
    manager.observeFrame(frame);
    // synchronously, listener should have pushed a payload
    const latest = smoothedRecords[smoothedRecords.length - 1];
    if (latest && latest.landmarks && latest.landmarks[0] && typeof latest.landmarks[0].x === 'number') {
      smoothedSamples.push(latest.landmarks[0].x);
    } else {
      // fallback to raw if no smoothed available
      smoothedSamples.push(rawX);
    }
  }

  function std(arr) {
    const n = arr.length;
    if (n === 0) return 0;
    const mean = arr.reduce((s, v) => s + v, 0) / n;
    const variance = arr.reduce((s, v) => s + (v - mean) * (v - mean), 0) / n;
    return Math.sqrt(variance);
  }

  const rawStd = std(rawSamples);
  const smoothStd = std(smoothedSamples);

  console.log('rawStd=', rawStd.toFixed(6), 'smoothStd=', smoothStd.toFixed(6));

  assert.ok(smoothStd < rawStd, `Expected smoothed std (${smoothStd}) to be less than raw std (${rawStd})`);

  console.log('landmark_smooth.test.mjs: OK');

  manager.stop();
  manager.destroy();
})().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});