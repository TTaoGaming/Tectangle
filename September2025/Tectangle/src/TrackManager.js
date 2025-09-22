/* EARS_HEADER_START
TLDR: TrackManager — minimal scaffold to manage short-lived tracks from landmark:smoothed and provide placeholders for prediction, association, update, and retirement.

Responsibilities:
- Subscribe to `landmark:smoothed` and represent pipeline stage raw -> smoothed -> kinematic -> tracked.
- Provide minimal, testable stubs for predict/associate/update/create/retire.
- Expose runtime config and simple `tracks:updated` publish placeholder.
- Keep implementation light-weight and side-effect free at import time.

HEADER_META_START
{
  "name": "TrackManager",
  "tldr": "Manage short-lived landmark tracks (scaffold).",
  "version": "0.1.0",
  "configDefaults": {
    "maxTracks": 4,
    "maxAgeFrames": 5,
    "associationThreshold": 0.15,
    "kalmanProcessNoise": 0.001,
    "kalmanMeasurementNoise": 0.01,
    "publishEvent": "tracks:updated"
  }
}
HEADER_META_END
EARS_HEADER_END */

import defaultEventBus from "./EventBusManager.js";

/**
 * TrackManager (scaffold)
 *
 * Minimal, safe implementation intended to provide an end-to-end pipeline placeholder:
 * raw -> smoothed -> kinematic -> tracked.
 *
 * No Kalman/Hungarian implementations here — those will be added later behind tests.
 */

// Pure helpers (named exports) for testability
export function computeCentroid(landmarks = []) {
  if (!Array.isArray(landmarks) || landmarks.length === 0) {
    return { x: 0, y: 0, z: 0 };
  }
  let sx = 0,
    sy = 0,
    sz = 0,
    n = 0;
  for (let i = 0; i < landmarks.length; i++) {
    const p = landmarks[i];
    let x = 0,
      y = 0,
      z = 0;
    if (Array.isArray(p)) {
      x = Number(p[0] || 0);
      y = Number(p[1] || 0);
      z = Number(p[2] || 0);
    } else if (p && typeof p === "object") {
      x = Number(p.x || 0);
      y = Number(p.y || 0);
      z = Number(p.z || 0);
    } else {
      continue;
    }
    sx += x;
    sy += y;
    sz += z;
    n += 1;
  }
  if (n === 0) return { x: 0, y: 0, z: 0 };
  return { x: sx / n, y: sy / n, z: sz / n };
}

export function associateByDistance(
  detections = [],
  tracks = [],
  threshold = Infinity
) {
  // Normalize detection centroids
  const detCentroids = detections.map((d) =>
    computeCentroid(d && d.landmarks ? d.landmarks : d)
  );
  const trackCentroids = tracks.map((t) =>
    t && t.centroid
      ? t.centroid
      : computeCentroid(t && t.landmarks ? t.landmarks : t)
  );
  const pairs = [];
  for (let di = 0; di < detCentroids.length; di++) {
    for (let ti = 0; ti < trackCentroids.length; ti++) {
      const a = detCentroids[di];
      const b = trackCentroids[ti];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dz = (a.z || 0) - (b.z || 0);
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      pairs.push({ di, ti, dist });
    }
  }
  // Greedy assignment by shortest distance (very small, safe heuristic)
  pairs.sort((a, b) => a.dist - b.dist);
  const assignedDet = new Set();
  const assignedTrack = new Set();
  const assignments = [];
  for (let i = 0; i < pairs.length; i++) {
    const p = pairs[i];
    if (assignedDet.has(p.di) || assignedTrack.has(p.ti)) continue;
    if (p.dist <= threshold) {
      const track = tracks[p.ti];
      assignments.push({
        trackId: track ? track.id : null,
        trackIndex: p.ti,
        detectionIndex: p.di,
        distance: p.dist,
      });
      assignedDet.add(p.di);
      assignedTrack.add(p.ti);
    }
  }
  return assignments;
}

export default class TrackManager {
  constructor(options = {}) {
    const { eventBus, ...cfg } = options || {};
    const defaults = {
      maxTracks: 4,
      maxAgeFrames: 5,
      associationThreshold: 0.15,
      kalmanProcessNoise: 0.001,
      kalmanMeasurementNoise: 0.01,
      publishEvent: "tracks:updated",
    };
    this._eventBus = eventBus || defaultEventBus;
    this._cfg = Object.assign({}, defaults, cfg || {});
    this._tracks = []; // internal track representations
    this._listener = null;
    this._running = false;
    this._nextId = 1;
  }

  start() {
    if (this._running) return { ok: true };
    if (
      !this._eventBus ||
      typeof this._eventBus.addEventListener !== "function"
    )
      return { ok: false, error: "eventBus missing or invalid" };
    this._listener = this._eventBus.addEventListener(
      "landmark:smoothed",
      (env) => this._onSmoothed(env && env.detail ? env.detail : env)
    );
    this._running = true;
    return { ok: true };
  }

  stop() {
    try {
      if (this._listener) this._listener();
    } catch (e) {
      // ignore
    }
    this._listener = null;
    this._running = false;
  }

  _onSmoothed(payload) {
    if (!payload) return;
    const rawLandmarks = payload.landmarks || [];
    // Support single canonical hand payloads for now. Future: multi-detection input.
    const detections = [];
    if (Array.isArray(rawLandmarks) && rawLandmarks.length > 0) {
      detections.push({
        landmarks: rawLandmarks,
        centroid: computeCentroid(rawLandmarks),
      });
    }

    // Pipeline steps (minimal, safe placeholders)
    this.predictAll();
    const assignments = this.associate(detections || []);

    // Update matched tracks
    const assignedDetections = new Set();
    for (const a of assignments) {
      if (!a || typeof a.trackId === "undefined") continue;
      const track = this._tracks.find((t) => t.id === a.trackId);
      const det = detections[a.detectionIndex];
      if (track && det) {
        this.updateTrack(track, det, payload.frameId, payload.timestamp);
        assignedDetections.add(a.detectionIndex);
      }
    }

    // Create new tracks for unassigned detections (simple placeholder behavior)
    for (let i = 0; i < detections.length; i++) {
      if (assignedDetections.has(i)) continue;
      if (this._tracks.length >= this._cfg.maxTracks) break;
      this.createTrack(detections[i], payload.frameId, payload.timestamp);
    }

    // Retire old tracks
    this.retireOldTracks();

    // Publish a lightweight snapshot so consumers can observe track list (non-blocking)
    try {
      if (this._eventBus && this._cfg.publishEvent) {
        this._eventBus.publish(this._cfg.publishEvent, {
          tracks: this.getTracks(),
          frameId: payload.frameId || null,
          timestamp: payload.timestamp || Date.now(),
          meta: { source: "track-manager" },
        });
      }
    } catch (e) {
      // swallow publish errors to avoid crashing consumers
    }
  }

  predictAll() {
    // Placeholder: increment ageFrames for each track (a very small, safe prediction stub)
    for (const t of this._tracks) {
      t.ageFrames = (t.ageFrames || 0) + 1;
      t._lastPredicted = Date.now();
    }
  }

  associate(detections = []) {
    // Use the exported nearest-neighbor helper; returns assignments with trackId and detectionIndex
    return associateByDistance(
      detections,
      this._tracks,
      Number(this._cfg.associationThreshold)
    );
  }

  createTrack(detection, frameId = null, timestamp = Date.now()) {
    const landmarks =
      detection && detection.landmarks ? detection.landmarks : detection || [];
    const t = {
      id: this._nextId++,
      landmarks,
      centroid: computeCentroid(landmarks),
      lastSeenFrame: frameId,
      lastSeenTimestamp: timestamp,
      ageFrames: 0,
      state: "active",
    };
    this._tracks.push(t);
    return t;
  }

  updateTrack(track, detection, frameId = null, timestamp = Date.now()) {
    if (!track) return null;
    const landmarks =
      detection && detection.landmarks ? detection.landmarks : detection || [];
    track.landmarks = landmarks;
    track.centroid = computeCentroid(landmarks);
    track.lastSeenFrame = frameId;
    track.lastSeenTimestamp = timestamp;
    track.ageFrames = 0;
    return track;
  }

  retireOldTracks() {
    const maxAge = Number(this._cfg.maxAgeFrames) || 5;
    const before = this._tracks.length;
    this._tracks = this._tracks.filter((t) => (t.ageFrames || 0) < maxAge);
    return this._tracks.length !== before;
  }

  getTracks() {
    // Return a shallow copy to avoid external mutation of internal state
    return this._tracks.map((t) => Object.assign({}, t));
  }

  setConfig(cfg = {}) {
    if (!cfg || typeof cfg !== "object") return this._cfg;
    this._cfg = Object.assign({}, this._cfg, cfg || {});
    return this._cfg;
  }

  destroy() {
    this.stop();
    this._tracks = [];
    this._cfg = null;
    this._eventBus = null;
  }
}
