const NM_BASE = "/node_modules/@mediapipe/tasks-vision";
const MODEL_PATH = "/September2025/TectangleHexagonal/assets/models/gesture_recognizer.task";

const OPEN_FRAMES_REQUIRED = 3;
const OPEN_THRESHOLD = 0.6;
const FIST_FRAMES_REQUIRED = 2;
const FIST_THRESHOLD = 0.7;
const MISSING_RESET_FRAMES = 12;

const SEAT_COLORS = {
  P1: {
    base: "#6fb3ff",
    ready: "#9ad1ff",
    fist: "#ffd27f",
    search: "#8ea0b7"
  },
  P2: {
    base: "#ff8d8d",
    ready: "#ffb0b0",
    fist: "#ffe4a6",
    search: "#a1aebf"
  }
};

const videoEl = document.getElementById("video");
const canvasEl = document.getElementById("overlay");
const ctx = canvasEl.getContext("2d");
videoEl.addEventListener("loadedmetadata", () => {
  const width = videoEl.videoWidth || 960;
  const height = videoEl.videoHeight || 720;
  if (width && height) {
    canvasEl.width = width;
    canvasEl.height = height;
  }
});

const statusBadge = document.getElementById("status");

const btnStartCam = document.getElementById("btnStartCam");
const btnStopCam = document.getElementById("btnStopCam");
const fileInput = document.getElementById("fileInput");
const btnProcessLoaded = document.getElementById("btnProcessLoaded");
const btnDownloadTelem = document.getElementById("btnDownloadTelem");
const btnReset = document.getElementById("btnReset");
const eventsLogEl = document.getElementById("eventsLog");
const dinoFrame = document.getElementById("dino");

const seatElements = {
  P1: {
    card: document.querySelector('.seat-card[data-seat="P1"]'),
    state: document.querySelector('.state-label[data-seat="P1"]'),
    label: document.getElementById("labelP1"),
    score: document.getElementById("scoreP1"),
    open: document.getElementById("openStreakP1"),
    fist: document.getElementById("fistStreakP1"),
    frames: document.getElementById("framesP1"),
    handed: document.getElementById("handedP1")
  },
  P2: {
    card: document.querySelector('.seat-card[data-seat="P2"]'),
    state: document.querySelector('.state-label[data-seat="P2"]'),
    label: document.getElementById("labelP2"),
    score: document.getElementById("scoreP2"),
    open: document.getElementById("openStreakP2"),
    fist: document.getElementById("fistStreakP2"),
    frames: document.getElementById("framesP2"),
    handed: document.getElementById("handedP2")
  }
};

let recognizerPromise = null;
let recognizer = null;
let cameraStream = null;
let usingCamera = false;
let frameCounter = 0;
const eventsBuffer = [];

const telemetry = {
  frames: [],
  events: []
};

const seats = {
  P1: createSeat("P1"),
  P2: createSeat("P2")
};

function createSeat(id) {
  return {
    id,
    state: "SEARCH",
    openStreak: 0,
    fistStreak: 0,
    frames: 0,
    missingFrames: 0,
    lastGesture: "–",
    lastScore: 0,
    lastHanded: "–",
    lastSeenTs: 0
  };
}

function resetSeats() {
  seats.P1 = Object.assign(seats.P1, createSeat("P1"));
  seats.P2 = Object.assign(seats.P2, createSeat("P2"));
  updateSeatUI("P1", { present: false });
  updateSeatUI("P2", { present: false });
}

function resetTelemetry() {
  telemetry.frames.length = 0;
  telemetry.events.length = 0;
  eventsBuffer.length = 0;
  eventsLogEl.textContent = "(none)";
  btnDownloadTelem.disabled = true;
}

function appendEvent(evt) {
  telemetry.events.push(evt);
  eventsBuffer.push(`${new Date(evt.ts).toISOString()} | ${evt.seat || "–"} | ${evt.type}`);
  if (eventsBuffer.length > 10) eventsBuffer.shift();
  eventsLogEl.textContent = eventsBuffer.join("\n");
}

async function loadRecognizer() {
  if (recognizer) return recognizer;
  if (recognizerPromise) return recognizerPromise;
  recognizerPromise = (async () => {
    const visionPkg = await import(`${NM_BASE}/vision_bundle.mjs`);
    const { FilesetResolver, GestureRecognizer } = visionPkg;
    const resolver = await FilesetResolver.forVisionTasks(`${NM_BASE}/wasm`);
    recognizer = await GestureRecognizer.createFromOptions(resolver, {
      baseOptions: { modelAssetPath: MODEL_PATH },
      runningMode: "VIDEO",
      numHands: 2
    });
    statusBadge.textContent = "ready";
    return recognizer;
  })();
  return recognizerPromise;
}

function seatFromLandmarks(landmarks) {
  if (!Array.isArray(landmarks) || !landmarks.length) return "P1";
  const wrist = landmarks[0];
  const cx = typeof wrist?.x === "number" ? wrist.x : 0.5;
  return cx <= 0.5 ? "P1" : "P2";
}

function updateSeatUI(seatId, { present = true } = {}) {
  const seat = seats[seatId];
  const ui = seatElements[seatId];
  ui.card.dataset.active = present ? "true" : "false";
  ui.state.dataset.state = seat.state;
  ui.state.textContent = seat.state;
  ui.label.textContent = seat.lastGesture;
  ui.score.textContent = seat.lastScore.toFixed(2);
  ui.open.textContent = seat.openStreak;
  ui.fist.textContent = seat.fistStreak;
  ui.frames.textContent = seat.frames;
  ui.handed.textContent = seat.lastHanded || "–";
}

function sendDinoJump() {
  try {
    const target = dinoFrame?.contentWindow;
    if (!target) return;
    target.postMessage({ type: "dino:key", action: "down", code: "Space", key: " " }, "*");
    setTimeout(() => {
      try { target.postMessage({ type: "dino:key", action: "up", code: "Space", key: " " }, "*"); }
      catch (err) { console.warn("dino up err", err); }
    }, 60);
  } catch (err) {
    console.warn("dino send err", err);
  }
}

function recordFrame(entry) {
  telemetry.frames.push(entry);
}

function drawOverlays(perHand) {
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

  ctx.save();
  ctx.strokeStyle = "rgba(200,210,225,0.2)";
  ctx.setLineDash([10, 12]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(canvasEl.width / 2, 0);
  ctx.lineTo(canvasEl.width / 2, canvasEl.height);
  ctx.stroke();
  ctx.restore();

  perHand.forEach(hand => {
    const { seat, state, label, landmarks } = hand;
    if (!landmarks || !landmarks.length) return;
    const palette = SEAT_COLORS[seat];
    const color = state === "READY"
      ? palette.ready
      : state === "FIST_HELD"
        ? palette.fist
        : state === "MISSING"
          ? palette.search
          : palette.base;

    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    landmarks.forEach(lm => {
      const x = lm.x * canvasEl.width;
      const y = lm.y * canvasEl.height;
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    });

    const wrist = landmarks[0];
    const x = wrist?.x * canvasEl.width || 0;
    const y = wrist?.y * canvasEl.height || 0;
    ctx.fillStyle = "rgba(15,21,26,0.65)";
    ctx.fillRect(x + 8, y + 8, 90, 20);
    ctx.strokeStyle = color;
    ctx.strokeRect(x + 8, y + 8, 90, 20);
    ctx.fillStyle = color;
    ctx.font = "12px 'Inter', system-ui";
    const text = label === "Open_Palm" ? "Palm Open" : label === "Closed_Fist" ? "Fist" : label;
    ctx.fillText(text, x + 14, y + 22);
    ctx.restore();
  });
}

function updateSeatState({ seatId, label, score, ts, landmarks, handedness }) {
  const seat = seats[seatId];
  seat.frames += 1;
  seat.lastSeenTs = ts;
  seat.lastGesture = label;
  seat.lastScore = score || 0;
  seat.lastHanded = handedness || "–";
  seat.missingFrames = 0;

  let event = null;

  if (label === "Open_Palm" && score >= OPEN_THRESHOLD) {
    seat.openStreak += 1;
    seat.fistStreak = 0;
  } else if (label === "Closed_Fist" && score >= FIST_THRESHOLD) {
    seat.fistStreak += 1;
    seat.openStreak = 0;
  } else {
    seat.openStreak = 0;
    seat.fistStreak = 0;
  }

  switch (seat.state) {
    case "SEARCH":
      if (seat.openStreak >= OPEN_FRAMES_REQUIRED) {
        seat.state = "READY";
        event = { type: "lock", seat: seatId, ts, confidence: score, handedness };
      }
      break;
    case "READY":
      if (label === "Closed_Fist" && score >= FIST_THRESHOLD && seat.fistStreak >= FIST_FRAMES_REQUIRED) {
        seat.state = "FIST_HELD";
      }
      break;
    case "FIST_HELD":
      if (label === "Open_Palm" && score >= OPEN_THRESHOLD && seat.openStreak >= 1) {
        seat.state = "READY";
        event = { type: "fire", seat: seatId, ts, confidence: score, handedness };
        sendDinoJump();
      }
      break;
    case "MISSING":
      if (seat.openStreak >= OPEN_FRAMES_REQUIRED) {
        seat.state = "READY";
        event = { type: "lock", seat: seatId, ts, confidence: score, handedness };
      }
      break;
    default:
      break;
  }

  updateSeatUI(seatId, { present: true });

  const wrist = landmarks?.[0] || {};
  recordFrame({
    frame: frameCounter,
    ts,
    seat: seatId,
    state: seat.state,
    gesture: label,
    score: Number.isFinite(score) ? Number(score.toFixed(4)) : null,
    openStreak: seat.openStreak,
    fistStreak: seat.fistStreak,
    handedness,
    wrist: { x: wrist?.x ?? null, y: wrist?.y ?? null, z: wrist?.z ?? null },
    present: true
  });

  if (event) appendEvent(event);
  return event;
}

function handleMissingSeats(seatsSeen, ts) {
  Object.keys(seats).forEach(seatId => {
    if (seatsSeen.has(seatId)) return;
    const seat = seats[seatId];
    seat.missingFrames += 1;
    if (seat.missingFrames > MISSING_RESET_FRAMES) {
      seat.state = "MISSING";
      seat.openStreak = 0;
      seat.fistStreak = 0;
      seat.lastGesture = "–";
      seat.lastScore = 0;
      seat.lastHanded = "–";
    }
    updateSeatUI(seatId, { present: false });
    recordFrame({
      frame: frameCounter,
      ts,
      seat: seatId,
      state: seat.state,
      gesture: null,
      score: null,
      openStreak: seat.openStreak,
      fistStreak: seat.fistStreak,
      handedness: null,
      wrist: { x: null, y: null, z: null },
      present: false
    });
  });
}

async function processResults(res, ts) {
  if (!res) return;
  const handsCount = res.gestures?.length || 0;
  const perHand = [];
  const seatsSeen = new Set();

  for (let i = 0; i < handsCount; i++) {
    const gestures = res.gestures?.[i] || [];
    const top = gestures[0];
    const label = top?.categoryName || "–";
    const score = typeof top?.score === "number" ? top.score : 0;
    const landmarks = res.landmarks?.[i] || [];
    const handedness = res.handednesses?.[i]?.[0]?.categoryName || null;
    const seatId = seatFromLandmarks(landmarks);
    seatsSeen.add(seatId);
    updateSeatState({ seatId, label, score, ts, landmarks, handedness });
    perHand.push({ seat: seatId, state: seats[seatId].state, label, landmarks });
  }

  handleMissingSeats(seatsSeen, ts);
  drawOverlays(perHand);
}

async function loopCamera() {
  if (!usingCamera || !cameraStream) return;
  await loadRecognizer();
  const process = async () => {
    if (!usingCamera) return;
    const ts = performance.now();
    const res = await recognizer.recognizeForVideo(videoEl, ts);
    frameCounter += 1;
    await processResults(res, Date.now());
    requestAnimationFrame(process);
  };
  requestAnimationFrame(process);
}

function bindCameraControls() {
  btnStartCam.addEventListener("click", async () => {
    try {
      await loadRecognizer();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      cameraStream = stream;
      usingCamera = true;
      videoEl.srcObject = stream;
      await videoEl.play();
      statusBadge.textContent = "camera";
      btnStartCam.disabled = true;
      btnStopCam.disabled = false;
      loopCamera();
    } catch (err) {
      console.error(err);
      statusBadge.textContent = "camera error";
    }
  });

  btnStopCam.addEventListener("click", () => {
    usingCamera = false;
    btnStartCam.disabled = false;
    btnStopCam.disabled = true;
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      cameraStream = null;
    }
    videoEl.pause();
    videoEl.srcObject = null;
    statusBadge.textContent = "stopped";
  });
}

function bindFileControls() {
  let loadedObjectUrl = null;

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) {
      btnProcessLoaded.disabled = true;
      return;
    }
    if (loadedObjectUrl) URL.revokeObjectURL(loadedObjectUrl);
    loadedObjectUrl = URL.createObjectURL(file);
    videoEl.srcObject = null;
    videoEl.src = loadedObjectUrl;
    videoEl.loop = false;
    videoEl.muted = true;
    videoEl.playsInline = true;
    btnProcessLoaded.disabled = false;
    statusBadge.textContent = "clip loaded";
  });

  btnProcessLoaded.addEventListener("click", async () => {
    const clip = videoEl.src;
    if (!clip) return;
    await processClipUrl(clip, { reset: true });
  });

  btnReset.addEventListener("click", () => {
    resetSeats();
    resetTelemetry();
    frameCounter = 0;
    statusBadge.textContent = "reset";
  });

  btnDownloadTelem.addEventListener("click", () => {
    if (!telemetry.frames.length) return;
    const lines = telemetry.frames.map(f => JSON.stringify(f));
    const blob = new Blob([lines.join("\n") + "\n"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "opo_runner.telemetry.jsonl";
    a.click();
    URL.revokeObjectURL(url);
  });
}

async function processClipUrl(url, { reset = false } = {}) {
  await loadRecognizer();
  if (reset) {
    resetSeats();
    resetTelemetry();
    frameCounter = 0;
  }
  statusBadge.textContent = "processing";

  videoEl.srcObject = null;
  videoEl.src = url;
  videoEl.muted = true;
  videoEl.playsInline = true;
  videoEl.loop = false;
  await videoEl.play();

  await new Promise(resolve => {
    const onEnded = () => {
      videoEl.removeEventListener("ended", onEnded);
      resolve();
    };
    videoEl.addEventListener("ended", onEnded, { once: true });
    const onFrame = async () => {
      if (videoEl.paused || videoEl.ended) return;
      const ts = performance.now();
      const res = await recognizer.recognizeForVideo(videoEl, ts);
      frameCounter += 1;
      await processResults(res, Date.now());
      videoEl.requestVideoFrameCallback(onFrame);
    };
    videoEl.requestVideoFrameCallback(onFrame);
  });

  statusBadge.textContent = "done";
  btnDownloadTelem.disabled = telemetry.frames.length === 0;
  return buildSummary();
}

function buildSummary() {
  const perSeat = {};
  Object.keys(seats).forEach(seatId => {
    const seatFrames = telemetry.frames.filter(f => f.seat === seatId && f.present);
    const readyFrames = seatFrames.filter(f => f.state === "READY").length;
    const fires = telemetry.events.filter(e => e.seat === seatId && e.type === "fire").length;
    const locks = telemetry.events.filter(e => e.seat === seatId && e.type === "lock").length;
    perSeat[seatId] = {
      totalFrames: seatFrames.length,
      readyFrames,
      fireCount: fires,
      lockCount: locks
    };
  });
  return { frames: telemetry.frames.length, seats: perSeat, events: telemetry.events.slice() };
}

bindCameraControls();
bindFileControls();
loadRecognizer().catch(err => {
  console.error("recognizer load failed", err);
  statusBadge.textContent = "load error";
});

window.__opo = {
  processClip: (clipUrl, opts = {}) => processClipUrl(clipUrl, opts),
  telemetry: () => ({ frames: telemetry.frames.slice(), events: telemetry.events.slice() }),
  summary: () => buildSummary(),
  reset: () => { resetSeats(); resetTelemetry(); frameCounter = 0; }
};

const params = new URLSearchParams(location.search);
const clipParam = params.get("clip");
const autoStart = params.get("autostart") === "1";
if (clipParam && autoStart) {
  processClipUrl(clipParam, { reset: true }).catch(err => console.error(err));
}
