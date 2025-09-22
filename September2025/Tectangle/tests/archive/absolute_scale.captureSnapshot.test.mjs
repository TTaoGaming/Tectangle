// absolute_scale.captureSnapshot.test.mjs
// Deterministic unit test for AbsoluteScaleManager.captureSnapshot()
// Run with: node August\ Tectangle\ Sprint/tectangle-gesture-keyboard-mobile/tests/unit/absolute_scale.captureSnapshot.test.mjs
import assert from 'assert';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);

// Ensure a minimal localStorage shim is present for Node environment
if (typeof global.localStorage === 'undefined') {
  global.localStorage = {
    _store: {},
    getItem(k) { return Object.prototype.hasOwnProperty.call(this._store, k) ? this._store[k] : null; },
    setItem(k, v) { this._store[k] = String(v); },
    removeItem(k){ delete this._store[k]; }
  };
}

async function testCaptureSnapshotPersistence() {
  const mod = await import('../../../src/AbsoluteScaleManager.js');
  const { AbsoluteScaleManager } = mod;
  if (typeof AbsoluteScaleManager !== 'function') throw new Error('AbsoluteScaleManager class not exported');

  // Use a test-scoped persist key to avoid colliding with real app data
  const persistKey = 'tectangle:test:knuckleSpan';
  const mgr = new AbsoluteScaleManager({ persistKey });
  await mgr.init();
  mgr.setParams({ landmarkIndices: [0, 1], physicalKnuckleCm: 8.0 });
  mgr.start();

  const frame = {
    frameId: 1000,
    landmarks: [
      { x: 0.0, y: 0.0, z: -0.8 }, // idx 0
      { x: 0.2, y: 0.0, z: -0.9 }  // idx 1
    ],
    // no palmFacingScore provided -> optimistic eligible path
  };

  const opts = { handSessionId: 1, label: 'primary', deviceId: 'device123', cameraPose: 'pose0', physicalKnuckleCm: 8.0 };

  const res = mgr.captureSnapshot(frame, opts);

  // If persistence worked, res should be the persisted object; otherwise captureSnapshot returns { eligible:true, snapshot }
  const persisted = res && res.zSlices ? res : (res && res.snapshot && res.snapshot.scaleCm ? mgr.getCalibration(opts.handSessionId, { deviceId: opts.deviceId, cameraPose: opts.cameraPose }) : null);

  assert(persisted, 'Expected persisted object or snapshot to be present');

  let slice = null;
  if (Array.isArray(persisted.zSlices) && persisted.zSlices.length > 0) {
    slice = persisted.zSlices.find(s => s.label === 'primary') || persisted.zSlices[0];
  } else if (res && res.snapshot) {
    slice = res.snapshot;
  }

  assert(slice, 'Expected a saved z-slice snapshot');
  const expectedDistance = Math.hypot(frame.landmarks[0].x - frame.landmarks[1].x, frame.landmarks[0].y - frame.landmarks[1].y);
  const expectedScale = Number(opts.physicalKnuckleCm) / expectedDistance;
  assert(Math.abs(slice.normalizedDistance - expectedDistance) < 1e-9, 'normalizedDistance mismatch');
  assert(Math.abs(slice.scaleCm - expectedScale) < 1e-9, `scaleCm mismatch expected ${expectedScale} got ${slice.scaleCm}`);

  // verify getCalibration reads the same persisted object
  const calib = mgr.getCalibration(opts.handSessionId, { deviceId: opts.deviceId, cameraPose: opts.cameraPose });
  assert(calib && Array.isArray(calib.zSlices), 'getCalibration should return persisted object with zSlices');

  // verify getScaleForZ returns the expected scale for the zProxy
  const actualScale = mgr.getScaleForZ(slice.zProxy, opts.handSessionId, { deviceId: opts.deviceId, cameraPose: opts.cameraPose });
  assert(Math.abs(actualScale - slice.scaleCm) < 1e-9, 'getScaleForZ interpolation mismatch');

  // cleanup
  mgr.destroy();
  console.log('testCaptureSnapshotPersistence passed');
  return { ok: true };
}

// run if executed directly
if (fileURLToPath(import.meta.url) === process.argv[1]) {
  (async () => {
    try {
      await testCaptureSnapshotPersistence();
      console.log('ALL TESTS PASSED');
      process.exit(0);
    } catch (err) {
      console.error('TEST FAILED:', err && (err.stack || String(err)));
      process.exit(1);
    }
  })();
}

export default testCaptureSnapshotPersistence;