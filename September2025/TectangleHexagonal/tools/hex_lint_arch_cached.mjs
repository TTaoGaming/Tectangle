#!/usr/bin/env node
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

// WEBWAY:ww-2025-004: Cached depcruise boundary lint
// Strategy: build a hash over config file + list of source .js files (names + mtime + size).
// If hash matches previous run (stored in .cache/hex_lint_arch.hash), skip running depcruise.
// Always run full lint if FORCE_HEX_LINT=1 or cache missing.
import crypto from 'node:crypto';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const CONFIG = 'September2025/TectangleHexagonal/config/hex-boundary.cjs';
const SRC_ROOT = 'September2025/TectangleHexagonal/src';
const CACHE_DIR = '.cache';
const CACHE_FILE = path.join(CACHE_DIR, 'hex_lint_arch.hash');

function listJs(dir){
  const out = [];
  if(!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for(const e of entries){
    const p = path.join(dir, e.name);
    if(e.isDirectory()) out.push(...listJs(p));
    else if(/\.js$/i.test(e.name)) out.push(p);
  }
  return out;
}

function buildSignature(){
  const h = crypto.createHash('sha256');
  if(fs.existsSync(CONFIG)){
    h.update(fs.readFileSync(CONFIG));
  }
  const files = listJs(SRC_ROOT).sort();
  for(const f of files){
    try {
      const st = fs.statSync(f);
      h.update(f);
      h.update(String(st.size));
      h.update(String(st.mtimeMs));
    } catch{}
  }
  return h.digest('hex');
}

function runDepcruise(){
  // Try npm script first
  let res = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run','-s','hex:lint-arch'], { stdio:'inherit', shell:true });
  if((res.status ?? 1) !== 0){
    // Fallback direct depcruise (some shells on Windows quoting issues)
    const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    res = spawnSync(cmd + ` depcruise --config ${CONFIG} ${SRC_ROOT}/**/*.js`, { stdio:'inherit', shell:true });
  }
  return res.status ?? 1;
}

function main(){
  const force = process.env.FORCE_HEX_LINT === '1';
  const sig = buildSignature();
  if(!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive:true });
  if(force || !fs.existsSync(CACHE_FILE)){
    console.error('[hex-lint-cache] No cache or force flag; running depcruise');
    const code = runDepcruise();
    console.error('[hex-lint-cache] depcruise exit code (initial):', code);
    if(code === 0){
      fs.writeFileSync(CACHE_FILE, sig, 'utf8');
      process.exit(0);
    }
    process.exit(code || 1);
  }
  const prev = fs.readFileSync(CACHE_FILE, 'utf8').trim();
  if(prev === sig){
    console.error('[hex-lint-cache] Unchanged boundary graph; skip depcruise');
    process.exit(0);
  }
  console.error('[hex-lint-cache] Changes detected; running depcruise');
  const code = runDepcruise();
  console.error('[hex-lint-cache] depcruise exit code (changed):', code);
  if(code === 0){
    fs.writeFileSync(CACHE_FILE, sig, 'utf8');
    process.exit(0);
  }
  process.exit(code || 1);
}

main();