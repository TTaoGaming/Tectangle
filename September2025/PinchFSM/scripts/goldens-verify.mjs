#!/usr/bin/env node
import fsp from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const goldensDir = path.join(root, 'data', 'goldens');

async function sha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function lineCount(filePath) {
  const data = await fsp.readFile(filePath, 'utf8');
  const trimmed = data.endsWith('\n') ? data.slice(0, -1) : data;
  if (!trimmed) return 0;
  return trimmed.split('\n').length;
}

async function main() {
  const pointerPath = path.join(goldensDir, 'manifest.current.json');
  const pointer = JSON.parse(await fsp.readFile(pointerPath, 'utf8'));
  const manifestPath = path.join(goldensDir, pointer.ref);
  const manifest = JSON.parse(await fsp.readFile(manifestPath, 'utf8'));

  const errors = [];
  for (const f of manifest.files) {
    const curPath = path.join(root, f.relativePath);
    try {
      const [hash, size, frames] = await Promise.all([
        sha256(curPath),
        fsp.stat(curPath).then((s) => s.size),
        lineCount(curPath),
      ]);
      if (hash !== f.sha256) errors.push(`${f.name}: sha256 mismatch`);
      if (size !== f.size) errors.push(`${f.name}: size mismatch`);
      if (frames !== f.frames) errors.push(`${f.name}: frame count mismatch`);
    } catch (e) {
      errors.push(`${f.name}: missing or unreadable (${e.message})`);
    }
  }

  if (errors.length) {
    console.error('Frozen golden verification FAILED');
    for (const e of errors) console.error(' -', e);
    process.exit(2);
  }
  console.log('Frozen golden verification PASSED for manifest', path.relative(root, manifestPath));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
