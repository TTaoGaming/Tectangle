#!/usr/bin/env node
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const goldensDir = path.join(root, 'data', 'goldens');

function utcStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const YYYY = d.getUTCFullYear();
  const MM = pad(d.getUTCMonth() + 1);
  const DD = pad(d.getUTCDate());
  const hh = pad(d.getUTCHours());
  const mm = pad(d.getUTCMinutes());
  const ss = pad(d.getUTCSeconds());
  return `${YYYY}-${MM}-${DD}T${hh}${mm}${ss}Z`;
}

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
  // Trim trailing newline if present before counting
  const trimmed = data.endsWith('\n') ? data.slice(0, -1) : data;
  if (!trimmed) return 0;
  return trimmed.split('\n').length;
}

async function getGitCommit() {
  try {
    const { execSync } = await import('node:child_process');
    const out = execSync('git rev-parse HEAD', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    return out;
  } catch {
    return null;
  }
}

async function readPackageJSON() {
  const pkgPath = path.join(root, 'package.json');
  const json = JSON.parse(await fsp.readFile(pkgPath, 'utf8'));
  return json;
}

async function main() {
  // Find JSONL goldens
  const entries = await fsp.readdir(goldensDir, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && e.name.endsWith('.jsonl'))
    .map((e) => path.join(goldensDir, e.name));

  if (files.length === 0) {
    console.error('No JSONL goldens found in', goldensDir);
    process.exit(1);
  }

  const stamp = utcStamp();
  const frozenDir = path.join(goldensDir, 'frozen', stamp);
  await fsp.mkdir(frozenDir, { recursive: true });

  const pkg = await readPackageJSON();
  const commit = await getGitCommit();

  const manifest = {
    kind: 'pinchfsm-goldens-manifest',
    version: 1,
    createdAt: new Date().toISOString(),
    commit,
    node: process.version,
    dependencies: pkg.dependencies ?? {},
    devDependencies: pkg.devDependencies ?? {},
    files: [],
  };

  for (const src of files) {
    const base = path.basename(src);
    const dst = path.join(frozenDir, base);
    await fsp.copyFile(src, dst);
    const [hash, size, frames] = await Promise.all([
      sha256(src),
      fsp.stat(src).then((s) => s.size),
      lineCount(src),
    ]);
    manifest.files.push({
      name: base,
      relativePath: path.relative(root, src).replace(/\\/g, '/'),
      sha256: hash,
      size,
      frames,
      frozenPath: path.relative(root, dst).replace(/\\/g, '/'),
    });
  }

  const manifestPath = path.join(frozenDir, 'manifest.json');
  await fsp.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  const pointerPath = path.join(goldensDir, 'manifest.current.json');
  await fsp.writeFile(pointerPath, JSON.stringify({ ref: path.relative(goldensDir, manifestPath).replace(/\\/g, '/') }, null, 2));

  console.log('Frozen manifest created at', path.relative(root, manifestPath));
  console.log('Updated pointer', path.relative(root, pointerPath));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
