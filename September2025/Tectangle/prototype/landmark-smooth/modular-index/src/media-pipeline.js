// media-pipeline.js
// MediaPipeline wraps MediaPipe Hands model and exposes a small start/stop API.
// It does NOT manage the camera; callers should feed video frames into `sendFrame(video)`.
//
// Usage:
//   const pipeline = new MediaPipeline(videoEl, { onResults: (results) => { ... } });
//   await pipeline.start();
//   // then call pipeline.sendFrame(video) each frame (e.g., from CameraManager)
//   pipeline.stop();

export class MediaPipeline {
  constructor(videoEl, { onResults } = {}) {
    if (!videoEl) throw new Error("MediaPipeline requires a video element");
    this.video = videoEl;
    this.onResults = typeof onResults === "function" ? onResults : () => {};
    this.hands = null;
    this.running = false;
  }

  async start() {
    if (this.running) return;
    if (typeof Hands === "undefined") {
      throw new Error("MediaPipe Hands is not loaded (expected global Hands)");
    }
    this.hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`,
    });
    this.hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    this.hands.onResults((results) => {
      try {
        this.onResults(results);
      } catch (err) {
        console.error("MediaPipeline: onResults handler error", err);
      }
    });
    this.running = true;
  }

  // Send a video frame (HTMLVideoElement or ImageBitmap) to MediaPipe Hands.
  // Returns the promise returned by hands.send (if any).
  async sendFrame(videoOrImage) {
    if (!this.hands) {
      // Soft-fail: caller should start() first
      console.warn("MediaPipeline: sendFrame called before start()");
      return;
    }
    try {
      return await this.hands.send({ image: videoOrImage });
    } catch (err) {
      // Do not throw; log and continue
      console.debug("MediaPipeline: hands.send() error", err);
    }
  }

  stop() {
    this.running = false;
    try {
      if (this.hands && typeof this.hands.close === "function") {
        this.hands.close();
      }
    } catch (e) {
      console.debug("MediaPipeline: error closing hands", e);
    }
    this.hands = null;
  }
}