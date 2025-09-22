import { test } from "node:test";
import assert from "node:assert/strict";
import CameraManager from "../../src/CameraManager.js";

test("camera mirror default, setMirror and toggleMirror semantics and events", async () => {
  // EventBus spy
  const published = [];
  const mockEventBus = {
    publish(event, payload) {
      published.push({ event, payload });
    },
  };

  // Construct CameraManager with injected eventBus only (mediaDevices not needed for mirror tests)
  const cam = new CameraManager({ eventBus: mockEventBus });

  // Default mirror state expected false
  // This will intentionally fail if the API is not implemented (RED test)
  assert.strictEqual(
    typeof cam.isMirrored === "function" ? cam.isMirrored() : false,
    false,
    "default mirror state should be false"
  );

  // setMirror(true) should update state and emit an event
  if (typeof cam.setMirror !== "function") {
    assert.fail("CameraManager.setMirror not implemented");
  }
  cam.setMirror(true);
  assert.strictEqual(
    cam.isMirrored(),
    true,
    "mirror should be true after setMirror(true)"
  );
  const mirrorTrue = published.find(
    (p) =>
      p.event === "camera.mirror.toggled" &&
      p.payload &&
      p.payload.mirrored === true
  );
  assert(
    mirrorTrue,
    "EventBus should have published camera.mirror.toggled {mirrored:true}"
  );

  // toggleMirror should flip back to false and emit event
  if (typeof cam.toggleMirror !== "function") {
    assert.fail("CameraManager.toggleMirror not implemented");
  }
  const newState = cam.toggleMirror();
  assert.strictEqual(
    newState,
    false,
    "toggleMirror should return false after toggling from true to false"
  );
  const mirrorFalse = published.find(
    (p) =>
      p.event === "camera.mirror.toggled" &&
      p.payload &&
      p.payload.mirrored === false
  );
  assert(
    mirrorFalse,
    "EventBus should have published camera.mirror.toggled {mirrored:false}"
  );
});
