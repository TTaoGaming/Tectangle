/*
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
 - [ ] Re-evaluate this artifact against current Hexagonal goals
 - [ ] Exercise the CLI entry point end-to-end
 - [ ] Log decisions in TODO_2025-09-16.md
*/

// Fetch and extract wayou/t-rex-runner (gh-pages) into vendor/dino
// Usage: node September2025/TectangleHexagonal/tools/fetch_dino_vendor.mjs
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import https from 'node:https';
import { spawn } from 'node:child_process';

const VENDOR_DIR = path.resolve('September2025/TectangleHexagonal/vendor/dino');
const ZIP_URL = 'https://codeload.github.com/wayou/t-rex-runner/zip/refs/heads/gh-pages';

function download(url, dest){
  return new Promise((resolve, reject)=>{
    const file = fs.createWriteStream(dest);
    https.get(url, res=>{
      if(res.statusCode !== 200){ reject(new Error(`HTTP ${res.statusCode}`)); return; }
      res.pipe(file);
      file.on('finish', ()=> file.close(()=> resolve(dest)));
    }).on('error', reject);
  });
}

async function unzip(zipPath, outDir){
  // Prefer powershell Expand-Archive on Windows, else use tar if available
  if(process.platform === 'win32'){
    await new Promise((resolve, reject)=>{
      const ps = spawn('powershell', ['-NoProfile','-Command', `Expand-Archive -Path '${zipPath}' -DestinationPath '${outDir}' -Force`], { stdio:'inherit' });
      ps.on('exit', code=> code === 0 ? resolve() : reject(new Error('Expand-Archive failed')));
    });
  } else {
    await new Promise((resolve, reject)=>{
      const tar = spawn('tar', ['-xzf', zipPath, '-C', outDir], { stdio:'inherit' });
      tar.on('exit', code=> code === 0 ? resolve() : reject(new Error('tar failed')));
    });
  }
}

async function main(){
  fs.mkdirSync(VENDOR_DIR, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dino-'));
  const zipPath = path.join(tmp, 'dino.zip');
  console.log('[dino] Downloading...', ZIP_URL);
  await download(ZIP_URL, zipPath);
  console.log('[dino] Unzipping...');
  await unzip(zipPath, tmp);
  const root = fs.readdirSync(tmp).find(n=> n.startsWith('t-rex-runner-'));
  if(!root) throw new Error('Extract root not found');
  const src = path.join(tmp, root);
  // Copy minimal needed files
  for(const f of ['index.html','index.js','index.css']){
    fs.copyFileSync(path.join(src, f), path.join(VENDOR_DIR, f));
  }
  // Copy assets directory recursively
  const assetsSrc = path.join(src, 'assets');
  const assetsDst = path.join(VENDOR_DIR, 'assets');
  fs.rmSync(assetsDst, { recursive:true, force:true });
  fs.cpSync(assetsSrc, assetsDst, { recursive:true });
  console.log('[dino] Ready at', VENDOR_DIR);
  // Silk Scribe SRL append
  try {
    const { spawnSync } = await import('node:child_process');
    const args = [
      'HiveFleetObsidian/tools/append_history.mjs',
      '--snapshot', 'Adopted official BSD-3 Dino Runner under vendor/dino',
      '--metric', 'vendor+1',
      '--lesson', 'Pinch→Space bridge enables deterministic 1-button demo',
      '--type', 'srl'
    ];
    const r = spawnSync('node', args, { stdio:'inherit' });
    if(r.status !== 0) console.warn('[dino] SRL append returned code', r.status);
  } catch (e) { console.warn('[dino] SRL append failed:', e?.message); }
}

main().catch(err=>{ console.error('[dino] Failed:', err.message); process.exit(1); });
