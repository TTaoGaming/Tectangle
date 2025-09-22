#!/usr/bin/env node
"use strict";

// CI helper: find direct uses of navigator.mediaDevices.getUserMedia outside allowlisted files
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const IGNORE_DIRS = new Set(['node_modules', '.git', '.history', 'offline-dependencies', 'archive-stale', '.github', 'dev/smoke', 'piano-genie-clone copy']);
const ALLOWLIST = [
  path.join('August Tectangle Sprint','foundation','src','CameraManager.js'),
  path.join('August Tectangle Sprint','foundation','src','audioManager.js'),
  path.join('August Tectangle Sprint','foundation','src','main.js'),
];

function walk(dir, files) {
  files = files || [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return files;
  }
  for (const ent of entries) {
    if (ent.isDirectory()) {
      if (IGNORE_DIRS.has(ent.name)) continue;
      walk(path.join(dir, ent.name), files);
    } else if (ent.isFile()) {
      if (ent.name.endsWith('.js')) files.push(path.join(dir, ent.name));
    }
  }
  return files;
}

const files = walk(ROOT);
const regex = /navigator\.mediaDevices\.getUserMedia\s*\(/;
const violations = [];
for (const file of files) {
  const rel = path.relative(ROOT, file);
  // focus on repository's project files under "August Tectangle Sprint"
  if (!rel.includes('August Tectangle Sprint')) continue;
  let content;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch (e) {
    continue;
  }
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (regex.test(lines[i])) {
      const normalized = rel.replace(/\\/g, '/');
      const allow = ALLOWLIST.some(a => normalized.endsWith(a.replace(/\\/g, '/')));
      if (!allow) {
        violations.push({ file: normalized, line: i + 1, code: lines[i].trim() });
      }
    }
  }
}

if (violations.length > 0) {
  console.error('Legacy getUserMedia usage detected outside allowed managers:');
  for (const v of violations) {
    console.error(`- ${v.file}:${v.line} -> ${v.code}`);
  }
  console.error('\nAllowed locations:', ALLOWLIST.map(a => a.replace(/\\/g, '/')).join(', '));
  process.exit(1);
}
console.log('No forbidden getUserMedia usage found.');
process.exit(0);