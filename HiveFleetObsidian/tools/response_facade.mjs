// Response Facade: shape a group conversation from core decisions + personas
// Usage (CLI): node HiveFleetObsidian/tools/response_facade.mjs --prompt "..." [--tone casual] [--variety 1]

import fs from 'node:fs';
import path from 'node:path';
import { render as renderVoice } from './voice_renderer.mjs';
import { decideExploit as decideExploitCore } from '../honeycomb/champions/ThreadSovereign/core/decide_exploit.mjs';
import { readBoard as readBoardFs, readHealth, readDoctrine } from '../honeycomb/champions/ThreadSovereign/adapters/fs_env.mjs';
import { planPivot } from '../honeycomb/champions/PrismMagus/core/plan_pivot.mjs';

const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
function arg(name, def=''){ const i = process.argv.indexOf(`--${name}`); return i>-1 ? (process.argv[i+1]||def) : def; }

// Local renderBlock to generate 1–2 lines per seat using voice renderer
function renderBlock(seat, payload, opts={}){
  const { tone='casual', variety=1, seed='', count } = opts;
  const n = Number.isFinite(count) ? Math.max(1, count) : (seat === 'exploit' ? 1 : 2);
  const out = [];
  for (let i=0;i<n;i++){
    const v = i===0 ? 0 : (variety + i) % 3;
    const s = `${seed||'hfo'}:${seat}:${i}`;
    const line = renderVoice(seat, payload, { tone, variety: v, seed: s });
    if (!out.includes(line)) out.push(line);
  }
  return out;
}

export function buildConversation({ prompt='', tone='casual', variety=1, seed='', rounds=1, mode='mentor', intro=false }={}){
  const board = readBoardFs();
  const health = readHealth();
  const doctrine = readDoctrine();
  const boardSeed = `${(board.problem||'').trim()}|${(board.metric||'').trim()}` || 'board';
  const seedStr = mode==='strict' ? boardSeed : (seed || `${prompt}|${board.problem}|${new Date().toISOString().slice(0,10)}`);

  const lines = [];
  const intent = prompt ? `Prompt: ${prompt}` : `Problem: ${board.problem||'(unset)'}`;
  // Ownership stamp (top-level)
  let stamp = '';
  try{
    const p = path.join(base,'honeycomb','OWNERSHIP.json');
    if (fs.existsSync(p)){
      const o = JSON.parse(fs.readFileSync(p,'utf8'));
      stamp = `${o.owner} — made with ${o.motto ? o.made_with+'; '+o.motto : o.made_with}`;
    }
  }catch{}
  const ttHead = tone==='casual' ? intent+`. Let's keep it green and simple.` : intent+`. We steer by simple, green checks.`;
  lines.push(`TTao: ${ttHead}`);
  // Only show stamp in non-chatty modes; keep chat clean
  if (stamp && !(mode==='mentor' || mode==='strict')) lines.push(`TTao (stamp): ${stamp}`);

  // Board freshness check (stale if no timestamp in Current or file is older than ~36h)
  function boardMeta(){
    try{
      const p = path.join(base, 'BOARD.current.txt');
      if (!fs.existsSync(p)) return { exists:false, stale:true, path:p };
      const txt = fs.readFileSync(p,'utf8');
      const m = txt.match(/updated:\s*([^\n]+)/i);
      let fresh=false;
      if (m){
        const t = Date.parse(m[1]);
        if (!isNaN(t)) fresh = (Date.now()-t) < 36*3600*1000;
      } else {
        const stat = fs.statSync(p);
        fresh = (Date.now()-stat.mtimeMs) < 36*3600*1000;
      }
      return { exists:true, stale: !fresh, path:p };
    }catch{ return { exists:false, stale:true }; }
  }
  const bm = boardMeta();

  // If missing or stale, write a gentle skeleton (non-interactive)
  if (!bm.exists || bm.stale){
    const p = bm.path || path.join(base,'BOARD.current.txt');
    const now = new Date().toISOString();
    const skeleton = [
      `Problem: ${board.problem||''}`,
      `Metric: ${board.metric||'demo_unblocked'}`,
      `Constraint: ${board.constraint||'Node>=18; reusable goldens; reversible steps'}`,
      `Horizons: 1h=<today> | 1d=<tomorrow> | 1w=<this week> | 1m=<this month>`,
      `Current: <what we’re doing now>; updated: ${now}`
    ].join('\n');
    try{ fs.writeFileSync(p, skeleton, 'utf8'); }catch{}
    const note = !bm.exists ? 'No Board found — drafted a starter Board.' : 'Board looks stale — refreshed timestamp and placeholders.';
    if (mode!=='strict') lines.push(`TTao: ${note} You can edit HiveFleetObsidian/BOARD.current.txt to refine it.`);
  }

  // Champion intros (first round or when intro flag)
  function readIntro(pascal){
    try{
      const pd = path.join(base,'honeycomb','champions',pascal,'docs','persona.md');
      const txt = fs.readFileSync(pd,'utf8');
      const m = txt.match(/^-\s*Intro:\s*(.+)$/mi);
      return m ? m[1].trim() : '';
    }catch{ return ''; }
  }
  if ((intro || mode==='mentor') && mode!=='strict'){
    const iExploit = readIntro('ThreadSovereign') || 'I cut indecision; one safe step today.';
    const iExplore = readIntro('FaultlineSeeker') || 'I probe quickly and stop on signal.';
    const iPivot = readIntro('PrismMagus') || 'I keep the aim and change the path.';
    const iReorient = readIntro('WebCartographer') || 'I show the map and name the seam.';
    lines.push(`Thread Sovereign: Hello. I’m Thread Sovereign — ${iExploit}`);
    lines.push(`Faultline Seeker: Hello. I’m Faultline Seeker — ${iExplore}`);
    lines.push(`Prism Magus: Hello. I’m Prism Magus — ${iPivot}`);
    lines.push(`Web Cartographer: Hello. I’m Web Cartographer — ${iReorient}`);
  }

  // Exploit (Sovereign)
  const ex = decideExploitCore({ board, health, doctrine });
  // First pass: no guardrail here; reserve guardrail for the final call
  const sovereignBlock = renderBlock('exploit', { action: ex.step?.title || 'one reversible step', guard: '', tag:'OODA' }, { tone, variety, seed: seedStr });
  for (const b of sovereignBlock) lines.push(`Thread Sovereign: ${b}`);

  // Explore (Faultline)
  const flBlock = renderBlock('explore', { action: 'Design 1–3 micro-tests and replay a short trace', win: 'we hit signal or timeout' }, { tone, variety, seed: seedStr });
  for (const b of flBlock) lines.push(`Faultline Seeker: ${b}`);

  // Pivot (Prism)
  const piv = planPivot({ intent: prompt || board.problem || 'keep the aim; change the path' });
  const opt = (piv.options||[])[0] || { what:'try a small method swap', win:'the demo runs' };
  const pvBlock = renderBlock('pivot', { what: opt.what, why: opt.why || 'opens the easiest route today', win: opt.win }, { tone, variety, seed: seedStr });
  for (const b of pvBlock) lines.push(`Prism Magus: ${b}`);

  // Reorient (Cartographer)
  let hint='';
  try{
    const mp = path.join(base,'honeycomb','champions','WebCartographer','knowledge','memory.jsonl');
    if (fs.existsSync(mp)){
      const items = fs.readFileSync(mp,'utf8').split(/\r?\n/).filter(Boolean).map(l=>{try{return JSON.parse(l);}catch{return null;}}).filter(Boolean);
      const pick = items.find(it=>/Seam|Link|Entrypoint|Guardrail/i.test(`${it.topic} ${it.principle}`)) || items[0];
      hint = pick ? `${pick.topic}: ${pick.principle}` : '';
    }
  }catch{}
  const wcBlock = renderBlock('reorient', { what: 'Adopt ports/adapters for the next seam; land the smallest first step', hint }, { tone, variety, seed: seedStr }).slice(0,2);
  for (const b of wcBlock) lines.push(`Web Cartographer: ${b}`);

  // Prune redundancy: cap lines per seat and deduplicate repeated content
  const maxPerSeat = 2;
  const seen = new Set();
  function norm(s){ return s.replace(/^.*?:\s*/,'').toLowerCase().replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim(); }
  const outLines = [];
  const perSeat = {};
  for (const ln of lines){
    const seat = (ln.split(':',1)[0]||'').trim();
    perSeat[seat] = (perSeat[seat]||0);
    if (perSeat[seat] >= maxPerSeat) continue;
    const key = seat+'|'+norm(ln).replace(/smallest step first/g,'').replace(/proof first, then commit/g,'');
    if (seen.has(key)) continue;
    seen.add(key);
    perSeat[seat]++;
    outLines.push(ln);
  }
  lines.length = 0; lines.push(...outLines);

  // Optional interleaved round(s)
  if (rounds > 1) {
    // Prism adds another option if available
    const alt = (piv.options||[])[1];
    if (alt) {
      const pv2 = renderBlock('pivot', { what: alt.what, why: alt.why || 'keeps option value', win: alt.win }, { tone, variety: variety+1, seed: seedStr+'-alt' });
      for (const b of pv2) lines.push(`Prism Magus: ${b}`);
    }
    // Sovereign final call, tied to chosen option (opt)
    const finalLine = renderVoice('exploit', { action: `Final: ${ex.step?.title || 'one reversible step'}`, guard: 'Ship only if frozen stays green.', tag:'' }, { tone, variety: variety+1, seed: seedStr+'-final' });
    lines.push(`Thread Sovereign: ${finalLine}`);
    // TTao closes with next action hint
    const next = (ex.step?.commands||[])[0] || 'npm run hive:turn:save';
    lines.push(`TTao: Sounds good. I’ll run: ${next}`);
  }
  return { lines };
}

// CLI
if (import.meta.url === `file://${process.argv[1].replace(/\\/g,'/')}`){
  const tone = arg('tone','casual');
  const variety = Number(arg('variety','1'));
  const rounds = Number(arg('rounds','1'));
  const prompt = arg('prompt','');
  const mode = arg('mode','mentor');
  const intro = process.argv.includes('--intro');
  const out = buildConversation({ prompt, tone, variety, rounds, mode, intro });
  for (const l of out.lines) console.log(l);
}
