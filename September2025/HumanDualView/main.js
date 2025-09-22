import Human from '../../human-main-referenceonly/human-main/dist/human.esm.js';

const human = new Human({
  backend: 'webgl',
  async: true,
  debug: false,
  modelBasePath: '/human-main-referenceonly/human-main/models/',
  face: { enabled: false },
  body: { enabled: false },
  object: { enabled: false },
  segmentation: { enabled: false },
  hand: {
    enabled: true,
    maxDetected: 2,
    minConfidence: 0.3,
    landmarks: true,
    rotation: true,
    skipFrames: 0,
    detector: { modelPath: 'handdetector.json' },
    skeleton: { modelPath: 'handskeleton.json' },
  },
});

const video = document.getElementById('cam');
const canvas = document.getElementById('ov');
const ctx = canvas.getContext('2d');

function resize() {
  const r = video.getBoundingClientRect();
  canvas.width = r.width || video.videoWidth || 640;
  canvas.height = r.height || video.videoHeight || 480;
}

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
  video.srcObject = stream;
  await video.play();
  resize();
}

function drawCircle([x, y], color = '#00e5ff') {
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 4;
  ctx.fill();
}

function toCanvasCoords(pt, width, height) {
  // pt is normalized 0..1 or absolute depending on API; Result uses absolute
  const [x, y] = pt;
  return [x, y];
}

function drawTips(result) {
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  for (const hand of result.hand) {
    // Annotations record per finger: points in image pixels
    const { annotations } = hand;
    if (!annotations) continue;
    const indexPts = annotations.index || [];
    const thumbPts = annotations.thumb || [];
    const indexTip = indexPts[indexPts.length - 1];
    const thumbTip = thumbPts[thumbPts.length - 1];
    if (indexTip) drawCircle(toCanvasCoords(indexTip, W, H), '#ff6d00');
    if (thumbTip) drawCircle(toCanvasCoords(thumbTip, W, H), '#00e676');
  }
}

async function loop() {
  if (video.readyState >= 2) {
    const result = await human.detect(video);
    if (result) drawTips(result);
  }
  requestAnimationFrame(loop);
}

(async () => {
  // Initialize backend/models
  await human.init();
  await startCamera();
  // Warmup for faster first-frame
  await human.warmup({ backend: 'webgl', modelBasePath: '/human-main-referenceonly/human-main/models/' });
  loop();
})();
