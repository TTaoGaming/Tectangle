#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer';
import http from 'node:http';
import { spawn } from 'node:child_process';
import ffmpegPathImport from 'ffmpeg-static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(path.join(__dirname, '..'));
const humanRoot = path.resolve(path.join(root, '..', '..', 'human-main-referenceonly', 'human-main'));
const humanEsm = path.join(humanRoot, 'dist', 'human.esm.js');
const tfjsEsm = path.join(humanRoot, 'dist', 'tfjs.esm.js');
const modelsDir = path.join(humanRoot, 'models');

if (!fs.existsSync(humanEsm) || !fs.existsSync(tfjsEsm)) {
  console.error('Missing Human ESM dist files at', humanEsm, 'or', tfjsEsm);
  process.exit(1);
}
if (!fs.existsSync(modelsDir)) {
  console.error('Missing Human models dir at', modelsDir);
  process.exit(1);
}

const videos = [
  path.resolve(path.join(root, '..', '..', 'right hand hand oriented towards the camera and wrist to middle knuckle pointing up index to thumb pinch.mp4')),
  path.resolve(path.join(root, '..', '..', 'right hand palm oriented to my left index and thumb pinch should be GATED.mp4')),
];
for (const v of videos) {
  if (!fs.existsSync(v)) {
    console.error('Video not found:', v);
    process.exit(1);
  }
}

const outDir = path.join(root, 'data', 'goldens');
fs.mkdirSync(outDir, { recursive: true });

const html = `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Human Extract</title></head>
<body>
  <canvas id="cv" style="display:none;"></canvas>
  <script type="module">
  import * as tf from '/dist/tfjs.esm.js';
  import HumanModule from '/dist/human.esm.js';
    const Human = HumanModule.Human || HumanModule.default || HumanModule;
  const modelsBase = location.origin + '/models/';
    const human = new Human({
      backend: 'cpu', // reliable in headless; slower but fine for short clips
      async: false,
      filter: { enabled: false, temporal: false },
      hand: { enabled: true, detector: { enabled: true }, landmarks: { enabled: true } },
      face: { enabled: false }, body: { enabled: false }, object: { enabled: false }, gesture: { enabled: false },
      modelBasePath: modelsBase.endsWith('/') ? modelsBase : modelsBase + '/',
    });
    await tf.ready();
    await human.load();
    const cv = document.getElementById('cv');
    const ctx = cv.getContext('2d');

    async function waitEvent(el, ev) { return new Promise(r => el.addEventListener(ev, r, { once: true })); }

    async function loadImage(url) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.crossOrigin = 'anonymous';
        img.src = url;
      });
    }

    window.__humanRunFrames = async (base, frameCount, width, height, fps) => {
      cv.width = width; cv.height = height;
      const out = [];
      for (let i = 0; i < frameCount; i++) {
        const name = String(i).padStart(5, '0') + '.png';
        const url = location.origin + '/frames/' + base + '/' + name;
        const img = await loadImage(url);
        ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.drawImage(img, 0, 0);
        const res = await human.detect(cv);
        const hands = (res.hand || []).map(h => ({
          handedness: [{ categoryName: h.label || 'unknown', score: h.score ?? 0 }],
          landmarks: (h.keypoints || []).map(k => (
            Array.isArray(k)
              ? { x: k[0], y: k[1], z: (k[2] ?? 0) }
              : { x: (k.x ?? k.position?.[0] ?? k.position?.x ?? 0), y: (k.y ?? k.position?.[1] ?? k.position?.y ?? 0), z: (k.z ?? 0) }
          )),
        }));
        const timestampMs = Math.round((i / fps) * 1000);
        out.push({ frameIndex: i, timestampMs, hands });
      }
      return JSON.stringify(out);
    };
  </script>
</body>
</html>`;

function startServer() {
  const serve = (req, res) => {
    const url = decodeURIComponent(req.url || '/');
    if (url === '/' || url === '/app') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }
    const safe = url.replace(/\?.*$/, '').replace(/\\/g, '/');
    // Serve Human dist and models
    if (safe.startsWith('/dist/')) {
      const file = path.join(humanRoot, 'dist', safe.substring('/dist/'.length));
      if (!fs.existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'Content-Type': safe.endsWith('.js') ? 'application/javascript' : 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
      return;
    }
    if (safe.startsWith('/models/')) {
      const file = path.join(humanRoot, 'models', safe.substring('/models/'.length));
      if (!fs.existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      fs.createReadStream(file).pipe(res);
      return;
    }
    if (safe.startsWith('/frames/')) {
      const rel = safe.substring('/frames/'.length);
      const file = path.join(tmpFramesRoot, rel);
      if (!fs.existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'Content-Type': 'image/png' });
      fs.createReadStream(file).pipe(res);
      return;
    }
    res.writeHead(404); res.end('not found');
  };
  return new Promise((resolve) => {
    const srv = http.createServer(serve);
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      resolve({ srv, port: addr.port });
    });
  });
}

const ffmpegBin = ffmpegPathImport || 'ffmpeg';
const tmpFramesRoot = path.join(root, '.tmp-frames');
fs.mkdirSync(tmpFramesRoot, { recursive: true });

async function extractFrames(videoPath, base, fps) {
  const outDir = path.join(tmpFramesRoot, base);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const args = ['-hide_banner', '-i', videoPath, '-vf', `fps=${fps}`, '-start_number', '0', path.join(outDir, '%05d.png')];
  const proc = spawn(ffmpegBin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let err = '';
  proc.stderr.on('data', (d) => { err += d.toString(); });
  await new Promise((resolve, reject) => {
    proc.on('close', (code) => code === 0 ? resolve() : reject(new Error(err)));
    proc.on('error', reject);
  });
  const files = fs.readdirSync(outDir).filter(f => f.endsWith('.png')).sort();
  if (files.length === 0) throw new Error('No frames extracted');
  // Probe first image for dimensions
  const dim = await new Promise((resolve, reject) => {
    import('pngjs').then(({ PNG }) => {
      const buf = fs.readFileSync(path.join(outDir, files[0]));
      const png = PNG.sync.read(buf);
      resolve({ width: png.width, height: png.height });
    }).catch(reject);
  });
  return { count: files.length, width: dim.width, height: dim.height };
}

const runOne = async (videoPath, fps=30) => {
  const base = path.basename(videoPath).replace(/\.[^.]+$/, '');
  const { count, width, height } = await extractFrames(videoPath, base, fps);
  const { srv, port } = await startServer();
  const browser = await puppeteer.launch({ headless: true, args: ['--allow-file-access-from-files', '--disable-web-security', '--no-sandbox'] });
  try {
    const page = await browser.newPage();
    page.on('console', (msg) => {
      try { console.log('[page]', msg.type(), msg.text()); } catch {}
    });
    page.on('pageerror', (err) => console.error('[pageerror]', err));
    page.on('requestfailed', (req) => console.error('[requestfailed]', req.url(), req.failure()?.errorText));
    await page.goto(`http://127.0.0.1:${port}/app`, { waitUntil: 'load' });
    await page.waitForFunction(() => typeof window.__humanRunFrames === 'function', { timeout: 60000 });
    const json = await page.evaluate(async (p) => {
      const { base, count, width, height, fps } = p;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);
      try {
        return await window.__humanRunFrames(base, count, width, height, fps);
      } finally { clearTimeout(timeout); }
    }, { base, count, width, height, fps });
    return JSON.parse(json);
  } finally {
    await browser.close();
    await new Promise((r) => srv.close(() => r()));
  }
};

const writeOut = (videoPath, frames) => {
  const base = path.basename(videoPath).replace(/\.[^.]+$/, '');
  const outPath = path.join(outDir, `${base}.human.landmarks.jsonl`);
  const stream = fs.createWriteStream(outPath, { encoding: 'utf-8' });
  for (const f of frames) stream.write(JSON.stringify(f) + "\n");
  stream.end();
  console.log('Wrote', path.relative(root, outPath));
};

for (const v of videos) {
  const frames = await runOne(v, 30);
  writeOut(v, frames);
}

console.log('Done.');
