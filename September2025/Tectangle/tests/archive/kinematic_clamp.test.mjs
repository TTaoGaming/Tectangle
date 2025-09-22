/**
 * kinematic_clamp.test.mjs
 *
 * TLDR: Basic unit test skeleton for KinematicClampManager clamp behaviors.
 *
 * Executive summary (5W1H):
 *  Who: Developers and CI validating kinematic clamp behavior.
 *  What: Unit tests covering normal motion, teleport clamping, and high-velocity clamping.
 *  When: During local development and CI pre-integration checks.
 *  Where: Run from project root or browser/Node ESM harness.
 *  Why: Ensure the kinematic clamp prevents teleports and implausible motion from breaking downstream logic.
 *  How: Feed deterministic frames with controlled timestamps and assert emitted events & reasons.
 *
 * Top 3 tests/responsibilities:
 *  1. Normal small motion passes (emit 'landmark:passed', clampedCount === 0).
 *  2. Teleport triggers 'teleport' clamping and reports reason for the index.
 *  3. High velocity triggers 'high_velocity' clamping and freezes position to last.pos.
 *
 * How to run:
 *   node --experimental-modules "August Tectangle Sprint/tectangle-gesture-keyboard-mobile/tests/unit/kinematic_clamp.test.mjs"
 */
import assert from 'node:assert/strict';
import KinematicClampManager from '../../../src/KinematicClampManager.js';

(async function main() {
  // Case A: normal small motion -> expect landmark:passed (no clamps)
  {
    const manager = new KinematicClampManager({ fps: 30, landmarksCount: 1 });
    await manager.init();
    manager.start();

    let passedEvent = null;
    manager.addEventListener('landmark:passed', (payload) => { passedEvent = payload; });

    const baseTs = Date.now();
    // init
    manager.observeFrame({ frameId: 0, timestamp: baseTs, landmarks: [{ x: 0.5, y: 0, z: 0 }] });
    // small motion after ~33ms
    manager.observeFrame({ frameId: 1, timestamp: baseTs + 33, landmarks: [{ x: 0.51, y: 0, z: 0 }] });

    assert.ok(passedEvent, 'Expected a landmark:passed event for small motion');
    assert.strictEqual(passedEvent.detail.clampedCount, 0, 'Expected clampedCount === 0 for small motion');

    manager.stop();
    manager.destroy();
  }

  // Case B: teleport -> expect landmark:clamped with reason 'teleport' for index 0
  {
    const manager = new KinematicClampManager({ fps: 30, landmarksCount: 1 });
    await manager.init();
    manager.start();

    const baseTs = Date.now();
    manager.observeFrame({ frameId: 0, timestamp: baseTs, landmarks: [{ x: 0.5, y: 0, z: 0 }] });

    let clampedEvent = null;
    manager.addEventListener('landmark:clamped', (payload) => { clampedEvent = payload; });

    // large jump (teleport) at next frame
    manager.observeFrame({ frameId: 2, timestamp: baseTs + 33, landmarks: [{ x: 0.9, y: 0, z: 0 }] });

    assert.ok(clampedEvent, 'Expected a landmark:clamped event for teleport');
    assert.strictEqual(clampedEvent.detail.clampedCount > 0, true, 'Expected clampedCount > 0 for teleport');
    const reason = Array.isArray(clampedEvent.detail.reasons) ? clampedEvent.detail.reasons.find(r => r.index === 0) : null;
    assert.ok(reason, 'Expected a reason entry for index 0');
    assert.strictEqual(reason.reason, 'teleport', `Expected reason 'teleport' but got '${reason.reason}'`);

    manager.stop();
    manager.destroy();
  }

  // Case C: high velocity -> expect landmark:clamped with reason 'high_velocity'
  {
    const manager = new KinematicClampManager({ fps: 30, landmarksCount: 1 });
    await manager.init();
    manager.start();

    const baseTs = Date.now();
    manager.observeFrame({ frameId: 0, timestamp: baseTs, landmarks: [{ x: 0.5, y: 0, z: 0 }] });

    let clampedEvent = null;
    manager.addEventListener('landmark:clamped', (payload) => { clampedEvent = payload; });

    // small displacement but short dt => high velocity
    manager.observeFrame({ frameId: 1, timestamp: baseTs + 10, landmarks: [{ x: 0.56, y: 0, z: 0 }] });

    assert.ok(clampedEvent, 'Expected a landmark:clamped event for high_velocity');
    const reasonHV = Array.isArray(clampedEvent.detail.reasons) ? clampedEvent.detail.reasons.find(r => r.index === 0) : null;
    assert.ok(reasonHV, 'Expected a reason entry for index 0 (high_velocity)');
    assert.strictEqual(reasonHV.reason, 'high_velocity', `Expected reason 'high_velocity' but got '${reasonHV.reason}'`);

    // Also verify the accepted output position equals last.pos (freeze) when high_velocity
    const outPos = clampedEvent.detail.landmarks[0];
    assert.strictEqual(outPos.x, 0.5, 'Expected clamped output x to equal previous pos (0.5) on high_velocity');

    manager.stop();
    manager.destroy();
  }

  console.log('kinematic_clamp.test.mjs: OK');
})().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});