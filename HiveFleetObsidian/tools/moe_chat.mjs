// Mixture-of-Experts (4+2) conversational chat generator
// Usage: node HiveFleetObsidian/tools/moe_chat.mjs [--prompt "..."] [--out dir]
// - Reads current Board and latest saved turn (counsel JSON)
// - Emits a conversational chat transcript (TTao + 4 core + Scribe)
// - Saves to HiveFleetObsidian/reports/chats by default

import fs from 'node:fs';
import path from 'node:path';
import { buildConversation as buildFacade } from './response_facade.mjs';
import { generate as llmGenerate } from './llm/llm_port.mjs';

function arg(name, def = '') {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? (process.argv[i + 1] || def) : def;
}

const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const outDir = arg('out', path.join(base, 'reports', 'chats'));
const prompt = arg('prompt', '').trim();
const tone = arg('tone','casual');
const rounds = Number(arg('rounds','1'));
const seedArg = arg('seed','');
const strictFlag = process.argv.includes('--strict');
const SCRIBE = process.argv.includes('--scribe');
const providerArg = arg('provider','').trim();
const modelArg = arg('model','').trim();
const noLLM = process.argv.includes('--no-llm');
const forceCouncil = process.argv.includes('--council') || process.argv.includes('--counsel-of-4');
const counselFile = arg('counsel-file','').trim();
const counselStdin = process.argv.includes('--counsel-stdin');

function readBoard() {
  const p = path.join(base, 'BOARD.current.txt');
  const fields = { problem: '', metric: '', constraint: '', horizons: '', current: '' };
  if (!fs.existsSync(p)) return { path: p, fields };
  const raw = fs.readFileSync(p, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^(Problem|Metric|Constraint|Horizons|Current):\s*(.*)$/i);
    if (m) fields[m[1].toLowerCase()] = m[2].trim();
  }
  return { path: p, fields };
}

function latestTurn() {
  const dir = path.join(base, 'reports', 'turns');
  if (!fs.existsSync(dir)) return null;
  const files = fs
    .readdirSync(dir)
    .filter((n) => /^turn_.*\.json$/.test(n))
    .map((n) => path.join(dir, n));
  if (files.length === 0) return null;
  files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  try {
    const data = JSON.parse(fs.readFileSync(files[0], 'utf8'));
    return { path: files[0], data };
  } catch {
    return null;
  }
}

// Champion doc helpers (persona + canon)
const seatToPascal = {
  exploit: 'ThreadSovereign',
  explore: 'FaultlineSeeker',
  pivot: 'PrismMagus',
  reorient: 'WebCartographer',
};

function readFirst(lineArr, rx) {
  const m = lineArr.find((l) => rx.test(l));
  return m ? m.replace(rx, '').trim() : '';
}

function readPersonaIntro(pascal) {
  const p = path.join(base, 'honeycomb', 'champions', pascal, 'docs', 'persona.md');
  try {
    const txt = fs.readFileSync(p, 'utf8');
    const lines = txt.split(/\r?\n/).map((l) => l.trim());
    let intro = readFirst(lines, /^-\s*Intro:\s*/i);
    if (!intro) {
      // fallback: first non-heading bullet
      intro = (lines.find((l) => /^-\s+/.test(l)) || '').replace(/^-\s+/, '');
    }
    return intro.slice(0, 80);
  } catch {
    return '';
  }
}

function readCanonOneLiner(pascal) {
  const p = path.join(base, 'honeycomb', 'champions', pascal, 'docs', 'canon.md');
  try {
    const txt = fs.readFileSync(p, 'utf8');
    const lines = txt.split(/\r?\n/).map((l) => l.trim());
    let one = readFirst(lines, /^One-?liner:\s*/i);
    if (!one) {
      // fallback: first rule bullet
      one = (lines.find((l) => /^-\s+/.test(l)) || '').replace(/^-\s+/, '');
    }
    return one.slice(0, 80);
  } catch {
    return '';
  }
}

function voiceForSeat(seat) {
  const pas = seatToPascal[seat];
  if (!pas) return { persona: '', canon: '' };
  return { persona: readPersonaIntro(pas), canon: readCanonOneLiner(pas), pascal: pas };
}

function defaultCounsel() {
  return {
    explore: {
      what: 'Design 1–3 micro-tests for riskiest assumption; run replay on a short trace',
      why: 'Reduce uncertainty fast before scaling work',
      win: 'Stop rule hit (signal or timeout) on one probe',
      warnings: 'Keep experiments cheap; archive findings',
      how: ['Name assumption in Board', 'Record 30–60s trace', 'Run replay and log result'],
    },
    pivot: {
      what: 'Run prism_reframe.mjs to compare baseline vs a new angle for the same goal',
      why: 'Keep goal; change approach; choose higher EV',
      win: 'EV_new > EV_old; no regressions',
      warnings: 'Prefer simplest viable A/B',
      how: ['Define metric and budget', 'Run prism_reframe.mjs --goal "..."', 'Keep winner; archive other'],
    },
    reorient: {
      what: 'Adopt ports/adapters at the next seam; land the smallest step',
      why: 'Reduce drift; enable parallel adapters later',
      win: 'Pattern named; first step landed; links mapped',
      warnings: 'No heavy deps; prefer adapters over rewrites',
      how: ['Name ports', 'Stub one adapter', 'Map links in web_map.md'],
    },
    exploit: {
      what: 'Commit one safe, reversible improvement after green checks',
      why: 'Move today’s metric without risk',
      win: 'dup==0 && frozen:pass && smoke:pass && miss==0',
      warnings: 'Ship only if frozen PASS',
      how: ['Run daily/turn', 'Fix any MISS/dup', 'Append Scribe line'],
    },
  };
}

function buildChat({ board, counsel, counselRef }) {
  const lines = [];
  const seed = seedArg || new Date().toISOString().slice(0,10);
  const counselDriven = counsel && counsel.exploit;
  if (counselDriven || forceCouncil) {
    const head = prompt ? `Prompt: ${prompt}. Let's keep it green and simple.` : `Problem: ${board.fields.problem||'(unset)'}. Let's keep it green and simple.`;
    lines.push(`TTao: ${head}`);
    // Seat one-liners derived from counsel JSON
    const src = counsel && counsel.exploit ? counsel : defaultCounsel();
    const ex = src.exploit || {};
    const fl = src.explore || {};
    const pv = src.pivot || {};
    const ro = src.reorient || {};
    lines.push(`Thread Sovereign: ${ex.what || 'one reversible step'}${ex.win ? ` (Win: ${ex.win})` : ''}`);
    lines.push(`Faultline Seeker: ${fl.what || 'Design 1–3 micro-tests and replay a short trace'}${fl.win ? ` (Stop: ${fl.win})` : ''}`);
    lines.push(`Prism Magus: ${pv.what || 'try a small method swap'}${pv.win ? ` (Keep when ${pv.win})` : ''}`);
    lines.push(`Web Cartographer: ${ro.what || 'Adopt ports/adapters for the next seam; land the smallest first step'}`);
  } else {
    // Use facade for conversational shaping (template-driven fallback)
    const { lines: convo } = buildFacade({ prompt, tone, variety: 1, rounds, seed, mode: strictFlag ? 'strict' : undefined });
    for (const l of convo) lines.push(l);
  }

  const ex = counsel.exploit || defaultCounsel().exploit;
  const fx = counsel.explore || defaultCounsel().explore;
  const pv = counsel.pivot || defaultCounsel().pivot;
  const ro = counsel.reorient || defaultCounsel().reorient;

  const vExploit = voiceForSeat('exploit');
  const vExplore = voiceForSeat('explore');
  const vPivot = voiceForSeat('pivot');
  const vReorient = voiceForSeat('reorient');

  // Glossary for brief term explanations (load from fleet glossary if present)
  let GLOSS = {
    'OODA': 'observe–orient–decide–act',
    'decisive point': 'small effort, big shift',
    'center of gravity': 'main source of strength',
    'AAR': 'after‑action review',
    'port': 'stable interface boundary',
    'adapter': 'small bridge that fits a port',
    'frozen smoke': 'locked‑in expected results',
    'ADR': 'short decision note with rollback',
  };
  try {
    const gp = path.join(base, 'honeycomb', 'plain_language_glossary.json');
    if (fs.existsSync(gp)) {
      const more = JSON.parse(fs.readFileSync(gp, 'utf8'));
      for (const [k, v] of Object.entries(more || {})) if (v) GLOSS[k] = String(v);
    }
  } catch {}
  function glossify(s) {
    let out = s;
    for (const [k, v] of Object.entries(GLOSS)) {
      const rx = new RegExp(`\\b${k}\\b`, 'i');
      if (rx.test(out)) out = out.replace(rx, `${k} (${v})`);
    }
    return out;
  }

  // Admiral of Threads style for Exploit seat (Thread Sovereign)
  // Existing tags and gloss still apply to lines through facade
  lines.push(`Silk Scribe: Logged chat | counsel: ${counselRef ?? '(none)'}${counsel && counsel.guardrail ? ` | guardrail: ${counsel.guardrail}` : ''}`);
  const voices = {
    exploit: vExploit,
    explore: vExplore,
    pivot: vPivot,
    reorient: vReorient,
  };
  return { lines, voices };
}

const board = readBoard();
let turn = latestTurn();
let counsel = turn?.data?.counsel || defaultCounsel();
let counselRef = turn?.path?.replace(/\\/g, '/');

// Paste-in lane: accept strict counsel JSON via file or stdin
async function maybeLoadCounselFromPaste(){
  async function readStdin(){
    return await new Promise((resolve,reject)=>{
      let data='';
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', chunk=> data+=chunk);
      process.stdin.on('end', ()=> resolve(data));
      process.stdin.on('error', reject);
    });
  }
  let raw='';
  try{
    if (counselFile) raw = fs.readFileSync(counselFile,'utf8');
    else if (counselStdin) raw = await readStdin();
    else return null;
    const parsed = JSON.parse(raw);
    const picked = parsed.counsel ? parsed.counsel : parsed;
    if (!picked || typeof picked!=='object') throw new Error('Invalid counsel payload');
    // Minimal shape check: ensure seat keys exist
    for (const seat of ['explore','pivot','reorient','exploit']){
      if (!picked[seat] || typeof picked[seat] !== 'object') throw new Error(`Missing seat: ${seat}`);
    }
    // Save as a turn
    const turnsDir = path.join(base,'reports','turns');
    fs.mkdirSync(turnsDir, { recursive:true });
    const ts = new Date().toISOString().replace(/[:]/g,'-');
    const pathOut = path.join(turnsDir, `turn_${ts}.json`);
    const payload = { counsel: picked, guardrail: parsed.guardrail || 'Ship only if frozen smoke passes.', history: { snapshot:'paste_counsel', metric_delta:'provider:paste', lesson:'Counsel pasted from external chat' }, llm:{ provider:'paste', model: (modelArg || 'external-chat') } };
    fs.writeFileSync(pathOut, JSON.stringify(payload, null, 2));
    counsel = picked;
    counselRef = pathOut.replace(/\\/g,'/');
    return { pathOut };
  }catch(err){
    console.error('[MoE] Paste-in counsel failed:', err.message||String(err));
    return null;
  }
}

await maybeLoadCounselFromPaste();

// Optional LLM-backed counsel refresh (safe + reversible)
async function maybeGenerateCounselViaLLM(){
  const provider = providerArg || process.env.HFO_LLM_PROVIDER || '';
  if (noLLM || !provider) return null;
  const model = modelArg || process.env.HFO_LLM_MODEL || '';
  const boardFields = board.fields;
  const ctx = `BoardProblem: ${boardFields.problem}\nMetric: ${boardFields.metric}\nConstraint: ${boardFields.constraint}\nCurrent: ${boardFields.current}`;
  async function seat(seat){
    const sys = `You speak for the ${seat} seat. Return strict JSON with keys: what, why, win, warnings, how (3 strings), guardrail, provenance (2-4 strings). Plain language.`;
    const user = `${prompt ? `Prompt: ${prompt}\n` : ''}${ctx}`;
    const res = await llmGenerate({ provider, model, messages:[{role:'system', content: sys},{ role:'user', content: user}], seat });
    return res.json || JSON.parse(res.text);
  }
  try{
    const next = {
      explore: await seat('explore'),
      pivot: await seat('pivot'),
      reorient: await seat('reorient'),
      exploit: await seat('exploit'),
    };
    // Save a new turn with LLM counsel
    const turnsDir = path.join(base,'reports','turns');
    fs.mkdirSync(turnsDir, { recursive:true });
    const ts = new Date().toISOString().replace(/[:]/g,'-');
    const pathOut = path.join(turnsDir, `turn_${ts}.json`);
    const payload = { counsel: next, guardrail: 'Ship only if frozen smoke passes.', history: { snapshot:'llm_counsel', metric_delta:`provider:${provider}; model:${model||'(default)'}`, lesson:'Counsel generated via LLM port' }, llm:{ provider, model } };
    fs.writeFileSync(pathOut, JSON.stringify(payload, null, 2));
    counsel = next;
    counselRef = pathOut.replace(/\\/g,'/');
    return { provider, model, pathOut };
  }catch(err){
    console.error('[MoE] LLM counsel generation failed:', err.message||String(err));
    return null;
  }
}

await maybeGenerateCounselViaLLM();

const built = buildChat({ board, counsel, counselRef });
const chat = built.lines;
const voices = built.voices;

// Board freshness check inject warning line if stale (>90m or missing core fields)
try {
  const { spawnSync } = await import('node:child_process');
  const fres = spawnSync('node', [path.join(base,'tools','board_freshness.mjs'), '--max-age-min', '90'], { encoding:'utf8' });
  if (fres.status !== 0) {
    // attempt to parse
    const m = fres.stdout.match(/"ageMinutes"\s*:\s*([0-9.]+)/);
    const age = m ? Number(m[1]) : 'unknown';
    chat.unshift(`Silk Scribe: WARNING board stale (age ~${age}m) — update problem & metric before deep counsel.`);
  }
} catch {}

// Print to stdout
for (const ln of chat) console.log(ln);

// One-line help banner under the chat (plain language)
const help = 'Help: Ask anything. Controls — tone=casual|formal, rounds=1|2, --strict, --council, --provider <p>, --counsel-file <path> | --counsel-stdin, seed=<text>. Private: sovereign decide | prism plan. Edit BOARD.current.txt to steer.';
console.log(help);
chat.push(help);

// Save artifacts
try {
  fs.mkdirSync(outDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:]/g, '-');
  const txtPath = path.join(outDir, `chat_${ts}.txt`);
  const jsonPath = path.join(outDir, `chat_${ts}.json`);
  fs.writeFileSync(txtPath, chat.join('\n') + '\n', 'utf8');
  const payload = { generatedAt: new Date().toISOString(), prompt, board: board.fields, chat, voices, counselRef: counselRef || '' };
  fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2));
  console.log('\n[MoE] Chat saved ->', txtPath);
} catch {}

// Optional Scribe append
if (SCRIBE) {
  const tools = (p) => path.join(base, 'tools', p);
  const snap = 'moe_chat';
  const metric = `seats:6; counsel:${counselRef ? 'present' : 'fallback'}`;
  const lesson = 'Persona/canon tinted MoE chat';
  try {
    const { spawnSync } = await import('node:child_process');
    spawnSync('node', [tools('append_history.mjs'), '--snapshot', snap, '--metric', metric, '--lesson', lesson, '--type', 'chat'], { stdio: 'inherit' });
  } catch {}
}

// Always append minimal chat heartbeat (even without --scribe) to reduce drift
try {
  const { spawnSync } = await import('node:child_process');
  const toolsBase = (p) => path.join(base,'tools',p);
  spawnSync('node', [toolsBase('append_history.mjs'), '--snapshot','chat_turn','--metric',`lines:${chat.length}`,'--lesson', (prompt?prompt.slice(0,60):'no prompt'), '--type','chat-mini'], { stdio:'ignore' });
} catch {}
