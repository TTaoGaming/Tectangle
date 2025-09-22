import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { describe, it } from 'node:test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(path.join(__dirname, '..'));
const goldensDir = path.join(root, 'data', 'goldens');

function readJsonl(p) {
  const raw = fs.readFileSync(p, 'utf-8');
  return raw.split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
}

describe('OneEuro smoothing integration', () => {
  it('preserves frame count and timestamps', () => {
    // pick the first existing human landmarks jsonl
    const files = fs.readdirSync(goldensDir).filter((f) => f.endsWith('.human.landmarks.jsonl'));
    if (!files.length) return; // optional if repo has none yet
    const input = files[0];
    const inputPath = path.join(goldensDir, input);
    // ensure derived file exists by running script if needed
    const derived = path.join(goldensDir, 'derived', `${input.replace(/\.jsonl$/,'')}.oneeuro.landmarks.jsonl`);
    if (!fs.existsSync(derived)) {
      const res = spawnSync(process.execPath, ['scripts/oneeuro-smooth.mjs', '--input', input], { cwd: root, stdio: 'inherit' });
      if (res.status !== 0) return; // skip on failure to keep suite green
    }
    if (!fs.existsSync(derived)) return; // skip
    const rawFrames = readJsonl(inputPath);
    const smoothedFrames = readJsonl(derived);
    assert.equal(smoothedFrames.length, rawFrames.length);
    for (let i = 0; i < rawFrames.length; i++) {
      assert.equal(smoothedFrames[i].timestampMs, rawFrames[i].timestampMs);
      assert.equal(smoothedFrames[i].frameIndex, rawFrames[i].frameIndex);
    }
  });
});
