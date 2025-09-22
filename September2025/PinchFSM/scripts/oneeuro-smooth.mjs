#!/usr/bin/env node
// Read raw JSONL frames and write OneEuro-smoothed derived JSONL preserving timestamps
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { OneEuroFilter, OneEuroPresets } from '../src/filters/oneEuro.mjs';
import { ControllerTracker } from '../src/identity/controllerTracker.mjs';
import { clampWrist } from '../src/kinematics/clamp.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(path.join(__dirname, '..'));
const goldensDir = path.join(root, 'data', 'goldens');
const derivedDir = path.join(goldensDir, 'derived');

const argv = yargs(hideBin(process.argv))
  .option('input', { type: 'string', describe: 'Input raw JSONL filename (in data/goldens)', demandOption: true })
  .option('preset', { type: 'string', choices: ['Responsive', 'Balanced', 'Smooth'], default: 'Balanced' })
  .option('minCutoff', { type: 'number' })
  .option('beta', { type: 'number' })
  .option('dCutoff', { type: 'number' })
  .strict()
  .help()
  .argv;

const inPath = path.isAbsolute(argv.input) ? argv.input : path.join(goldensDir, argv.input);
if (!fs.existsSync(inPath)) {
  console.error('Input not found:', inPath);
  process.exit(1);
}

const preset = OneEuroPresets[argv.preset] || OneEuroPresets.Balanced;
const params = {
  minCutoff: argv.minCutoff ?? preset.minCutoff,
  beta: argv.beta ?? preset.beta,
  dCutoff: argv.dCutoff ?? preset.dCutoff,
};

fs.mkdirSync(derivedDir, { recursive: true });
const base = path.basename(inPath).replace(/\.jsonl$/i, '');
const outPath = path.join(derivedDir, `${base}.oneeuro.landmarks.jsonl`);

const lines = fs.readFileSync(inPath, 'utf-8').split(/\r?\n/).filter(Boolean);

// state
let filters = []; // [hand][landmark] -> {x,y,z}
const tracker = new ControllerTracker();
let lastWristById = new Map();

function ensureFilters(numHands, numLandmarks) {
  while (filters.length < numHands) filters.push([]);
  for (let h = 0; h < numHands; h++) {
    if (!filters[h] || filters[h].length !== numLandmarks) {
      filters[h] = [];
      for (let i = 0; i < numLandmarks; i++) {
        filters[h].push({
          x: new OneEuroFilter(params),
          y: new OneEuroFilter(params),
          z: new OneEuroFilter(params),
        });
      }
    }
  }
  if (filters.length > numHands) filters.length = numHands;
}

const out = fs.createWriteStream(outPath, { encoding: 'utf-8' });
let lineCount = 0;
for (const line of lines) {
  const frame = JSON.parse(line);
  const t = frame.timestampMs;
  const hands = frame.hands || [];

  ensureFilters(hands.length, 21);
  const ids = tracker.assign(hands, t);

  const newHands = [];
  for (let h = 0; h < hands.length; h++) {
    const hand = hands[h];
    const id = ids[h]?.id || null;
    const lm = hand.landmarks || [];

    // optional clamp on wrist (landmark 0)
    const lastWrist = id ? lastWristById.get(id) : null;
    const currentWrist = lm[0] || { x: 0, y: 0, z: 0 };
    const { point: clampedWrist, clamped } = clampWrist(currentWrist, lastWrist, 0.15);
    if (id) lastWristById.set(id, clampedWrist);

    const smoothed = [];
    for (let i = 0; i < 21; i++) {
      const p = lm[i] || { x: 0, y: 0, z: 0 };
      const f = filters[h][i];
      const sx = f.x.filter(i === 0 ? clampedWrist.x : p.x, t);
      const sy = f.y.filter(i === 0 ? clampedWrist.y : p.y, t);
      const sz = f.z.filter(i === 0 ? clampedWrist.z : p.z, t);
      smoothed.push({ x: sx, y: sy, z: sz });
    }

    newHands.push({
      handedness: hand.handedness,
      controllerId: id,
      landmarks: smoothed,
      meta: { clamped: !!clamped },
    });
  }

  const outFrame = { frameIndex: frame.frameIndex, timestampMs: t, hands: newHands };
  out.write(JSON.stringify(outFrame) + '\n');
  lineCount++;
}
out.end();
console.log(`Wrote ${lineCount} frames to ${path.relative(root, outPath)} with params`, params);
