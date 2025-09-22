// Forge per-champion honeycomb hex structures (core/ports/adapters/docs/tests)
// Usage: node HiveFleetObsidian/tools/honeycomb_forge.mjs

import fs from 'node:fs';
import path from 'node:path';
import { champions } from './champion_registry.mjs';

const baseNest = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const root = path.join(baseNest, 'honeycomb', 'champions');

function ensureDir(p){ fs.mkdirSync(p, { recursive:true }); }

function writeFileOnce(p, content){ if (!fs.existsSync(p)) fs.writeFileSync(p, content, 'utf8'); }

function scaffoldChampion(c){
  const base = path.join(root, c.pascal);
  ensureDir(base);
  const dirs = ['core','ports','adapters','docs','tests'];
  for (const d of dirs) ensureDir(path.join(base, d));
  const readme = `# ${c.name} — ${c.role}\n\nIntent: ${c.intent}\n\nHex Layout\n- core: domain logic\n- ports: interfaces (contracts)\n- adapters: CLI/FS/integration\n- docs: plans, notes, indices\n- tests: focused checks\n\nPorts\n${c.ports.map(p=>`- ${p}`).join('\n')}\n`;
  writeFileOnce(path.join(base, 'README.md'), readme);
  const portsDoc = `# Ports for ${c.name}\n\n${c.ports.map(p=>`- ${p}: TBD (contract)`).join('\n')}\n`;
  writeFileOnce(path.join(base, 'ports', 'README.md'), portsDoc);
  const plan = `# Plan — ${c.name}\n\n- [ ] Define ports (names above)\n- [ ] Identify 1-2 adapters to start\n- [ ] Add one focused test\n- [ ] Wire status into champions_status.mjs\n`;
  writeFileOnce(path.join(base, 'docs', 'plan.md'), plan);
  writeFileOnce(path.join(base, 'tests', 'README.md'), `Tests for ${c.name}\n`);
}

ensureDir(root);
for (const c of champions) scaffoldChampion(c);

// Write roster manifest
const manifestPath = path.join(baseNest, 'honeycomb', 'roster.json');
fs.writeFileSync(manifestPath, JSON.stringify({ generatedAt: new Date().toISOString(), roster: champions }, null, 2));

console.log(`[Forge] Honeycomb hexes created for ${champions.length} champions under ${root}`);
