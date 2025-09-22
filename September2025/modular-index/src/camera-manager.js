// camera-manager.js
// Browser-native CameraManager that uses MediaPipe Camera when available,
// otherwise falls back to getUserMedia + requestAnimationFrame.
//
// API:
//   export class CameraManager {
//     constructor(videoEl, options)
//     async start()
//     stop()
//     registerOnFrame(cb)   // cb(videoEl) called each frame
//   }

export class CameraManager {
  constructor(videoEl, options = {}) {
    if (!videoEl) throw new Error("CameraManager requires a video element");
    this.video = videoEl;
    this.options = {
      width: options.width ?? 640,
      height: options.height ?? 480,
      facingMode: options.facingMode ?? "user",
    };
    this._callbacks = [];
    this._running = false;

    // runtime state
    this._camera = null; // MediaPipe Camera instance (if used)
    this._stream = null; // MediaStream when using getUserMedia
    this._rafId = null;
  }

  registerOnFrame(cb) {
    if (typeof cb !== "function") throw new Error("registerOnFrame requires a function");
    this._callbacks.push(cb);
    // return an unsubscribe helper
    return () => {
      this._callbacks = this._callbacks.filter((c) => c !== cb);
    };
  }

  // Start the camera feed. Uses MediaPipe Camera if available (global Camera),
  // otherwise falls back to navigator.mediaDevices.getUserMedia + RAF loop.
  async start() {
    if (this._running) return;
    this._running = true;

    const width = this.options.width;
    const height = this.options.height;
    this.video.width = width;
    this.video.height = height;

    const frameCallback = async () => {
      // Best-effort: call callbacks, but do not await them to avoid blocking.
      for (const cb of Array.from(this._callbacks)) {
        try {
          cb(this.video);
        } catch (err) {
          console.error("CameraManager: onFrame callback error", err);
        }
      }
    };

    // Try getUserMedia first (ensures quick visible preview). If it fails, fall back to MediaPipe Camera.
    // This makes the preview robust in environments where the MediaPipe wasm/assets may be delayed or blocked.
    if (!this.options.forceUseMediaPipeCamera) {
      try {
        this._stream = await navigator.mediaDevices.getUserMedia({
          video: { width, height, facingMode: this.options.facingMode },
          audio: false,
        });
        this.video.srcObject = this._stream;
        // Ensure playback started
        await this.video.play().catch(() => {});
        // Start a simple rAF preview + frame callbacks (same behavior as fallback below)
        const loop = async () => {
          if (!this._running) return;
          await frameCallback();
          this._rafId = requestAnimationFrame(loop);
        };
        loop();
        return;
      } catch (err) {
        console.warn("CameraManager: initial getUserMedia failed (will try MediaPipe Camera):", err);
        this._stream = null;
      }
    }

    // If getUserMedia was unavailable or explicitly disabled, try MediaPipe Camera (if provided)
    if (typeof Camera !== "undefined") {
      try {
        this._camera = new Camera(this.video, {
          onFrame: async () => {
            await frameCallback();
          },
          width,
          height,
          facingMode: this.options.facingMode,
        });
        await this._camera.start();
        // Ensure the video element is playing (some browsers require an explicit play call)
        try {
          if (this.video && this.video.paused) {
            await this.video.play().catch(() => {});
          }
        } catch (e) {
          /* ignore play errors */
        }
        return;
      } catch (err) {
        console.warn("CameraManager: MediaPipe Camera failed, will attempt getUserMedia as fallback", err);
        this._camera = null;
      }
    }

    // Fallback: getUserMedia + rAF loop
    try {
      this._stream = await navigator.mediaDevices.getUserMedia({
        video: { width, height, facingMode: this.options.facingMode },
        audio: false,
      });
      this.video.srcObject = this._stream;
      await this.video.play().catch(() => {});
      const loop = async () => {
        if (!this._running) return;
        await frameCallback();
        this._rafId = requestAnimationFrame(loop);
      };
      loop();
    } catch (err) {
      this._running = false;
      console.error("CameraManager: getUserMedia failed", err);
      throw err;
    }
  }

  // Stop camera and cleanup
  stop() {
    if (!this._running) return;
    this._running = false;

    try {
      if (this._camera && typeof this._camera.stop === "function") {
        this._camera.stop();
      }
    } catch (e) {
      console.debug("CameraManager: error stopping MediaPipe Camera", e);
    }
    this._camera = null;

    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }

    if (this._stream) {
      try {
        this._stream.getTracks().forEach((t) => t.stop());
      } catch (e) {
        console.debug("CameraManager: error stopping stream tracks", e);
      }
      this._stream = null;
    }

    try {
      this.video.pause();
      this.video.srcObject = null;
    } catch (e) {
      // ignore
    }
  }
}