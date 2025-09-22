import assert from "assert";
import EventBus from "../../src/EventBusManager.js";

describe("EventBusManager — red: publish/subscribe basic", function () {
  it("publishes and subscribes canonical landmark:raw and publishFrom attaches source/meta", function (done) {
    this.timeout(2000);
    const received = [];
    const unsub = EventBus.addEventListener("landmark:raw", (env) => {
      const p = env && env.detail ? env.detail : env;
      received.push(p);
    });

    const payload = {
      landmarks: [[0.1, 0.2, 0.3]],
      frameId: 42,
      timestamp: Date.now(),
    };

    try {
      EventBus.publish("landmark:raw", payload);
    } catch (e) {
      // swallow to allow red test to reveal missing API
    }

    let envFrom;
    try {
      if (typeof EventBus.publishFrom === "function") {
        envFrom = EventBus.publishFrom(
          "CameraManager",
          "landmark:raw",
          payload,
          { sourceMeta: true },
          payload.frameId
        );
      }
    } catch (e) {
      // swallow
    }

    setTimeout(() => {
      try {
        assert.ok(
          received.length >= 1,
          "expected at least one landmark:raw received"
        );
        const p = received[0];
        assert.ok(Array.isArray(p.landmarks), "landmarks should be array");
        assert.strictEqual(p.frameId, 42);

        if (typeof EventBus.publishFrom === "function") {
          // Prefer checking the returned envelope for deterministic semantics
          assert.ok(envFrom, "publishFrom should return an envelope");
          const hasSource =
            envFrom &&
            (envFrom.source ||
              (envFrom.meta &&
                (envFrom.meta.source || envFrom.meta.sourceMeta)) ||
              (envFrom.detail &&
                (envFrom.detail.source ||
                  (envFrom.detail.meta && envFrom.detail.meta.source))));
          assert.ok(
            hasSource,
            "publishFrom should attach source/meta (envelope or detail)"
          );
        }

        if (typeof unsub === "function") unsub();
        done();
      } catch (err) {
        if (typeof unsub === "function") unsub();
        done(err);
      }
    }, 50);
  });
});
