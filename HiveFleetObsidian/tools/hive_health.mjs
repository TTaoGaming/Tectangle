// Hive Fleet Health & Pareto Analysis
// Usage: node HiveFleetObsidian/tools/hive_health.mjs [--snapshot]
// Produces JSON summary to stdout. Optionally writes a snapshot inventory file.
// Classification goals:
//  - center_of_gravity: core coordinating assets (seeds, board, orchestrator tools)
//  - frequently_invoked: tools referenced by npm scripts
//  - supporting: referenced indirectly (naming heuristics) or shared libs
//  - archive_candidate: never referenced + low heuristic weight (lines < 120) + not in allowlist
// Shield: No deletions; only propose archive candidates.

import fs from 'node:fs';
import path from 'node:path';

const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const toolsDir = path.join(base, 'tools');
const seedsDir = path.join(base, 'Seeds');
const pkgPath = 'package.json';

function readJSON(p){ try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch { return null; } }
const pkg = readJSON(pkgPath) || { scripts:{} };
const scriptVals = Object.values(pkg.scripts||{});

function listTools(){
  const out = [];
  for (const f of fs.readdirSync(toolsDir)){
    if (!/\.mjs$/i.test(f)) continue;
    const p = path.join(toolsDir,f);
    const txt = fs.readFileSync(p,'utf8');
    const lines = txt.split(/\r?\n/).length;
    out.push({ file:f, path:p, lines });
  }
  return out;
}

function listSeeds(){
  const out = [];
  for (const f of fs.readdirSync(seedsDir)){
    if (!f.endsWith('.seed.yaml')) continue;
    out.push(f);
  }
  return out;
}

const tools = listTools();
const seeds = listSeeds();

// Determine references via package.json scripts
const referenced = new Set();
for (const s of scriptVals){
  for (const t of tools){
    if (s.includes(t.file)) referenced.add(t.file);
  }
}

// Heuristic allowlist (core coordination / safety)
const allowCore = new Set([
  'orchestrator_turn.mjs','moe_chat.mjs','append_history.mjs','board_freshness.mjs','history_rollup.mjs',
  'validate_seeds_suite.mjs','validate_seeds_chatmode.mjs','hive_daily.mjs','response_shape_lint.mjs','latest_turn_lint.mjs'
]);

// Tag classes
for (const t of tools){
  const name = t.file;
  const core = allowCore.has(name) || /orchestrator|moe_chat|scribe|board_freshness|history_rollup/.test(name);
  t.isCore = core;
  t.referenced = referenced.has(name);
  // Lightweight usage heuristic: small file & unreferenced & not core
  t.archiveCandidate = (!core && !t.referenced && t.lines < 120);
}

const centerOfGravity = {
  seeds: seeds.length,
  toolCoreCount: tools.filter(t=>t.isCore).length,
  boardExists: fs.existsSync(path.join(base,'BOARD.current.txt')),
  historyExists: fs.existsSync(path.join(base,'history','hive_history.jsonl'))
};

const archiveCandidates = tools.filter(t=>t.archiveCandidate).map(t=>({ file:t.file, lines:t.lines }));

// Pareto: top 20% of tools by line count (proxy for complexity) that are referenced
const sortedByLines = [...tools].sort((a,b)=>b.lines-a.lines);
const topN = Math.max(1, Math.round(sortedByLines.length*0.2));
const paretoFocus = sortedByLines.slice(0, topN).map(t=>({ file:t.file, lines:t.lines, referenced:t.referenced }));

const summary = {
  meta: { generated: new Date().toISOString(), toolCount: tools.length, seedCount: seeds.length },
  center_of_gravity: centerOfGravity,
  pareto_focus: paretoFocus,
  archive_candidates: archiveCandidates,
  stats: {
    referenced: tools.filter(t=>t.referenced).length,
    core: tools.filter(t=>t.isCore).length,
    proposedArchive: archiveCandidates.length
  },
  guidance: {
    action_order: [
      '1. Keep seeds validated (run hive:seeds:suite).',
      '2. Ensure board freshness before orchestrator_turn.',
      '3. Stabilize core generation paths (orchestrator_turn -> moe_chat -> append_history).',
      '4. Roll up history weekly (hive:history:rollup:week) and create weekly summary.',
      '5. Review archive candidates; move to archive/ after 7 days of no references.'
    ]
  }
};

console.log(JSON.stringify(summary,null,2));

if (process.argv.includes('--snapshot')){
  const snapDir = path.join(base,'analysis');
  fs.mkdirSync(snapDir,{ recursive:true });
  const ts = new Date().toISOString().replace(/[:]/g,'-');
  const file = path.join(snapDir, `tool_inventory_${ts}.json`);
  fs.writeFileSync(file, JSON.stringify(summary,null,2));
  console.error('[health] snapshot saved ->', file);
}
