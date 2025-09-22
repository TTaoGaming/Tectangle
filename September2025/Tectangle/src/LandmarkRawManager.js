/* EARS_HEADER_START
TLDR: Produce canonical landmark:raw payloads (MediaPipe or deterministic) with runtime configurable pipeline settings.
Executive summary:
Produce canonical landmark:raw payloads consumed by downstream managers. Operates with MediaPipe Hands when available (browser) or deterministic synthetic output in Node/tests for deterministic behavior. Exposes runtime pipeline settings and echoes incoming config for payload traceability.
5W1H:
- Who: LandmarkRawManager — pipeline input manager
- What: publish `landmark:raw` (landmarks array, frameId, timestamp, width, height, config, handsCount)
- When: on MediaPipe results (hands.onResults) or on camera:frame for synthetic path
- Where: browser (with MediaPipe) and Node (tests/smoke)
- Why: normalize landmarks and gate low-confidence detections
- How: MediaPipe Hands API or deterministic generator
Responsibilities:
- Publish `landmark:raw` with normalized landmarks or empty envelope when no or low-confidence hand detected
- Merge and echo configuration via `landmarkraw.config` and `setConfig`
- Update MediaPipe Hands options at runtime when available
API summary:
- constructor(options) — options: { eventBus, useMediaPipe, videoElement, modelComplexity, maxNumHands, maxLandmarks, minDetectionConfidence, minTrackingConfidence }
- setConfig(cfg) — merge config and update MediaPipe options when available
- setVideoElement(el), destroy()
HEADER_META_START
{
  "name": "LandmarkRawManager",
  "tldr": "Produce canonical landmark:raw payloads (MediaPipe or deterministic) with runtime configurable pipeline settings.",
  "version": "0.1.0",
  "configDefaults": {"modelComplexity":1,"maxNumHands":2,"maxLandmarks":21,"minDetectionConfidence":0.5,"minTrackingConfidence":0.5},
  "generatedFrom": "August Tectangle Sprint/tectangle-gesture-keyboard-mobile/docs/header_template_2025-08-28T154621Z.md"
}
HEADER_META_END
EARS_HEADER_END */

import defaultEventBus from "./EventBusManager.js";

export default class LandmarkRawManager {
  constructor(options = {}) {
    const {
      eventBus,
      useMediaPipe = false,
      videoElement = null,
      modelComplexity = 1,
      maxNumHands = 2,
      minDetectionConfidence = 0.5,
      minTrackingConfidence = 0.5,
      maxLandmarks = 21,
    } = options || {};

    this._eventBus = eventBus || defaultEventBus;
    this._useMediaPipe = !!useMediaPipe;
    this._videoEl = videoElement || null;
    // ensure numeric modelComplexity and sensible defaults
    this._modelComplexity = Number.isFinite(Number(modelComplexity))
      ? Number(modelComplexity)
      : 1;
    this._config = {
      modelComplexity: this._modelComplexity,
      pipeline: "hands",
      maxNumHands: Number.isFinite(Number(maxNumHands))
        ? Math.min(4, Math.max(1, Number(maxNumHands)))
        : 2,
      maxLandmarks: Number.isFinite(Number(maxLandmarks))
        ? Number(maxLandmarks)
        : 21,
      minDetectionConfidence: Number.isFinite(Number(minDetectionConfidence))
        ? Number(minDetectionConfidence)
        : 0.5,
      minTrackingConfidence: Number.isFinite(Number(minTrackingConfidence))
        ? Number(minTrackingConfidence)
        : 0.5,
    };

    // runtime state
    this._frameCounter = 0;
    this._hands = null;
    this._handsLoopHandle = null;
    this._lastReceivedConfig = null; // raw config as last received via setConfig (echoed back to consumers)

    // bind handlers
    this._onSetConfig = this._onSetConfig.bind(this);
    this._onCameraFrame = this._onCameraFrame.bind(this);
    this._onHandsResults = this._onHandsResults.bind(this);

    // subscribe to control channels
    try {
      this._eventBus.addEventListener(
        "landmarkraw.setConfig",
        this._onSetConfig
      );
      this._eventBus.addEventListener("camera:frame", this._onCameraFrame);
    } catch (err) {
      if (typeof console !== "undefined")
        console.error("LandmarkRawManager subscription failed", err);
    }

    // If requested, attempt to init MediaPipe (deferred to allow CDN scripts to load)
    if (this._useMediaPipe) {
      if (this._videoEl) {
        setTimeout(() => this._initMediaPipeIfAvailable(), 0);
      } else {
        console.debug(
          "LandmarkRawManager: useMediaPipe requested but no videoElement provided"
        );
      }
    }
  }

  // Merge and echo config
  _onSetConfig(envelope) {
    const payload = envelope && envelope.detail ? envelope.detail : envelope;
    if (payload && typeof payload === "object" && payload.config) {
      // Keep raw incoming config for echoing back to consumers and attaching to landmark payloads.
      const incomingConfig =
        typeof payload.config === "object"
          ? Object.assign({}, payload.config)
          : payload.config;

      // Store raw config for use by published landmark payloads BEFORE notifying listeners.
      // This ensures any synchronous listeners (which may immediately publish camera:frame)
      // will observe the raw config when the manager produces landmark:raw.
      this._lastReceivedConfig = incomingConfig;

      // Publish raw config (echo original values)
      try {
        this._eventBus.publish("landmarkraw.config", {
          config: incomingConfig,
          timestamp: Date.now(),
        });
      } catch (err) {
        /* swallow */
      }

      // Merge incoming config into internal normalized config and coerce numeric fields
      this._config = Object.assign({}, this._config, payload.config);

      // Ensure numeric modelComplexity
      if (payload.config.modelComplexity !== undefined) {
        const mc = Number(this._config.modelComplexity);
        this._modelComplexity = Number.isFinite(mc)
          ? mc
          : this._modelComplexity;
        this._config.modelComplexity = this._modelComplexity;
      } else {
        this._config.modelComplexity = Number.isFinite(
          Number(this._config.modelComplexity)
        )
          ? Number(this._config.modelComplexity)
          : this._modelComplexity;
      }

      // Ensure numeric/max defaults for other fields
      this._config.maxLandmarks = Number.isFinite(
        Number(this._config.maxLandmarks)
      )
        ? Number(this._config.maxLandmarks)
        : 21;

      // Ensure maxNumHands numeric and clamp to [1,4]
      this._config.maxNumHands = Number.isFinite(
        Number(this._config.maxNumHands)
      )
        ? Math.min(4, Math.max(1, Number(this._config.maxNumHands)))
        : 2;

      this._config.minDetectionConfidence = Number.isFinite(
        Number(this._config.minDetectionConfidence)
      )
        ? Number(this._config.minDetectionConfidence)
        : 0.5;
      this._config.minTrackingConfidence = Number.isFinite(
        Number(this._config.minTrackingConfidence)
      )
        ? Number(this._config.minTrackingConfidence)
        : 0.5;

      // If MediaPipe Hands is active, update runtime options
      if (this._hands) {
        const updatedOptions = {
          maxNumHands: Number(this._config.maxNumHands) || 1,
          modelComplexity: Number(this._config.modelComplexity) || 1,
          minDetectionConfidence:
            Number(this._config.minDetectionConfidence) || 0.5,
          minTrackingConfidence:
            Number(this._config.minTrackingConfidence) || 0.5,
        };
        try {
          this._hands.setOptions(updatedOptions);
          console.debug(
            "LandmarkRawManager: updated hands options",
            updatedOptions
          );
        } catch (err) {
          console.debug(
            "LandmarkRawManager: failed to update hands options",
            err
          );
        }
      }
    }
  }

  // Deterministic fallback for Node/tests — ignored when useMediaPipe=true
  _onCameraFrame(envelope) {
    if (this._useMediaPipe) return;
    const frame = envelope && envelope.detail ? envelope.detail : envelope;
    if (!frame) return;
    const count = Number(this._config.maxLandmarks) || 21;
    const landmarks = [];
    const base = Number(frame.frameId) || Date.now();
    for (let i = 0; i < count; i++) {
      const angle = (((i + base) * 0.61803398875) % 1) * Math.PI * 2;
      const r = 0.2 + (i / count) * 0.6;
      const x = 0.5 + r * Math.cos(angle);
      const y = 0.5 + r * Math.sin(angle);
      const z = 0.5 + ((i % 5) - 2) * 0.02;
      landmarks.push([
        Number(x.toFixed(6)),
        Number(y.toFixed(6)),
        Number(z.toFixed(6)),
      ]);
    }
    const payload = {
      landmarks,
      frameId: frame.frameId || null,
      timestamp: Date.now(),
      width: frame.width || null,
      height: frame.height || null,
      config: this._lastReceivedConfig || this._config,
    };
    try {
      this._eventBus.publish("landmark:raw", payload);
    } catch (err) {
      /* swallow */
    }
  }

  // Initialize MediaPipe Hands if available in browser scope
  _initMediaPipeIfAvailable() {
    if (typeof window === "undefined") {
      console.debug(
        "LandmarkRawManager: not in browser - MediaPipe unavailable"
      );
      return;
    }
    if (typeof Hands === "undefined") {
      console.debug("LandmarkRawManager: MediaPipe Hands global missing");
      return;
    }
    try {
      this._hands = new Hands({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`,
      });
      const initialOptions = {
        maxNumHands: Number(this._config.maxNumHands) || 1,
        modelComplexity: Number.isFinite(Number(this._config.modelComplexity))
          ? Number(this._config.modelComplexity)
          : this._modelComplexity,
        minDetectionConfidence: Number.isFinite(
          Number(this._config.minDetectionConfidence)
        )
          ? Number(this._config.minDetectionConfidence)
          : 0.5,
        minTrackingConfidence: Number.isFinite(
          Number(this._config.minTrackingConfidence)
        )
          ? Number(this._config.minTrackingConfidence)
          : 0.5,
      };
      this._hands.setOptions(initialOptions);
      console.debug(
        "LandmarkRawManager: updated hands options",
        initialOptions
      );
      this._hands.onResults(this._onHandsResults);
      this._startHandsLoop();
      console.debug("LandmarkRawManager: MediaPipe Hands initialized");
    } catch (err) {
      console.debug("LandmarkRawManager: MediaPipe init failed", err);
    }
  }

  // RequestAnimationFrame loop that pushes video frames into MediaPipe Hands
  async _handsLoop() {
    if (!this._hands || !this._videoEl) return;
    try {
      if (this._videoEl.readyState >= 2) {
        await this._hands.send({ image: this._videoEl });
      }
    } catch (err) {
      console.debug("LandmarkRawManager: hands.send error", err);
    } finally {
      this._handsLoopHandle = requestAnimationFrame(() => this._handsLoop());
    }
  }

  _startHandsLoop() {
    if (this._handsLoopHandle) return;
    this._handsLoopHandle = requestAnimationFrame(() => this._handsLoop());
  }
  _stopHandsLoop() {
    if (this._handsLoopHandle) {
      try {
        cancelAnimationFrame(this._handsLoopHandle);
      } catch (e) {}
      this._handsLoopHandle = null;
    }
    if (this._hands) {
      try {
        if (typeof this._hands.close === "function") this._hands.close();
      } catch (e) {}
      this._hands = null;
    }
  }

  // Handler called by MediaPipe Hands with results
  _onHandsResults(results) {
    const handsCount = results?.multiHandLandmarks?.length || 0;
    console.debug(
      "LandmarkRawManager: _onHandsResults — handsCount:",
      handsCount
    );
    this._frameCounter = (this._frameCounter || 0) + 1;

    if (handsCount === 0) {
      // publish an empty envelope so listeners can react
      const payload = {
        landmarks: [],
        frameId: this._frameCounter,
        timestamp: Date.now(),
        width: this._videoEl ? this._videoEl.videoWidth || null : null,
        height: this._videoEl ? this._videoEl.videoHeight || null : null,
        config: this._lastReceivedConfig || this._config,
        handsCount: 0,
      };
      try {
        console.debug("LandmarkRawManager: publishing landmark:raw", {
          frameId: payload.frameId,
          landmarksCount: 0,
        });
        this._eventBus.publish("landmark:raw", payload);
      } catch (err) {
        /* swallow */
      }
      return;
    }

    // Collect detection scores for each detected hand
    const scores = [];
    for (let i = 0; i < handsCount; i++) {
      scores[i] = results?.multiHandedness?.[i]?.score ?? 0;
    }

    const minDetect = Number.isFinite(
      Number(this._config.minDetectionConfidence)
    )
      ? Number(this._config.minDetectionConfidence)
      : 0.5;

    const filteredIndices = [];
    for (let i = 0; i < scores.length; i++) {
      if (scores[i] >= minDetect) filteredIndices.push(i);
    }

    if (filteredIndices.length === 0) {
      const bestScore = scores.reduce((a, b) => Math.max(a, b), 0);
      console.debug(
        "LandmarkRawManager: filtering low-confidence result (bestScore)",
        bestScore
      );
      // Publish an empty canonical envelope (include handsCount + echoed config) instead of publishing low-confidence landmarks.
      const payload = {
        landmarks: [],
        frameId: this._frameCounter,
        timestamp: Date.now(),
        width: this._videoEl ? this._videoEl.videoWidth || null : null,
        height: this._videoEl ? this._videoEl.videoHeight || null : null,
        config: this._lastReceivedConfig || this._config,
        handsCount: handsCount,
      };
      try {
        console.debug(
          "LandmarkRawManager: publishing landmark:raw (filtered)",
          {
            frameId: payload.frameId,
            handsCount,
          }
        );
        this._eventBus.publish("landmark:raw", payload);
      } catch (err) {
        /* swallow */
      }
      return;
    }

    // Choose best hand index among filteredIndices by highest score
    let bestIndex = filteredIndices[0];
    let bestScore = scores[bestIndex];
    for (const idx of filteredIndices) {
      const s = scores[idx];
      if (s > bestScore) {
        bestScore = s;
        bestIndex = idx;
      }
    }

    const lm = results?.multiHandLandmarks?.[bestIndex];
    if (!lm || !Array.isArray(lm) || lm.length === 0) {
      // fallback to empty envelope
      const payload = {
        landmarks: [],
        frameId: this._frameCounter,
        timestamp: Date.now(),
        width: this._videoEl ? this._videoEl.videoWidth || null : null,
        height: this._videoEl ? this._videoEl.videoHeight || null : null,
        config: this._config,
        handsCount: handsCount,
      };
      try {
        this._eventBus.publish("landmark:raw", payload);
      } catch (err) {
        /* swallow */
      }
      return;
    }

    const landmarksArray = lm
      .slice(0, Number(this._config.maxLandmarks) || 21)
      .map((p) => [Number(p.x), Number(p.y), Number(p.z ?? 0)]);
    const payload = {
      landmarks: landmarksArray,
      frameId: this._frameCounter,
      timestamp: Date.now(),
      width: this._videoEl ? this._videoEl.videoWidth || null : null,
      height: this._videoEl ? this._videoEl.videoHeight || null : null,
      config: this._lastReceivedConfig || this._config,
      handsCount: handsCount,
    };
    try {
      console.debug(
        "LandmarkRawManager: publishing landmark:raw (handIndex,score)",
        bestIndex,
        bestScore
      );
      this._eventBus.publish("landmark:raw", payload);
    } catch (err) {
      /* swallow */
    }
  }

  // Allow attaching a video element after construction
  setVideoElement(videoEl) {
    this._videoEl = videoEl;
    if (this._useMediaPipe && this._videoEl) {
      setTimeout(() => this._initMediaPipeIfAvailable(), 0);
    }
  }

  // Public API: programmatic config
  setConfig(cfg) {
    this._onSetConfig({ detail: { config: cfg } });
  }

  // Cleanup method
  destroy() {
    this._stopHandsLoop();
    try {
      this._eventBus.publish("landmarkraw.destroyed", { ts: Date.now() });
    } catch (e) {}
  }
}
