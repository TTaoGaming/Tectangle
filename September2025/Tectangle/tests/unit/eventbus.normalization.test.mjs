import assert from "assert";
import EventBus from "../../src/EventBusManager.js";

describe("EventBusManager — normalization", function () {
  it("publishFrom returns envelope with source/meta in envelope and detail", function () {
    const payload = { landmarks: [], frameId: 123 };
    const env = EventBus.publishFrom(
      "CameraManager",
      "landmark:raw",
      payload,
      { extra: "x" },
      payload.frameId
    );

    assert.ok(env, "publishFrom should return an envelope");
    assert.strictEqual(env.source, "CameraManager", "envelope.source");
    assert.ok(
      env.meta && env.meta.source === "CameraManager",
      "envelope.meta.source"
    );
    assert.ok(env.detail, "envelope.detail exists");
    assert.strictEqual(env.detail.source, "CameraManager", "detail.source");
    assert.ok(
      env.detail.meta && env.detail.meta.source === "CameraManager",
      "detail.meta.source"
    );

    // immutability check only when NODE_ENV === 'test'
    if (
      typeof process !== "undefined" &&
      process.env &&
      process.env.NODE_ENV === "test"
    ) {
      try {
        env.detail.source = "mutated";
      } catch (e) {
        // expected in strict frozen mode
      }
      assert.strictEqual(
        env.detail.source,
        "CameraManager",
        "detail.source should be frozen in test mode"
      );
    }
  });
});
