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

    // Helper to dynamically load a script into the page
    const loadScript = (url) =>
      new Promise((resolve, reject) => {
        try {
          const s = document.createElement("script");
          s.src = url;
          s.async = false; // preserve order
          s.onload = () => resolve();
          s.onerror = (e) => reject(new Error("Failed to load script: " + url));
          document.head.appendChild(s);
        } catch (e) {
          reject(e);
        }
      });

    // If MediaPipe Hands is not present, load the CDN scripts on demand.
    if (typeof Hands === "undefined") {
      try {
        // Ensure the application has set window.Module.locateFile before loading.
        if (!window.Module || typeof window.Module.locateFile !== "function") {
          // Provide a safe default (cdn) - the app may override this earlier.
          window.Module = window.Module || {};
          window.Module.locateFile = window.Module.locateFile || ((path) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${path}`);
        }
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/hands.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.4/drawing_utils.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
      } catch (e) {
        console.error("MediaPipeline: failed to dynamically load MediaPipe scripts", e);
        throw e;
      }
    }

    if (typeof Hands === "undefined") {
      throw new Error("MediaPipe Hands failed to load");
    }

    // Instantiate Hands and wire results
    this.hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`,
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