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

// WEBWAY:ww-2025-004: Focused test runner — maps changed src files to probable unit tests.
// Heuristic: if a src file fooBar.js changes, look for tests whose filename starts with fooBar.*test.mjs
// Fallback strategy: exit code 1 triggers full suite in hook; exit 0 means success.
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const changed = process.argv.slice(2).filter(Boolean);
if(!changed.length){
  console.log('[focused] No changed files provided.');
  process.exit(1); // Force fallback
}

const testDir = 'September2025/TectangleHexagonal/tests/unit';
if(!fs.existsSync(testDir)){
  console.warn('[focused] Test directory missing:', testDir);
  process.exit(1);
}

function probableTestsFor(srcPath){
  if(!srcPath.startsWith('September2025/TectangleHexagonal/src/')) return [];
  const base = srcPath.split('/').pop().replace(/\.m?js$/,'');
  const entries = fs.readdirSync(testDir);
  return entries.filter(e=> e.startsWith(base) && e.endsWith('.test.mjs')).map(e=> testDir + '/' + e);
}

const testSet = new Set();
for(const f of changed){
  for(const t of probableTestsFor(f)) testSet.add(t);
}

if(!testSet.size){
  console.log('[focused] No direct test name matches; attempting mapping by folder segments.');
  // Fallback heuristic: map src/core/foo/pinchCore.js -> tests containing 'pinchCore'
  const entries = fs.readdirSync(testDir);
  for(const f of changed){
    const token = f.split('/').pop().replace(/\.m?js$/,'');
    for(const e of entries){
      if(e.includes(token) && e.endsWith('.test.mjs')) testSet.add(testDir + '/' + e);
    }
  }
}

if(!testSet.size){
  console.log('[focused] Still no matches; forcing fallback.');
  process.exit(1);
}

const files = [...testSet];
console.log('[focused] Running tests:', files.join(' '));
const res = spawnSync(process.execPath, ['node_modules/mocha/bin/mocha.js', ...files, '--exit'], { stdio: 'inherit' });
process.exit(res.status ?? 1);