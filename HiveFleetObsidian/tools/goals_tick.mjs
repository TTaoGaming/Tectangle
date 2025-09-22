// Goals Tick: generate horizon-specific goal/review docs (daily→millennia) and scribe
// Usage: node HiveFleetObsidian/tools/goals_tick.mjs [--force]

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const force = process.argv.includes('--force');

function readBoard(){
  const board = { problem:'', metric:'', constraint:'', horizons:'', current:'' };
  try {
    let raw = fs.readFileSync(path.join(base,'BOARD.current.txt'),'utf8');
    if (raw.charCodeAt(0)===0xFEFF) raw = raw.slice(1);
    for (const line of raw.split(/\r?\n/)){
      const m = line.match(/^(Problem|Metric|Constraint|Horizons|Current):\s*(.*)$/i);
      if (m) board[m[1].toLowerCase()] = m[2].trim();
    }
  } catch {}
  return board;
}

function ensureDir(p){ fs.mkdirSync(p, { recursive:true }); }
function writeOnce(p, txt){ if (!fs.existsSync(p) || force) fs.writeFileSync(p, txt, 'utf8'); }

function isoWeek(d){
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = dt.getUTCDay() || 7; dt.setUTCDate(dt.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((dt - yearStart)/86400000) + 1)/7);
  return { year: dt.getUTCFullYear(), week: weekNo };
}

function quarter(d){ return Math.floor(d.getUTCMonth()/3)+1; }

function stamp(){
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = (now.getUTCMonth()+1).toString().padStart(2,'0');
  const dd = now.getUTCDate().toString().padStart(2,'0');
  const w = isoWeek(now); const q = quarter(now);
  return {
    ts: now.toISOString(),
    daily: `${y}-${m}-${dd}`,
    weekly: `${w.year}-W${w.week.toString().padStart(2,'0')}`,
    monthly: `${y}-${m}`,
    quarterly: `${y}-Q${q}`,
    annual: `${y}`,
    decade: `${Math.floor(y/10)*10}s`,
    century: `${Math.floor(y/100)+1}th`,
    millennia: `${Math.floor(y/1000)+1}rd`,
  };
}

function templateDaily(s, board){
  return `# Daily Goals (${s.daily})\n\n- Problem: ${board.problem||''}\n- Metric: ${board.metric||''}\n- Constraint: ${board.constraint||''}\n\n## Focus (today)\n- [ ] One decisive, reversible step\n- [ ] Evidence captured (trace/smoke/frozen)\n\n## Tasks\n- [ ] \n- [ ] \n\n## End of Day Review\n- Outcome: \n- What worked: \n- What to change: \n`;
}

function templateWeekly(s){
  return `# Weekly Plan (${s.weekly})\n\n## Objectives\n- \n\n## Key Seams (ports/adapters)\n- \n\n## Risks & Guards\n- \n\n## End of Week Review\n- Shipped: \n- Evidence: \n- Lessons: \n`;
}

function templateMonthly(s){
  return `# Monthly Themes (${s.monthly})\n\n## Themes\n- \n\n## Outcomes\n- \n\n## Debt to Tidy\n- \n`;
}

function templateQuarterly(s){
  return `# Quarterly Plan (${s.quarterly})\n\n## Goals\n- \n\n## Bets (with stop rules)\n- \n`;
}

function templateAnnual(s){
  return `# Annual Objectives (${s.annual})\n\n## Objectives\n- \n\n## Measures\n- \n`;
}

function templateDecade(s){
  return `# Decade Vision (${s.decade})\n\n## Vision\n- \n\n## Pillars\n- \n`;
}

function main(){
  const s = stamp();
  const board = readBoard();
  const root = path.join(base, 'goals');
  const created = [];

  // Daily
  ensureDir(path.join(root,'daily'));
  const dailyPath = path.join(root,'daily', `${s.daily}.md`);
  if (!fs.existsSync(dailyPath) || force){ writeOnce(dailyPath, templateDaily(s, board)); created.push('daily'); }

  // Weekly (create on Mondays or if missing)
  const dow = new Date().getUTCDay(); // 0 Sun..6 Sat
  ensureDir(path.join(root,'weekly'));
  const weeklyPath = path.join(root,'weekly', `${s.weekly}.md`);
  if (dow===1 || !fs.existsSync(weeklyPath) || force){ writeOnce(weeklyPath, templateWeekly(s)); if (!created.includes('weekly')) created.push('weekly'); }

  // Monthly (create on first day or if missing)
  ensureDir(path.join(root,'monthly'));
  const monthlyPath = path.join(root,'monthly', `${s.monthly}.md`);
  const isMonthStart = new Date().getUTCDate()===1;
  if (isMonthStart || !fs.existsSync(monthlyPath) || force){ writeOnce(monthlyPath, templateMonthly(s)); if (!created.includes('monthly')) created.push('monthly'); }

  // Quarterly (create on quarter start or if missing)
  ensureDir(path.join(root,'quarterly'));
  const quarterlyPath = path.join(root,'quarterly', `${s.quarterly}.md`);
  const month = new Date().getUTCMonth()+1;
  const isQuarterStart = [1,4,7,10].includes(month) && new Date().getUTCDate()===1;
  if (isQuarterStart || !fs.existsSync(quarterlyPath) || force){ writeOnce(quarterlyPath, templateQuarterly(s)); if (!created.includes('quarterly')) created.push('quarterly'); }

  // Annual (Jan 1 or if missing)
  ensureDir(path.join(root,'annual'));
  const annualPath = path.join(root,'annual', `${s.annual}.md`);
  const isYearStart = (month===1) && (new Date().getUTCDate()===1);
  if (isYearStart || !fs.existsSync(annualPath) || force){ writeOnce(annualPath, templateAnnual(s)); if (!created.includes('annual')) created.push('annual'); }

  // Decade (first year of decade or if missing)
  ensureDir(path.join(root,'decade'));
  const decadePath = path.join(root,'decade', `${s.decade}.md`);
  const firstYearOfDecade = (Number(s.annual) % 10)===0 && isYearStart;
  if (firstYearOfDecade || !fs.existsSync(decadePath) || force){ writeOnce(decadePath, templateDecade(s)); if (!created.includes('decade')) created.push('decade'); }

  // Scribe
  try{
    const tools = p => path.join(base, 'tools', p);
    const metric = created.length ? created.join(',') : 'none';
    spawnSync('node', [tools('append_history.mjs'), '--snapshot', 'goals:tick', '--metric', `created:${metric}`, '--lesson', 'Generate horizon goal/review docs; keep plain-language templates per horizon'], { stdio: 'inherit' });
  }catch{}

  console.log('[Goals] Created:', created.join(', ')||'(none)');
}

main();
