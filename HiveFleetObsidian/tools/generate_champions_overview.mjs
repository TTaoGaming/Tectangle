// Generate a concise champions overview Markdown from canon/persona + tool checks
// Output: HiveFleetObsidian/honeycomb/CHAMPIONS_OVERVIEW.md

import fs from 'node:fs';
import path from 'node:path';
import { champions as registry } from './champion_registry.mjs';

const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const champRoot = path.join(base, 'honeycomb', 'champions');
const outPath = path.join(base, 'honeycomb', 'CHAMPIONS_OVERVIEW.md');

function flag(name){ return process.argv.includes(`--${name}`); }
function arg(name, def=''){ const i = process.argv.indexOf(`--${name}`); return i>-1 ? (process.argv[i+1]||def) : def; }
const WITH_PERSONA = flag('with-persona');
const VERBOSE = flag('verbose');

const seatById = {
  thread_sovereign: 'Exploit',
  faultline_seeker: 'Explore',
  prism_magus: 'Pivot',
  web_cartographer: 'Reorient',
};

const toolChecks = (function(){
  const j = p => path.join(base, ...p.split('/'));
  return {
    silk_scribe: [j('tools/append_history.mjs')],
    honeycomb_smith: [j('tools/honeycomb_smith.mjs')],
    web_cartographer: [j('tools/web_cartographer.mjs')],
    thread_sovereign: [j('tools/bootstrap.mjs')],
    faultline_seeker: [j('tools/portable_replay_from_trace.mjs')],
    prism_magus: [j('tools/prism_reframe.mjs')],
    lattice_steward: [j('tools/run_frozen_smoke.mjs')],
    window_hunter: [j('tools/pack_portable.mjs')],
    safebreaker: [j('tools/safebreaker_pivot.mjs')],
    first_principles: [j('tools/first_principles_summarize.mjs')],
    swarm_jester: [j('tools/swarm_jester_ideas.mjs')],
    concord_weaver: [j('tools/concord_weaver_checklist.mjs')],
    signal_warden: [j('tools/signal_warden_audit.mjs')],
    shadow_auditor: [j('tools/shadow_auditor_probes.mjs')],
  };
})();

function readText(p){ try { return fs.readFileSync(p,'utf8'); } catch { return ''; } }
function extract(linePrefix, txt){
  // Accept lines starting with optional bullet "- " and then the prefix
  const rx = new RegExp(`^\s*-?\s*${linePrefix.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}`, 'i');
  const line = (txt||'').split(/\r?\n/).find(l=> rx.test(l.trim()) );
  if(!line) return '';
  const raw = line.replace(/^\s*-\s*/,'');
  return raw.split(':').slice(1).join(':').trim();
}
function extractOneLiner(txt){ return extract('One-liner:', txt); }
function extractSuccess(txt){ return extract('Success criteria', txt); }

let md = `# Champions Overview\n\n`;

for (const c of registry){
  const dir = path.join(champRoot, c.pascal);
  const persona = readText(path.join(dir, 'docs', 'persona.md'));
  const canon = readText(path.join(dir, 'docs', 'canon.md'));
  const seat = seatById[c.id] || '';
  const roleFull = (c.role||'').trim();
  const intro = extract('Intro:', persona);
  const myth = extract('Myth/archetype lineage:', persona);
  const hist = extract('Historical lineage:', persona);
  const oneLine = extractOneLiner(canon) || c.intent || '';
  const success = extractSuccess(canon);
  const checks = toolChecks[c.id] || [];
  const okTools = checks.every(p=>fs.existsSync(p));
  const relDir = path.relative(process.cwd(), dir).replace(/\\/g,'/');

  const roleLabel = seat || roleFull;
  md += `## ${c.name} (${roleLabel})\n`;
  if (oneLine) md += `- Essence: ${oneLine}\n`;
  if (WITH_PERSONA && intro) md += `- Persona: ${intro}\n`;
  if (WITH_PERSONA && (myth || hist)) md += `- Lineage: ${myth || ''}${myth&&hist?' | ':''}${hist || ''}\n`;
  if (success) md += `- Success: ${success}\n`;
  md += `- Tools: ${okTools ? 'OK' : 'MISS'}${VERBOSE && checks.length? ` (${checks[0]})` : ''}\n`;
  md += `- Path: ${relDir}\n\n`;
}

fs.writeFileSync(outPath, md, 'utf8');
console.log('[Overview] Wrote ->', outPath);
