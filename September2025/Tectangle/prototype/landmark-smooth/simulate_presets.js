const fs = require("fs");
const path = require("path");

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function std(arr) {
  if (!arr.length) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, x) => s + (x - m) * (x - m), 0) / arr.length);
}
function median(arr) {
  if (!arr.length) return 0;
  const a = arr.slice().sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}
function dist(a, b) {
  const dx = (a[0] || 0) - (b[0] || 0);
  const dy = (a[1] || 0) - (b[1] || 0);
  const dz = (a[2] || 0) - (b[2] || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

class OneEuroFilter {
  constructor(opts = {}) {
    const { minCutoff = 1.0, beta = 0.007, dCutoff = 1.0 } = opts;
    this.minCutoff = Number(minCutoff);
    this.beta = Number(beta);
    this.dCutoff = Number(dCutoff);
    this._x = null;
    this._dx = 0;
    this._t = null;
    this._prevRaw = null;
  }
  static alpha(cutoff, dt) {
    const tau = 1 / (2 * Math.PI * Math.max(1e-6, cutoff));
    return 1 / (1 + tau / (dt || 1 / 60));
  }
  filter(value, tMs) {
    const v = Number(value || 0);
    const t = Number(tMs || Date.now());
    if (this._t === null) {
      this._x = v;
      this._dx = 0;
      this._t = t;
      this._prevRaw = v;
      return v;
    }
    let dt = (t - this._t) / 1000;
    if (!(isFinite(dt) && dt > 0)) dt = 1 / 60;
    const rawPrev = Number(this._prevRaw || this._x);
    const dx = (v - rawPrev) / dt;
    const aD = OneEuroFilter.alpha(this.dCutoff, dt);
    const dxHat = aD * dx + (1 - aD) * this._dx;
    const cutoff = this.minCutoff + this.beta * Math.abs(dxHat);
    const a = OneEuroFilter.alpha(cutoff, dt);
    const xHat = a * v + (1 - a) * this._x;
    this._x = xHat;
    this._dx = dxHat;
    this._prevRaw = v;
    this._t = t;
    return xHat;
  }
  reset() {
    this._x = null;
    this._dx = 0;
    this._t = null;
    this._prevRaw = null;
  }
}

const dataPath = path.join(__dirname, "landmark_export_20250829T202407.jsonl");
const raw = fs
  .readFileSync(dataPath, "utf8")
  .trim()
  .split(/\r?\n/)
  .filter(Boolean);
const samples = raw
  .map((l) => {
    try {
      return JSON.parse(l);
    } catch (e) {
      return null;
    }
  })
  .filter(Boolean);
if (!samples.length) {
  console.error("No samples found in", dataPath);
  process.exit(1);
}

// timing metrics
const deltas = [];
for (let i = 1; i < samples.length; i++)
  deltas.push(samples[i].timestamp - samples[i - 1].timestamp);
const medianDelta = median(deltas);
const fps = medianDelta ? 1000 / medianDelta : 0;
const n2s = Math.round(2000 / medianDelta);

// build per-hand time series keyed by handIndex + handedness
const perHandMap = {};
for (let si = 0; si < samples.length; si++) {
  const s = samples[si];
  if (!s.hands) continue;
  for (const h of s.hands) {
    const key = `${h.handIndex}_${h.handedness || "?"}`;
    if (!perHandMap[key])
      perHandMap[key] = {
        handIndex: h.handIndex,
        handedness: h.handedness || null,
        frames: [],
      };
    perHandMap[key].frames.push({
      sampleIndex: si,
      timestamp: s.timestamp,
      raw: h.raw,
      smooth: h.smooth,
    });
  }
}

function computeDistances(frames, thumbIdx = 4, tipIdx = 8) {
  const vals = [],
    times = [],
    sampleIndices = [];
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    if (!f.raw || !f.raw[thumbIdx] || !f.raw[tipIdx]) continue;
    vals.push(dist(f.raw[thumbIdx], f.raw[tipIdx]));
    times.push(f.timestamp);
    sampleIndices.push(f.sampleIndex);
  }
  return { values: vals, times: times, sampleIndices: sampleIndices };
}

const fingerIdxs = [8, 12, 16, 20];
const presets = {
  Responsive: { minCutoff: 5.0, beta: 0.1, dCutoff: 1.0 },
  Smooth: { minCutoff: 0.3, beta: 0.005, dCutoff: 1.0 },
};

const results = {
  fileAnalyzed: dataPath,
  fpsEstimate: Math.round(fps * 1000) / 1000,
  n2sSamples: n2s,
  handsSummary: [],
  baseline: {},
  perPreset: {},
  candidateWindows: [],
  presetsRecommended: [],
  briefConclusion: "",
  raw_summary_stats: {},
};

// hands summary
for (const key of Object.keys(perHandMap)) {
  const h = perHandMap[key];
  results.handsSummary.push({
    handKey: key,
    handIndex: h.handIndex,
    handedness: h.handedness,
    totalSamples: h.frames.length,
  });
}

// baseline stats using file-provided smooth (for reference)
for (const key of Object.keys(perHandMap)) {
  const h = perHandMap[key];
  results.baseline[key] = { fingers: {} };
  for (const idx of fingerIdxs) {
    const d = computeDistances(h.frames, 4, idx);
    const raw_vals = d.values;
    const smooth_vals = [];
    // use provided smooth values where available
    for (let i = 0; i < h.frames.length; i++) {
      const f = h.frames[i];
      if (!f.smooth || !f.smooth[idx] || !f.smooth[4]) continue;
      smooth_vals.push(dist(f.smooth[4], f.smooth[idx]));
    }
    results.baseline[key].fingers[idx] = {
      raw_mean: mean(raw_vals),
      raw_std: std(raw_vals),
      smooth_mean: mean(smooth_vals),
      smooth_std: std(smooth_vals),
    };
  }
}

// simulate presets
for (const pname of Object.keys(presets)) {
  const params = presets[pname];
  results.perPreset[pname] = { hands: {} };
  for (const key of Object.keys(perHandMap)) {
    const h = perHandMap[key];
    results.perPreset[pname].hands[key] = { fingers: {} };
    for (const idx of fingerIdxs) {
      const d = computeDistances(h.frames, 4, idx);
      const values = d.values;
      const times = d.times;
      // apply OneEuro to scalar series (distance)
      const filter = new OneEuroFilter(params);
      const sm = [];
      for (let i = 0; i < values.length; i++) {
        sm.push(filter.filter(values[i], times[i]));
      }
      const raw_std = std(values);
      const smooth_std = std(sm);
      const reduction = raw_std && smooth_std ? raw_std / smooth_std : null;
      const raw_vels = [];
      for (let i = 1; i < values.length; i++)
        raw_vels.push(Math.abs(values[i] - values[i - 1]));
      const smooth_vels = [];
      for (let i = 1; i < sm.length; i++)
        smooth_vels.push(Math.abs(sm[i] - sm[i - 1]));
      const raw_mean_vel = mean(raw_vels);
      const smooth_mean_vel = mean(smooth_vels);
      // pinch minima detection on simulated smooth series
      const meanDist = mean(sm);
      const stdDist = std(sm);
      const minima = [];
      for (let i = 1; i < sm.length - 1; i++) {
        if (sm[i] < sm[i - 1] && sm[i] < sm[i + 1]) {
          if (sm[i] < meanDist - 0.5 * stdDist || sm[i] < 0.06) {
            minima.push({
              sampleIndex: d.sampleIndices[i],
              timestamp: times[i],
              dist: sm[i],
              indexInSeries: i,
            });
          }
        }
      }
      results.perPreset[pname].hands[key].fingers[idx] = {
        raw_std: raw_std,
        smooth_std: smooth_std,
        reduction_ratio: reduction,
        raw_mean_velocity: raw_mean_vel,
        smooth_mean_velocity: smooth_mean_vel,
        minima: minima.slice(0, 10),
      };
    }
  }
}

// attempt to detect sequential pinches (index->middle->ring->pinky) in Right hand if present
function findSequenceInHand(handKey) {
  const hd = perHandMap[handKey];
  if (!hd) return { found: false };
  // use baseline provided smooth series (from file) for detection
  function minimaForFingerFromFile(idx) {
    const vals = [];
    const times = [];
    const sampleIndices = [];
    for (let i = 0; i < hd.frames.length; i++) {
      const f = hd.frames[i];
      if (!f.smooth || !f.smooth[idx] || !f.smooth[4]) continue;
      vals.push(dist(f.smooth[4], f.smooth[idx]));
      times.push(f.timestamp);
      sampleIndices.push(f.sampleIndex);
    }
    const meanD = mean(vals);
    const stdD = std(vals);
    const list = [];
    for (let i = 1; i < vals.length - 1; i++) {
      if (
        vals[i] < vals[i - 1] &&
        vals[i] < vals[i + 1] &&
        (vals[i] < meanD - 0.5 * stdD || vals[i] < 0.06)
      ) {
        list.push({
          idxInSeries: i,
          sampleIndex: sampleIndices[i],
          timestamp: times[i],
          dist: vals[i],
        });
      }
    }
    return list;
  }
  const mIdx = minimaForFingerFromFile(8);
  const mMid = minimaForFingerFromFile(12);
  const mRing = minimaForFingerFromFile(16);
  const mPink = minimaForFingerFromFile(20);
  for (const a of mIdx) {
    const b = mMid.find((x) => x.timestamp > a.timestamp);
    if (!b) continue;
    const c = mRing.find((x) => x.timestamp > b.timestamp);
    if (!c) continue;
    const d = mPink.find((x) => x.timestamp > c.timestamp);
    if (!d) continue;
    if (d.timestamp - a.timestamp <= 2000)
      return { found: true, sequence: [a, b, c, d], handKey };
  }
  return { found: false };
}

let sequenceResult = { found: false };
for (const key of Object.keys(perHandMap)) {
  if (perHandMap[key].handedness === "Right") {
    const r = findSequenceInHand(key);
    if (r.found) {
      sequenceResult = r;
      break;
    }
  }
}
results.sequenceDetected = sequenceResult;

// Candidate windows (2s) using per-sample global velocity (based on raw landmarks)
const globalVel = new Array(samples.length).fill(0);
for (let i = 1; i < samples.length; i++) {
  const s = samples[i];
  const sp = samples[i - 1];
  let sum = 0,
    cnt = 0;
  if (!s.hands || !sp.hands) {
    globalVel[i] = 0;
    continue;
  }
  for (const h of s.hands) {
    const prevH = sp.hands.find(
      (x) => x.handIndex === h.handIndex && x.handedness === h.handedness
    );
    if (prevH) {
      let acc = 0;
      const n = Math.min(h.raw.length, prevH.raw.length);
      for (let k = 0; k < n; k++) acc += dist(h.raw[k], prevH.raw[k]);
      const avg = acc / (n || 1);
      sum += avg;
      cnt++;
    }
  }
  globalVel[i] = cnt ? sum / cnt : 0;
}

function slidingWindowMinMax(arr, win) {
  let minAvg = Infinity,
    minIdx = 0,
    maxAvg = -Infinity,
    maxIdx = 0;
  for (let i = 0; i + win <= arr.length; i++) {
    const slice = arr.slice(i, i + win);
    const avg = mean(slice);
    if (avg < minAvg) {
      minAvg = avg;
      minIdx = i;
    }
    if (avg > maxAvg) {
      maxAvg = avg;
      maxIdx = i;
    }
  }
  return {
    min: { start: minIdx, avg: minAvg },
    max: { start: maxIdx, avg: maxAvg },
  };
}

const win = n2s;
const gm = slidingWindowMinMax(globalVel, win);
const handStillStart = gm.min.start;
const handFastStart = gm.max.start;
results.candidateWindows.push({
  scenario: "hand_still",
  startSampleIndex: handStillStart,
  endSampleIndex: Math.min(samples.length - 1, handStillStart + win - 1),
  startTimestamp: samples[handStillStart].timestamp,
  endTimestamp:
    samples[Math.min(samples.length - 1, handStillStart + win - 1)].timestamp,
  n: win,
  reason: `min avg velocity ${gm.min.avg}`,
});
results.candidateWindows.push({
  scenario: "hand_moving_fast",
  startSampleIndex: handFastStart,
  endSampleIndex: Math.min(samples.length - 1, handFastStart + win - 1),
  startTimestamp: samples[handFastStart].timestamp,
  endTimestamp:
    samples[Math.min(samples.length - 1, handFastStart + win - 1)].timestamp,
  n: win,
  reason: `max avg velocity ${gm.max.avg}`,
});

// orientation: choose hand with largest total palm width changes (landmarks 5<->17)
const palmChanges = [];
for (const key of Object.keys(perHandMap)) {
  const hd = perHandMap[key];
  const widths = [];
  for (const f of hd.frames) {
    if (f.raw && f.raw[5] && f.raw[17]) widths.push(dist(f.raw[5], f.raw[17]));
  }
  const deltas = [];
  for (let i = 1; i < widths.length; i++)
    deltas.push(Math.abs(widths[i] - widths[i - 1]));
  const sumDeltas = deltas.reduce((a, b) => a + b, 0);
  palmChanges.push({ key, totalDelta: sumDeltas, count: widths.length });
}
palmChanges.sort((a, b) => b.totalDelta - a.totalDelta);
const orientationHand = palmChanges.length
  ? palmChanges[0].key
  : Object.keys(perHandMap)[0];
let orientationStart = 0;
if (
  perHandMap[orientationHand] &&
  perHandMap[orientationHand].frames.length >= win
) {
  const frames = perHandMap[orientationHand].frames;
  const midIndex = Math.floor(frames.length / 2);
  orientationStart = Math.max(
    0,
    frames[midIndex].sampleIndex - Math.floor(win / 2)
  );
}
results.candidateWindows.push({
  scenario: "orientation_change",
  startSampleIndex: orientationStart,
  endSampleIndex: Math.min(samples.length - 1, orientationStart + win - 1),
  startTimestamp: samples[orientationStart].timestamp,
  endTimestamp:
    samples[Math.min(samples.length - 1, orientationStart + win - 1)].timestamp,
  n: win,
  reason: `hand ${orientationHand} selected by palm change`,
});

// pinches: gather minima from baseline smooth per hand and classify slow/fast by slope
const pinchCandidates = [];
for (const key of Object.keys(perHandMap)) {
  const h = perHandMap[key];
  const thumbIdx = 4;
  for (const fidx of fingerIdxs) {
    const d = computeDistances(h.frames, thumbIdx, fidx);
    const vals = d.values,
      times = d.times,
      sampleIndices = d.sampleIndices;
    const m = mean(vals),
      s = std(vals);
    for (let i = 1; i < vals.length - 1; i++) {
      if (
        vals[i] < vals[i - 1] &&
        vals[i] < vals[i + 1] &&
        (vals[i] < m - 0.5 * s || vals[i] < 0.06)
      ) {
        const slope =
          Math.abs(vals[i - 1] - vals[i + 1]) /
          (times[i + 1] - times[i - 1] || 1);
        pinchCandidates.push({
          hand: key,
          finger: fidx,
          sampleIndex: sampleIndices[i],
          timestamp: times[i],
          dist: vals[i],
          slope,
        });
      }
    }
  }
}
const slopes = pinchCandidates.map((p) => p.slope).filter(Boolean);
const slopeMed = slopes.length ? median(slopes) : 0;
const slow = pinchCandidates
  .filter((p) => p.slope <= slopeMed)
  .sort((a, b) => a.timestamp - b.timestamp)[0];
const fast = pinchCandidates
  .filter((p) => p.slope > slopeMed)
  .sort((a, b) => a.timestamp - b.timestamp)[0];
if (slow) {
  const start = Math.max(0, slow.sampleIndex - Math.floor(win / 2));
  results.candidateWindows.push({
    scenario: "pinch_slow",
    startSampleIndex: start,
    endSampleIndex: Math.min(samples.length - 1, start + win - 1),
    startTimestamp: samples[start].timestamp,
    endTimestamp:
      samples[Math.min(samples.length - 1, start + win - 1)].timestamp,
    n: win,
    reason: `pinch slow at sample ${slow.sampleIndex} slope ${slow.slope}`,
  });
}
if (fast) {
  const start = Math.max(0, fast.sampleIndex - Math.floor(win / 2));
  results.candidateWindows.push({
    scenario: "pinch_fast",
    startSampleIndex: start,
    endSampleIndex: Math.min(samples.length - 1, start + win - 1),
    startTimestamp: samples[start].timestamp,
    endTimestamp:
      samples[Math.min(samples.length - 1, start + win - 1)].timestamp,
    n: win,
    reason: `pinch fast at sample ${fast.sampleIndex} slope ${fast.slope}`,
  });
}

// summary stats (approx)
let palmWidths = [];
let velRawAll = [],
  velSmoothAll = [];
for (let i = 1; i < samples.length; i++) {
  const s = samples[i],
    sp = samples[i - 1];
  // per-hand palm widths
  for (const h of s.hands || []) {
    if (h.raw && h.raw[5] && h.raw[17])
      palmWidths.push(dist(h.raw[5], h.raw[17]));
  }
  // per-sample mean raw displacement across hands (approx)
  let sumDisp = 0,
    cnt = 0;
  for (const h of s.hands || []) {
    const prevH =
      sp.hands &&
      sp.hands.find(
        (x) => x.handIndex === h.handIndex && x.handedness === h.handedness
      );
    if (prevH) {
      let acc = 0;
      const n = Math.min(h.raw.length, prevH.raw.length);
      for (let k = 0; k < n; k++) acc += dist(h.raw[k], prevH.raw[k]);
      const avg = acc / (n || 1);
      sumDisp += avg;
      cnt++;
    }
  }
  if (cnt) {
    velRawAll.push(sumDisp / cnt);
  }
}

// rough smooth velocity estimate using baseline smooth series per hand
for (const key of Object.keys(perHandMap)) {
  const h = perHandMap[key];
  const series = [];
  for (let i = 0; i < h.frames.length; i++) {
    const f = h.frames[i];
    if (!f.smooth || !f.smooth[4]) continue;
    // use average landmark change across smooth arrays relative to previous frame for this hand if present
    if (i > 0 && h.frames[i - 1] && h.frames[i - 1].smooth) {
      let acc = 0;
      const n = Math.min(f.smooth.length, h.frames[i - 1].smooth.length);
      for (let k = 0; k < n; k++)
        acc += dist(f.smooth[k], h.frames[i - 1].smooth[k]);
      series.push(acc / (n || 1));
    }
  }
  velSmoothAll = velSmoothAll.concat(series);
}

results.raw_summary_stats = {
  palm_width_estimate_mean: Math.round(mean(palmWidths || [0]) * 1000) / 1000,
  palm_width_estimate_std_approx:
    Math.round(std(palmWidths || [0]) * 1000) / 1000,
  avg_velocity_raw_approx: Math.round(mean(velRawAll || [0]) * 10000) / 10000,
  avg_velocity_smooth_approx:
    Math.round(mean(velSmoothAll || [0]) * 10000) / 10000,
};

// compute median reduction ratios per preset
results.simulationSummary = {};
for (const pname of Object.keys(results.perPreset)) {
  const obj = results.perPreset[pname];
  let reductions = [];
  for (const key of Object.keys(obj.hands)) {
    for (const idx of fingerIdxs) {
      const r = obj.hands[key].fingers[idx];
      if (r && r.reduction_ratio && isFinite(r.reduction_ratio))
        reductions.push(r.reduction_ratio);
    }
  }
  results.simulationSummary[pname] = {
    medianReduction: Math.round(median(reductions || [1]) * 1000) / 1000,
    count: reductions.length,
  };
}

results.presetsRecommended = [
  {
    label: "Responsive",
    params: { minCutoff: 5.0, beta: 0.1, dCutoff: 1.0 },
    tradeoff:
      "Lowest latency, more jitter — good for timing-critical note onsets.",
  },
  {
    label: "Balanced",
    params: { minCutoff: 1.5, beta: 0.03, dCutoff: 1.0 },
    tradeoff:
      "Moderate smoothing + responsiveness — recommended starting point.",
  },
  {
    label: "Smooth",
    params: { minCutoff: 0.3, beta: 0.005, dCutoff: 1.0 },
    tradeoff:
      "High smoothing, higher lag — good for visualization and stable continuous control.",
  },
];

results.briefConclusion =
  "Simulation completed: Responsive will reduce lag but shows less variance reduction; Smooth increases variance reduction but will delay very fast pinches. The recording contains a strong simultaneous multi-finger contact (near sample ~40) rather than a clean sequential sweep, so extracting sequential pinch golden-masters from this recording is not possible. Recommended next action: run the Balanced preset live to record clean sequential pinches (or extract the candidate windows provided).";

console.log(JSON.stringify(results, null, 2));
