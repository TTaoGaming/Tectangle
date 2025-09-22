#!/usr/bin/env node
// HFO Rollup Publisher — publishes knowledge rollups into HiveFleetObsidian historythread
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const KNOW = path.join(ROOT, 'docs','knowledge');
const HFO = path.join(ROOT, 'HiveFleetObsidian');
const HFO_HISTORY = path.join(HFO, 'historythread');
const DAILY = path.join(HFO_HISTORY, 'daily');
const WEEKLY = path.join(HFO_HISTORY, 'weekly');

function isoDate(ts=new Date()){ return ts.toISOString().slice(0,10); }
function isoWeek(d=new Date()){
  // ISO week number
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Thursday in current week decides the year.
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay()||7));
  // First week of year on Jan 4th
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1)/7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2,'0')}`;
}

async function readIfExists(p){ try { return await fs.readFile(p,'utf8'); } catch { return null; } }
async function latestSixMonth(){
  const files = await fs.readdir(KNOW);
  const six = files.filter(f=> /^SIX_MONTH_SUMMARY_\d{8}\.md$/.test(f)).sort().pop();
  return six ? path.join(KNOW, six) : null;
}

async function main(){
  await fs.mkdir(DAILY, { recursive: true });
  await fs.mkdir(WEEKLY, { recursive: true });

  const gold = path.join(KNOW, 'GOLD_INDEX.md');
  const world = path.join(KNOW, 'WORLD_INDEX.md');
  const monolith = path.join(KNOW, 'MONOLITH_SCRIBE.md');
  const working = path.join(KNOW, 'WORKING_COMMITS.md');
  const six = await latestSixMonth();
  const adrIndex = path.join(ROOT, 'docs','adr','INDEX.md');

  const today = isoDate();
  const week = isoWeek();

  const dailyOut = path.join(DAILY, `ROLLUP_${today}.md`);
  const weeklyOut = path.join(WEEKLY, `ROLLUP_${week}.md`);

  const disclaimer = [
    'assume_production_ready: false',
    'verified: false',
    'verification_policy: "Only artifacts validated by tests/integration/3rd-party tools are considered reliable; everything else is provisional."',
    'tags: [HFO, ROLLUP, SEARCHABLE, NOT-VERIFIED, KNOWLEDGE-PORT]'
  ].join('\n');

  const header = (title)=> `---\n${disclaimer}\n---\n\n# ${title}\n\n> Search tags: #HFO-ROLLUP #GOLD #WORLD #SIXMONTH #MONOLITH #WORKING #NOT-PRODUCTION-READY\n\n`;

  const goldLink = `[GOLD_INDEX.md](${path.relative(DAILY, gold).replace(/\\/g,'/')})`;
  const worldLink = `[WORLD_INDEX.md](${path.relative(DAILY, world).replace(/\\/g,'/')})`;
  const sixLink = six ? `[${path.basename(six)}](${path.relative(DAILY, six).replace(/\\/g,'/')})` : '(none)';
  const monolithLink = `[MONOLITH_SCRIBE.md](${path.relative(DAILY, monolith).replace(/\\/g,'/')})`;
  const workingLink = `[WORKING_COMMITS.md](${path.relative(DAILY, working).replace(/\\/g,'/')})`;
  const adrLink = `[ADR Index](${path.relative(DAILY, adrIndex).replace(/\\/g,'/')})`;

  const goldHead = await readIfExists(gold).then(s=> s ? s.split(/\r?\n/).slice(0,12).join('\n') : '');
  const sixHead = six ? await readIfExists(six).then(s=> s ? s.split(/\r?\n/).slice(0,20).join('\n') : '') : '';

  const dailyMd = [
    header(`Daily Rollup — ${today}`),
    'Links',
  `- GOLD: ${goldLink}`,
    `- WORLD: ${worldLink}`,
    `- 6M: ${sixLink}`,
    `- MONOLITH: ${monolithLink}`,
  `- WORKING: ${workingLink}`,
  `- ADRs: ${adrLink}`,
    '',
    'Snapshots',
    '## GOLD (head)',
    '```md', goldHead, '```',
    '## 6M (head)',
    '```md', sixHead, '```',
    '',
    'Policy',
    '- NOTHING is production ready unless verified by tests/integration/3rd-party tooling.',
    '- Treat unverified code as untrusted until frozen and replayed against goldens.'
  ].join('\n');

  await fs.writeFile(dailyOut, dailyMd, 'utf8');

  // weekly just refs daily
  const weeklyMd = [
    header(`Weekly Rollup — ${week}`),
    `See daily: [${path.basename(dailyOut)}](../daily/${path.basename(dailyOut)})`,
    '',
    'Policy (inherited)',
    '- Unverified artifacts are provisional.'
  ].join('\n');
  await fs.writeFile(weeklyOut, weeklyMd, 'utf8');

  // index
  const indexOut = path.join(HFO_HISTORY, 'index.md');
  const indexMd = [
    header('HistoryThread — Index'),
    `- Latest daily: [${path.basename(dailyOut)}](daily/${path.basename(dailyOut)})`,
    `- Latest weekly: [${path.basename(weeklyOut)}](weekly/${path.basename(weeklyOut)})`,
    `- GOLD: ${path.relative(HFO_HISTORY, gold).replace(/\\/g,'/')}`,
    `- WORLD: ${path.relative(HFO_HISTORY, world).replace(/\\/g,'/')}`,
    `- MONOLITH: ${path.relative(HFO_HISTORY, monolith).replace(/\\/g,'/')}`,
    `- WORKING: ${path.relative(HFO_HISTORY, working).replace(/\\/g,'/')}`,
    `- ADRs: ${path.relative(HFO_HISTORY, adrIndex).replace(/\\/g,'/')}`,
  ].join('\n');
  await fs.writeFile(indexOut, indexMd, 'utf8');

  console.log(`Published: ${dailyOut} and ${weeklyOut}`);
}

main().catch((e)=>{ console.error(e); process.exit(1); });
