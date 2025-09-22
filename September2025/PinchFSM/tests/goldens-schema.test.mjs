import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { TraceArrayZ } from '../src/schemas.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(path.join(__dirname, '..'));
const goldensDir = path.join(root, 'data', 'goldens');

function read(name) {
  const p = path.join(goldensDir, name);
  const raw = fs.readFileSync(p, 'utf-8');
  if (name.endsWith('.jsonl')) {
    const arr = raw.split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line));
    return arr;
  }
  return JSON.parse(raw);
}

function baseOf(p) {
  return path.basename(p).replace(/\.[^.]+$/, '');
}

const examples = [
  '../../right hand hand oriented towards the camera and wrist to middle knuckle pointing up index to thumb pinch.mp4',
  '../../right hand palm oriented to my left index and thumb pinch should be GATED.mp4'
].map(p => baseOf(p));

for (const base of examples) {
  describe(`Golden outputs for ${base}`, () => {
  it('landmarks file exists (Human or MediaPipe)', () => {
      const candidates = [
    `${base}.human.landmarks.jsonl`,
    `${base}.human.landmarks.json`,
        `${base}.landmarks.json`
      ];
      const found = candidates.find(f => fs.existsSync(path.join(goldensDir, f)));
      assert.ok(found, `no landmarks found for ${base}`);
    });

    it('landmarks shape should be valid and timestamps numeric', () => {
  const candidates = [`${base}.human.landmarks.jsonl`, `${base}.human.landmarks.json`, `${base}.landmarks.json`];
      const found = candidates.find(f => fs.existsSync(path.join(goldensDir, f)));
      assert.ok(found, `no landmarks found for ${base}`);
      const data = read(found);
  const parsed = Array.isArray(data) ? TraceArrayZ.safeParse(data) : { success: false };
      assert.equal(parsed.success, true, parsed.success ? 'ok' : JSON.stringify(parsed.error.issues, null, 2));
      assert.ok(Array.isArray(data) && data.length > 0, 'no frames');
      assert.equal(typeof data[0].timestampMs, 'number');
    });

    it('optional meta has determinism invariants if present', () => {
      const humanMeta = `${base}.human.meta.json`;
      const mpMeta = `${base}.meta.json`;
      const metaFile = [humanMeta, mpMeta].find(f => fs.existsSync(path.join(goldensDir, f)));
      if (!metaFile) return; // optional
      const meta = read(metaFile);
      assert.equal(meta.timestampsPolicy.includes('round((frameIndex / fps) * 1000)'), true);
      assert.ok(meta.packageVersions);
      // Accept either Human or MediaPipe packages
      assert.ok(
        meta.packageVersions['@vladmandic/human'] || meta.packageVersions['@mediapipe/tasks-vision'],
        'expected Human or MediaPipe package version in meta'
      );
    });

    it('optional times file aligns with frames if present', () => {
  const candidates = [`${base}.human.landmarks.jsonl`, `${base}.human.landmarks.json`, `${base}.landmarks.json`];
      const found = candidates.find(f => fs.existsSync(path.join(goldensDir, f)));
      assert.ok(found, `no landmarks found for ${base}`);
      const timesCandidates = [
        `${base}.human.golden_times.json`,
        `${base}.golden_times.json`
      ];
      const timesFile = timesCandidates.find(f => fs.existsSync(path.join(goldensDir, f)));
      if (!timesFile) return; // optional
      const frames = read(found);
      const times = read(timesFile);
      assert.equal(Array.isArray(times), true);
      assert.equal(times.length, frames.length);
    });
  });
}
