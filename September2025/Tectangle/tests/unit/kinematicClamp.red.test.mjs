import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";

// Attempt to import the manager module (support default or named export)
let ManagerModule;
try {
  ManagerModule = await import("../../src/KinematicClampManager.js");
} catch (err) {
  test("KinematicClampManager present", () => {
    assert.fail(
      "Could not import KinematicClampManager module: " + err.message
    );
  });
  // Stop early; import failed (test runner will report this)
  throw err;
}

const ManagerCtor =
  ManagerModule?.default ??
  ManagerModule?.KinematicClampManager ??
  ManagerModule?.KinematicClamp ??
  null;

test("KinematicClampManager detects teleporting frames (red)", async (t) => {
  assert.ok(
    ManagerCtor,
    "KinematicClampManager export not found; implement/export the manager."
  );

  // Simple event-bus stub using Node EventEmitter
  const bus = new EventEmitter();

  // Try to construct manager; be permissive about factory vs constructor signatures
  let manager;
  try {
    // common pattern: new Manager({ eventBus })
    manager = new ManagerCtor({ eventBus: bus });
  } catch (e1) {
    try {
      // alternative: ManagerCtor.create({ eventBus })
      if (typeof ManagerCtor.create === "function") {
        manager = ManagerCtor.create({ eventBus: bus });
      } else {
        // fallback: call as a factory
        manager = ManagerCtor({ eventBus: bus });
      }
    } catch (e2) {
      assert.fail(
        "Failed to instantiate KinematicClampManager: " +
          (e2.message || e1.message)
      );
    }
  }

  assert.ok(manager, "KinematicClampManager instance could not be created.");

  // Use setConfig/start if available to reduce false negatives in some implementations
  if (typeof manager.setConfig === "function") {
    manager.setConfig({ teleportThreshold: 1.0 });
  }
  if (typeof manager.start === "function") {
    await manager.start();
    // Ensure subscriptions are registered before we emit frames (avoid edge races).
    await new Promise((resolve) => setImmediate(resolve));
  }

  // Listen for the defensive/physics-implausible event.
  let flagged = false;
  bus.on("plausibility:physics.fail", (payload) => {
    flagged = true;
  });
  bus.on("landmark:physicsimplausible", (payload) => {
    flagged = true;
  });

  // Helper: construct a minimal landmark payload consistent with prototype/golden-master shape.
  const makeFrame = (sampleIndex, wristX) => ({
    sampleIndex,
    timestamp: Date.now() + sampleIndex,
    hands: [
      {
        handIndex: 0,
        handedness: "Right",
        // 21 landmarks; set wrist (index 0) to wristX; other landmarks near wrist
        smooth: Array.from({ length: 21 }, (_, i) =>
          i === 0
            ? [wristX, 0.5, 0]
            : [wristX + 0.01 * (i / 5), 0.5 + 0.005 * i, 0]
        ),
      },
    ],
  });

  // Emit frames: normal, normal, teleport (impossible), normal
  bus.emit("landmark:smoothed", makeFrame(0, 0.5));
  bus.emit("landmark:smoothed", makeFrame(1, 0.51));
  // Teleport: wrist jumps by a huge amount (impossible physics)
  bus.emit("landmark:smoothed", makeFrame(2, 9.5));
  bus.emit("landmark:smoothed", makeFrame(3, 0.49));

  // Allow some time for async processing
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Cleanup if available
  if (typeof manager.stop === "function") {
    await manager.stop();
  }
  if (typeof manager.destroy === "function") {
    await manager.destroy();
  }

  // Assertion: the manager should have emitted a physics-implausible violation
  assert.ok(
    flagged,
    "Expected landmark:physicsimplausible to be emitted for teleporting frames (no detection observed)."
  );
});
