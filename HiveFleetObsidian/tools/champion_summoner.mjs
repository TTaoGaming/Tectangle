// Champion Summoner: seed per-champion summon prompts and Naked Canon templates
// Usage: node HiveFleetObsidian/tools/champion_summoner.mjs [--apply]
// - Creates docs/summon.md (prompt) and docs/canon.md (naked canon skeleton)
// - Creates docs/persona.md if missing (skeleton)

import fs from 'node:fs';
import path from 'node:path';
import { champions } from './champion_registry.mjs';

const APPLY = process.argv.includes('--apply');

const baseNest = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const champRoot = path.join(baseNest, 'honeycomb', 'champions');

const seatById = {
  thread_sovereign: 'exploit',
  faultline_seeker: 'explore',
  prism_magus: 'pivot',
  web_cartographer: 'reorient',
};

function ensureDir(p){ fs.mkdirSync(p, { recursive:true }); }
function writeFileOnce(p, content){ if (!fs.existsSync(p)) fs.writeFileSync(p, content, 'utf8'); }
function writeFile(p, content){ fs.writeFileSync(p, content, 'utf8'); }

function summonPrompt(c){
  const seat = seatById[c.id] || c.role.toLowerCase();
  return `# Summon ${c.name}\n\n`+
  `You are ${c.name} of Hive Fleet Obsidian. Introduce yourself and draft your minimal Persona and Naked Canon.\n\n`+
  `Return Markdown under 12 lines total.\n\n`+
  `Sections (keep brief):\n- Persona: Intro (1), Biases (1), Tradeoffs (1), Lineage (1), Alt names (1)\n- Naked Canon: one-liner identity + 3 short rules you keep\n- Seat (if core): ${seat.toUpperCase()} — one-sentence how you move the metric today\n`;
}

function canonSkeleton(c){
  return `# ${c.name} — Naked Canon\n\n`+
  `One-liner: <fill>\n\n`+
  `Rules I keep\n- <rule 1>\n- <rule 2>\n- <rule 3>\n`;
}

function personaSkeleton(c){
  return `# ${c.name} — Persona Card (skeleton)\n\n`+
  `- Intro: <one line>\n- Main bias: <one line>\n- Tradeoffs: <one line>\n- Myth/archetype lineage: <one line>\n- Historical lineage: <one line>\n- Alt names: <comma-separated>\n`;
}

const results = [];
for (const c of champions){
  const dir = path.join(champRoot, c.pascal, 'docs');
  ensureDir(dir);
  const summonPath = path.join(dir, 'summon.md');
  const canonPath = path.join(dir, 'canon.md');
  const personaPath = path.join(dir, 'persona.md');

  const did = { id:c.id, name:c.name, wrote:[] };

  // Always (re)write summon and canon when --apply; otherwise seed if missing
  const summonText = summonPrompt(c);
  const canonText = canonSkeleton(c);

  function isCustomized(p){
    if (!fs.existsSync(p)) return false;
    try{
      const txt = fs.readFileSync(p,'utf8');
      // treat files without placeholders as customized
      return !(/<fill>/i.test(txt) || /Naked Canon|Persona Card \(skeleton\)/i.test(txt));
    }catch{ return false; }
  }

  // Summon: overwrite on apply unless customized
  if (APPLY && !isCustomized(summonPath)) { writeFile(summonPath, summonText); did.wrote.push('summon.md'); }
  else if (!fs.existsSync(summonPath)) { writeFile(summonPath, summonText); did.wrote.push('summon.md'); }

  // Canon: overwrite on apply unless customized
  if (APPLY && !isCustomized(canonPath)) { writeFile(canonPath, canonText); did.wrote.push('canon.md'); }
  else if (!fs.existsSync(canonPath)) { writeFile(canonPath, canonText); did.wrote.push('canon.md'); }

  // Persona only if missing
  if (!fs.existsSync(personaPath)){
    writeFileOnce(personaPath, personaSkeleton(c));
    did.wrote.push('persona.md (skeleton)');
  }

  results.push(did);
}

// Aggregate index
const aggDir = path.join(baseNest, 'honeycomb');
ensureDir(aggDir);
const aggPath = path.join(aggDir, 'CHAMPION_PERSONAS.md');
let md = `# Champion Intros & Canons (generated)\n\n`;
for (const c of champions){
  md += `- ${c.name}: honeycomb/champions/${c.pascal}/docs/persona.md | summon.md | canon.md\n`;
}
writeFile(aggPath, md);

console.log(`[Summoner] Wrote prompts/canon for ${results.length} champions under ${champRoot}`);
for (const r of results){ if (r.wrote.length) console.log(` - ${r.name}: ${r.wrote.join(', ')}`); }
