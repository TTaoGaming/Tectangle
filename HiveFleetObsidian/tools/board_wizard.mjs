// Board Wizard: interactively create or refresh BOARD.current.txt in plain language
// Usage: node HiveFleetObsidian/tools/board_wizard.mjs [--quick]
// - --quick: do not prompt for fields that already exist; accept Enter to keep defaults

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

function arg(name){ return process.argv.includes(`--${name}`); }

const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const boardPath = path.join(base, 'BOARD.current.txt');

function readBoard(){
  const fields = { problem:'', metric:'', constraint:'', horizons:'', current:'' };
  if (!fs.existsSync(boardPath)) return fields;
  const raw = fs.readFileSync(boardPath, 'utf8');
  for (const line of raw.split(/\r?\n/)){
    const m = line.match(/^(Problem|Metric|Constraint|Horizons|Current):\s*(.*)$/i);
    if (m) fields[m[1].toLowerCase()] = m[2].trim();
  }
  return fields;
}

function writeBoard(fields){
  const now = new Date().toISOString();
  const out = [
    `Problem: ${fields.problem||''}`,
    `Metric: ${fields.metric||'hfo_sailworthy'}`,
    `Constraint: ${fields.constraint||'Node>=18; reversible steps; reuse goldens'}`,
    `Horizons: ${fields.horizons||'1h=<today> | 1d=<tomorrow> | 1w=<this week> | 1m=<this month>'}`,
    `Current: ${fields.current||'<what we\'re doing now>'}; updated: ${now}`
  ].join('\n');
  fs.mkdirSync(path.dirname(boardPath), { recursive:true });
  fs.writeFileSync(boardPath, out, 'utf8');
  console.log('[Board] Wrote ->', boardPath);
}

async function main(){
  const quick = arg('quick');
  const rl = readline.createInterface({ input, output });
  try{
    const cur = readBoard();
    async function ask(label, key, hint){
      if (quick && cur[key]) return cur[key];
      const def = cur[key] ? ` (${cur[key]})` : '';
      const q = `${label}${def}${hint?` — ${hint}`:''}: `;
      const ans = (await rl.question(q)).trim();
      return ans || cur[key] || '';
    }
    const fields = {
      problem: await ask('Problem', 'problem', 'one sentence'),
      metric: await ask('Metric', 'metric', 'e.g., demo_unblocked, error_rate↓'),
      constraint: await ask('Constraint', 'constraint', 'e.g., Node>=18; reversible; no new deps'),
      horizons: await ask('Horizons', 'horizons', '1h/1d/1w/1m'),
      current: await ask('Current', 'current', 'what we are doing now'),
    };
    writeBoard(fields);
  }finally{
    rl.close();
  }
}

await main();

