#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(path.join(__dirname, '..'));
const vendorRoot = path.join(root, 'vendor', 'mediapipe');
const modelPath = path.join(vendorRoot, 'models', 'hand_landmarker.task');
const wasmRootVendor = path.join(vendorRoot, 'wasm');
const wasmRootNode = path.join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');

async function checkFFmpeg() {
  // PATH ffmpeg
  const r = spawnSync('ffmpeg', ['-version'], { encoding: 'utf-8' });
  if (r.status === 0) return true;
  // npm ffmpeg-static fallback
  try {
  const ffStatic = await import('ffmpeg-static');
    const p = ffStatic.default || ffStatic;
    return !!(p && fs.existsSync(p));
  } catch {
    return false;
  }
}

function checkModel() {
  return fs.existsSync(modelPath);
}

function checkWasm() {
  const vendorOk = fs.existsSync(path.join(wasmRootVendor, 'vision_wasm_internal.wasm'));
  const nodeOk = fs.existsSync(path.join(wasmRootNode, 'vision_wasm_internal.wasm'));
  return vendorOk || nodeOk;
}

const main = async () => {
  const results = [
    { name: 'Node', ok: true, hint: process.version },
    { name: 'npm', ok: true, hint: process.env.npm_config_user_agent || 'npm' },
    { name: 'ffmpeg present (PATH or ffmpeg-static)', ok: await checkFFmpeg(), hint: 'Install ffmpeg or add ffmpeg-static' },
    { name: 'Model present (vendor/mediapipe/models/hand_landmarker.task)', ok: checkModel(), hint: 'Place model at vendor/mediapipe/models/hand_landmarker.task' },
    { name: 'WASM present (vendor or node_modules)', ok: checkWasm(), hint: 'Ensure MediaPipe vision_wasm_internal.wasm available' },
  ];

  let allOk = true;
  for (const r of results) {
    const status = r.ok ? 'PASS' : 'FAIL';
    if (!r.ok) allOk = false;
    console.log(`${status} - ${r.name}${r.hint ? ` (${r.hint})` : ''}`);
  }

  process.exit(allOk ? 0 : 1);
};

main();
