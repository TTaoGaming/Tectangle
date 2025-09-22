#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { PNG } from 'pngjs';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-wasm';

// Human requires tfjs-node to be loaded first
// Using Human node-wasm build to avoid native tfjs-node on Windows

import HumanPkg from '@vladmandic/human';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(path.join(__dirname, '..'));
const humanRepoRoot = path.resolve(path.join(workspaceRoot, '..', '..', 'human-main-referenceonly', 'human-main'));

const argv = yargs(hideBin(process.argv))
  .option('input', { alias: 'i', type: 'string', demandOption: true, describe: 'Path to input MP4 file' })
  .option('fps', { type: 'number', default: 30 })
  .option('hands', { type: 'number', default: 2 })
  .option('verbose', { type: 'boolean', default: false })
  .help()
  .parse();

const inputPath = path.resolve(argv.input);
if (!fs.existsSync(inputPath)) { console.error('Input not found:', inputPath); process.exit(1); }

const outDir = path.join(workspaceRoot, 'data', 'goldens');
fs.mkdirSync(outDir, { recursive: true });
const base = path.basename(inputPath).replace(/\.[^.]+$/, '');
const landmarksOut = path.join(outDir, `${base}.human.landmarks.json`);
const metaOut = path.join(outDir, `${base}.human.meta.json`);
const timesOut = path.join(outDir, `${base}.human.golden_times.json`);

// Configure Human
const humanConfig = {
  backend: 'wasm',
  wasmPath: 'auto',
  modelBasePath: 'file://' + path.join(humanRepoRoot, 'models').replace(/\\/g, '/') + '/',
  async: false,
  filter: { enabled: false, temporal: false },
  hand: { enabled: true, detector: { enabled: true }, landmarks: { enabled: true } },
  face: { enabled: false }, body: { enabled: false }, object: { enabled: false }, gesture: { enabled: false },
};

const Human = HumanPkg.Human || HumanPkg.default || HumanPkg;
const human = new Human(humanConfig);
await tf.setBackend('wasm');
await tf.ready();
await human.load();

// ffmpeg → rawframes as PNG for deterministic decode using tfjs-node
let ffmpegBin = 'ffmpeg';
try { const ffStatic = await import('ffmpeg-static'); ffmpegBin = (ffStatic.default || ffStatic) || 'ffmpeg'; } catch {}
const ff = spawn(ffmpegBin, ['-hide_banner', '-i', inputPath, '-vf', `fps=${argv.fps}`, '-f', 'image2pipe', '-vcodec', 'png', '-']);

const chunks = [];
let current = [];
let reading = false;

ff.stdout.on('data', (d) => {
  chunks.push(d);
  // We need to split PNGs from the stream; PNGs start with 89 50 4E 47 0D 0A 1A 0A and end with IEND chunk
  // For simplicity, buffer until ffmpeg closes and split using PNG signature boundaries
});

const stderrBuf = [];
ff.stderr.on('data', (d) => stderrBuf.push(d));

await new Promise((resolve, reject) => {
  ff.on('close', (code) => code === 0 ? resolve() : reject(new Error(Buffer.concat(stderrBuf).toString())));
  ff.on('error', reject);
});

const buffer = Buffer.concat(chunks);
// Split PNGs by signature
const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
const frames = [];
let idx = 0;
while (true) {
  const start = buffer.indexOf(sig, idx);
  if (start === -1) break;
  const next = buffer.indexOf(sig, start + sig.length);
  const end = next === -1 ? buffer.length : next;
  frames.push(buffer.slice(start, end));
  idx = end;
}

const allFrames = [];
const times = [];
let frameIndex = 0;
for (const png of frames) {
  const tMs = Math.round((frameIndex / argv.fps) * 1000);
  // decode PNG to RGBA buffer then pass ImageData-like object
  const decoded = PNG.sync.read(png);
  const imageData = { data: decoded.data, width: decoded.width, height: decoded.height }; 
  const res = await human.image(imageData, humanConfig);

  const hands = (res.hand || []).slice(0, argv.hands).map(h => ({
    handedness: [{ categoryName: h.label || 'unknown', score: h.score ?? 0 }],
    landmarks: (h.keypoints || []).map(k => ({ x: k.x, y: k.y, z: k.z ?? 0 })),
  }));

  allFrames.push({ frameIndex, timestampMs: tMs, hands });
  times.push(tMs);
  frameIndex++;
}

fs.writeFileSync(landmarksOut, JSON.stringify(allFrames, null, 2));
fs.writeFileSync(metaOut, JSON.stringify({ input: path.relative(workspaceRoot, inputPath), fps: argv.fps, producer: 'human', timestampsPolicy: 'timestampMs = round((frameIndex / fps) * 1000)' }, null, 2));
fs.writeFileSync(timesOut, JSON.stringify(times, null, 2));

console.log('Wrote:', path.relative(workspaceRoot, landmarksOut));
console.log('Wrote:', path.relative(workspaceRoot, metaOut));
console.log('Wrote:', path.relative(workspaceRoot, timesOut));
