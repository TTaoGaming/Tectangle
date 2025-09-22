// Thread Sovereign Mode: single-seat decisive voice with shaped output
// Usage: node HiveFleetObsidian/tools/modes/thread_sovereign.mjs [--prompt "..."] [--tone casual|formal] [--rounds 1|2]
// Saves a chat transcript under HiveFleetObsidian/reports/chats and prints to stdout.

import fs from 'node:fs';
import path from 'node:path';
import { render as renderVoice } from '../voice_renderer.mjs';
import { decideExploit as decideExploitCore } from '../../honeycomb/champions/ThreadSovereign/core/decide_exploit.mjs';
import { readBoard as readBoardFs, readHealth, readDoctrine } from '../../honeycomb/champions/ThreadSovereign/adapters/fs_env.mjs';

function arg(name, def = '') {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? (process.argv[i + 1] || def) : def;
}

const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const outDir = arg('out', path.join(base, 'reports', 'chats'));
const prompt = arg('prompt', '').trim();
const tone = arg('tone', 'casual');
const rounds = Number(arg('rounds', '1'));
const seed = arg('seed', new Date().toISOString().slice(0, 10));
const intro = process.argv.includes('--intro');

function readPersonaIntro() {
  try {
    const p = path.join(base, 'honeycomb', 'champions', 'ThreadSovereign', 'docs', 'persona.md');
    const txt = fs.readFileSync(p, 'utf8');
    const m = txt.match(/^\-\s*Intro:\s*(.+)$/mi);
    return m ? m[1].trim() : 'I cut indecision; one safe step today.';
  } catch {
    return 'I cut indecision; one safe step today.';
  }
}

function main() {
  const board = readBoardFs();
  const health = readHealth();
  const doctrine = readDoctrine();
  const head = prompt ? `Prompt: ${prompt}` : `Problem: ${board.problem || '(unset)'}`;

  const lines = [];
  const ttHead = tone === 'casual' ? `${head}. Let's keep it green and simple.` : `${head}. We steer by simple, green checks.`;
  lines.push(`TTao: ${ttHead}`);
  if (intro) {
    lines.push(`Thread Sovereign: ${readPersonaIntro()}`);
  }

  // First pass (admiral voice)
  const ex = decideExploitCore({ board, health, doctrine });
  const first = renderVoice('exploit', { action: ex.step?.title || 'one reversible step', guard: '', tag: 'OODA' }, { tone, variety: 1, seed: `${seed}:ts:round1` });
  lines.push(`Thread Sovereign: ${first}`);

  // Optional second round: final + guardrail
  if (rounds > 1) {
    const final = renderVoice('exploit', { action: `Final: ${ex.step?.title || 'one reversible step'}`, guard: 'Ship only if frozen stays green.', tag: '' }, { tone, variety: 2, seed: `${seed}:ts:final` });
    lines.push(`Thread Sovereign: ${final}`);
    const next = (ex.step?.commands || [])[0] || 'npm run hive:turn:save';
    lines.push(`TTao: Acknowledged. Next: ${next}`);
  }

  // Scribe stamp
  lines.push(`Silk Scribe: Logged chat | mode: Thread Sovereign`);

  for (const l of lines) console.log(l);
  const help = 'Help: Controls — tone=casual|formal, rounds=1|2, --intro, seed=<text>. Edit BOARD.current.txt to steer.';
  console.log(help);

  // Save artifacts
  try {
    fs.mkdirSync(outDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:]/g, '-');
    const txtPath = path.join(outDir, `mode_thread_sovereign_${ts}.txt`);
    const jsonPath = path.join(outDir, `mode_thread_sovereign_${ts}.json`);
    fs.writeFileSync(txtPath, [...lines, help].join('\n') + '\n', 'utf8');
    const payload = { generatedAt: new Date().toISOString(), prompt, board, health, doctrineRef: 'fs_env', mode: 'thread_sovereign', lines };
    fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2));
  } catch {}
}

// CLI entry (Windows-safe)
main();
