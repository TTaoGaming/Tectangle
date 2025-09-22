// Append a single history JSON line to the hive history
// Usage: node HiveFleetObsidian/tools/append_history.mjs --snapshot "..." --metric "..." --lesson "..."

import fs from 'node:fs';
import path from 'node:path';

function arg(name, def=''){ const i = process.argv.indexOf(`--${name}`); return i> -1 ? (process.argv[i+1]||'') : def; }

const snapshot = arg('snapshot');
const metric = arg('metric','n/a');
const lesson = arg('lesson','');
const type = arg('type','event');

// Support both CamelCase and lowercase nest directory names
const root = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const historyPath = path.join(root, 'history', 'hive_history.jsonl');

if(!snapshot){
  console.error('Provide --snapshot "..."');
  process.exit(2);
}

fs.mkdirSync(path.dirname(historyPath), { recursive:true });
const ts = new Date().toISOString();
const line = JSON.stringify({ ts, type, snapshot, metric_delta: metric, lesson });
fs.appendFileSync(historyPath, line + '\n', 'utf8');
console.log('Scribe appended ->', historyPath);
