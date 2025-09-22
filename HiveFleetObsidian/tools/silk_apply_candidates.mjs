// Apply filtered Silk Scribe candidates into hive history
// Usage:
//   node HiveFleetObsidian/tools/silk_apply_candidates.mjs --file <candidates.jsonl> [--include "Pinch|MVP"] [--limit 50] [--append]
// By default, prints selected lines. With --append, appends to hive_history.jsonl.

import fs from 'node:fs';
import path from 'node:path';

function arg(name, def='') { const i = process.argv.indexOf(`--${name}`); return i>-1 ? (process.argv[i+1]||'') : def; }
const file = arg('file');
if (!file) { console.error('Provide --file <candidates.jsonl>'); process.exit(2); }
const include = arg('include','');
const limit = Number(arg('limit','50'));
const doAppend = process.argv.includes('--append');

const rx = include ? new RegExp(include, 'i') : null;
const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean);

// Dedup by src and snapshot
const seen = new Set();
const picked = [];
for (const ln of lines) {
  try {
    const j = JSON.parse(ln);
    const key = `${j.src || ''}|${j.snapshot}`;
    if (seen.has(key)) continue;
    if (rx && !(rx.test(j.snapshot) || rx.test(j.lesson))) continue;
    picked.push(j);
    seen.add(key);
    if (picked.length >= limit) break;
  } catch {}
}

if (!doAppend) {
  for (const j of picked) console.log(JSON.stringify(j));
  console.log(`\n[Silk] Selected ${picked.length} line(s). Use --append to write to history.`);
  process.exit(0);
}

const baseNest = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const historyPath = path.join(baseNest, 'history', 'hive_history.jsonl');
fs.mkdirSync(path.dirname(historyPath), { recursive:true });
fs.appendFileSync(historyPath, picked.map(j=>JSON.stringify({ snapshot:j.snapshot, metric_delta:j.metric_delta, lesson:j.lesson })).join('\n') + '\n', 'utf8');
console.log(`[Silk] Appended ${picked.length} line(s) -> ${historyPath}`);

