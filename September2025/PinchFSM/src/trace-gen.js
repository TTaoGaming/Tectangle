#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import Pipe2Jpeg from 'pipe2jpeg';
import jpeg from 'jpeg-js';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import crypto from 'node:crypto';

// Polyfill ImageData for Node environment if missing
if (typeof globalThis.ImageData === 'undefined') {
  globalThis.ImageData = class ImageData {
    constructor(data, width, height) {
      this.data = data;
      this.width = width;
      this.height = height;
    }
  };
}

// Tiny helper: compute sha256 for determinism metadata
function sha256OfFile(filePath) {
  const hash = crypto.createHash('sha256');
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest('hex');
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function getOutputBase(inputPath) {
  const base = path.basename(inputPath).replace(/\.[^.]+$/, '');
  return base;
}

async function main() {
  const argv = yargs(hideBin(process.argv))
    .option('input', {
      alias: 'i',
      type: 'string',
      demandOption: true,
      describe: 'Path to input MP4 file',
    })
    .option('fps', {
      type: 'number',
      default: 30,
      describe: 'Decode FPS (frames per second) via ffmpeg',
    })
    .option('hands', {
      type: 'number',
      default: 2,
      describe: 'Number of hands to detect (1 or 2)',
    })
    .option('model', {
      type: 'string',
      describe: 'Path to hand_landmarker.task (overrides vendor default)'
    })
    .option('wasmBase', {
      type: 'string',
      describe: 'Base URL or path for MediaPipe WASM. If omitted, a local HTTP server will serve the WASM from vendor or node_modules'
    })
    .option('ffmpeg', {
      type: 'string',
      describe: 'Path to ffmpeg binary (defaults to ffmpeg on PATH)'
    })
    .option('verbose', {
      type: 'boolean',
      default: false,
    })
    .help()
    .parse();

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const workspaceRoot = path.resolve(path.join(__dirname, '..'));
  const vendorRoot = path.join(workspaceRoot, 'vendor', 'mediapipe');
  const modelPathDefault = path.join(vendorRoot, 'models', 'hand_landmarker.task');
  const modelPath = path.resolve(argv.model || modelPathDefault);
  const wasmRootVendor = path.join(vendorRoot, 'wasm');
  const wasmRootNode = path.join(workspaceRoot, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
  const wasmRoot = fs.existsSync(path.join(wasmRootVendor, 'vision_wasm_internal.wasm')) ? wasmRootVendor : wasmRootNode;

  if (!fs.existsSync(modelPath)) {
    console.error('Missing model:', modelPath);
    console.error('See README: place hand_landmarker.task in vendor/mediapipe/models');
    process.exit(1);
  }
  if (!fs.existsSync(path.join(wasmRoot, 'vision_wasm_internal.wasm'))) {
    console.error('Missing wasm runtime in', wasmRoot);
    console.error('See README: place MediaPipe vision wasm files in vendor/mediapipe/wasm');
    process.exit(1);
  }

  const inputPath = path.resolve(argv.input);
  if (!fs.existsSync(inputPath)) {
    console.error('Input not found:', inputPath);
    process.exit(1);
  }

  const outDir = path.join(workspaceRoot, 'data', 'goldens');
  ensureDir(outDir);
  const base = getOutputBase(inputPath);
  const landmarksOut = path.join(outDir, `${base}.landmarks.json`);
  const metaOut = path.join(outDir, `${base}.meta.json`);
  const timesOut = path.join(outDir, `${base}.golden_times.json`);

  // Build ffmpeg command: decode at fixed fps to mjpeg over pipe
  const ffmpegArgs = [
    '-hide_banner',
    '-i', inputPath,
    '-vf', `fps=${argv.fps}`,
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-'
  ];

  let ffmpegBin = argv.ffmpeg || 'ffmpeg';
  // Try fallback to ffmpeg-static if PATH ffmpeg not available
  if (ffmpegBin === 'ffmpeg') {
    try {
      const ffStatic = await import('ffmpeg-static');
      const p = ffStatic.default || ffStatic;
      if (p) ffmpegBin = p;
    } catch {}
  }
  if (argv.verbose) console.log('Running', ffmpegBin, ffmpegArgs.join(' '));
  const ff = spawn(ffmpegBin, ffmpegArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

  let ffmpegErr = '';
  ff.stderr.on('data', (d) => { ffmpegErr += d.toString(); });

  const pipe2jpeg = new Pipe2Jpeg();

  let width = 0;
  let height = 0;

  // Serve WASM over a tiny local HTTP server if wasmBase not provided.
  let server = null;
  let wasmBaseUrl = argv.wasmBase;
  if (!wasmBaseUrl) {
    const http = await import('node:http');
    server = http.createServer((req, res) => {
      // Only serve the known wasm/js files from wasmRoot
      const urlPath = decodeURIComponent((req.url || '').replace(/\?.*$/, ''));
      const safe = urlPath.replace(/\\/g, '/').replace(/\.\./g, '');
      const file = path.join(wasmRoot, safe);
      if (!safe || safe === '/' || !fs.existsSync(file)) {
        res.statusCode = 404;
        res.end('not found');
        return;
      }
      const ext = path.extname(file).toLowerCase();
      const type = ext === '.wasm' ? 'application/wasm' : 'application/javascript';
      res.setHeader('Content-Type', type);
      fs.createReadStream(file).pipe(res);
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const addr = server.address();
    const port = typeof addr === 'object' && addr ? addr.port : 0;
    wasmBaseUrl = `http://127.0.0.1:${port}`;
    if (argv.verbose) console.log('Serving WASM from', wasmBaseUrl, '->', wasmRoot);
  }

  const fileset = await FilesetResolver.forVisionTasks(
    // Pass base URL (http). forVisionTasks expects a base to fetch the wasm assets.
    wasmBaseUrl
  );

  const handLandmarker = await HandLandmarker.createFromOptions(fileset, {
    baseOptions: {
      // Load model into memory to avoid fetch; pass as Uint8Array
      modelAssetBuffer: new Uint8Array(fs.readFileSync(modelPath)),
    },
    numHands: Math.max(1, Math.min(2, argv.hands)),
    runningMode: 'VIDEO',
  });

  const allFrames = [];
  const times = [];

  let frameIndex = 0;
  let firstDimsSet = false;

  pipe2jpeg.on('jpeg', async (jpegBuf) => {
    try {
      const decoded = jpeg.decode(jpegBuf, { useTArray: true });
      if (!firstDimsSet) {
        width = decoded.width;
        height = decoded.height;
        firstDimsSet = true;
      }
      // Ensure dimensions match
      if (decoded.width !== width || decoded.height !== height) {
        // Some streams might vary; for determinism, skip mismatched frames
        return;
      }
      const imageData = { data: decoded.data, width, height };
      const timestampMs = Math.round((frameIndex / argv.fps) * 1000);

  const res = await handLandmarker.detectForVideo(imageData, timestampMs);

      allFrames.push({
        frameIndex,
        timestampMs,
        hands: (res.handednesses || []).map((hd, idx) => ({
          handedness: hd.map(h => ({ categoryName: h.categoryName, score: h.score })),
          landmarks: (res.landmarks && res.landmarks[idx]) ? res.landmarks[idx].map(l => ({ x: l.x, y: l.y, z: l.z })) : [],
          worldLandmarks: (res.worldLandmarks && res.worldLandmarks[idx]) ? res.worldLandmarks[idx].map(l => ({ x: l.x, y: l.y, z: l.z })) : [],
        }))
      });

      times.push(timestampMs);
      frameIndex += 1;
    } catch (e) {
      console.error('Frame processing error:', e.message);
    }
  });

  ff.stdout.pipe(pipe2jpeg);

  await new Promise((resolve, reject) => {
    ff.on('close', (code) => {
      if (code === 0) resolve(); else reject(new Error(`ffmpeg exited with ${code}: ${ffmpegErr}`));
    });
    ff.on('error', reject);
  });

  // Write outputs
  // Read versions from local package.json (ESM-friendly)
  const pkgJson = JSON.parse(fs.readFileSync(path.join(workspaceRoot, 'package.json'), 'utf-8'));
  const meta = {
    input: path.relative(workspaceRoot, inputPath),
    output: path.relative(workspaceRoot, landmarksOut),
    fps: argv.fps,
    packageVersions: {
      '@mediapipe/tasks-vision': pkgJson.dependencies['@mediapipe/tasks-vision'],
      pipe2jpeg: pkgJson.dependencies['pipe2jpeg'],
      'jpeg-js': pkgJson.dependencies['jpeg-js'],
    },
    assets: {
      model: {
        path: path.relative(workspaceRoot, modelPath),
        sha256: sha256OfFile(modelPath),
      },
      wasm: fs.readdirSync(wasmRoot).filter(f => f.endsWith('.wasm')).map(f => ({
        path: path.relative(workspaceRoot, path.join(wasmRoot, f)),
        sha256: sha256OfFile(path.join(wasmRoot, f))
      })),
      wasmBaseUrl,
    },
    timestampsPolicy: 'timestampMs = round((frameIndex / fps) * 1000)'
  };

  fs.writeFileSync(landmarksOut, JSON.stringify(allFrames, null, 2));
  fs.writeFileSync(metaOut, JSON.stringify(meta, null, 2));
  fs.writeFileSync(timesOut, JSON.stringify(times, null, 2));

  console.log('Wrote:', path.relative(workspaceRoot, landmarksOut));
  console.log('Wrote:', path.relative(workspaceRoot, metaOut));
  console.log('Wrote:', path.relative(workspaceRoot, timesOut));

  if (server) {
    await new Promise((resolve) => server.close(() => resolve()))
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
