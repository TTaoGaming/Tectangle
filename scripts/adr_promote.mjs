#!/usr/bin/env node
// Promote key knowledge docs to ADRs with template, index update
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ADR_DIR = path.join(ROOT, 'docs','adr');
const KNOW = path.join(ROOT, 'docs','knowledge');
const INDEX = path.join(ADR_DIR, 'INDEX.md');

const CANDIDATES = [
  { id: 'ADR-202509-01', title: 'Purpose — HFO Semantic Knife', src: '../HiveFleetObsidian/knowledge/HFO_PURPOSE_Semantic_Knife.md' },
  { id: 'ADR-202509-02', title: 'Pinch MVP — Exploit path', src: 'Consolidated_Pinch_Report_2025-09-06_FINAL.md' }
];

async function ensureIndex(){
  try{ await fs.access(INDEX); } catch {
    await fs.writeFile(INDEX, '# ADR Index\n\n| ID | Title | Date | File | Status |\n|---|---|---|---|---|\n','utf8');
  }
}

async function promote(){
  await fs.mkdir(ADR_DIR, { recursive: true });
  await ensureIndex();
  let idx = await fs.readFile(INDEX,'utf8');
  for (const c of CANDIDATES){
  const srcPath = path.isAbsolute(c.src) ? c.src : path.join(ROOT, 'docs','knowledge', c.src);
    const exists = await fs.readFile(srcPath,'utf8').catch(()=> null);
    if (!exists) continue;
    const date = new Date().toISOString().slice(0,10);
    const adrFile = path.join(ADR_DIR, `${c.id}.md`);
  const linkRel = path.relative(ADR_DIR, srcPath).replace(/\\/g,'/');
  const content = `---\nadr: true\nstatus: Proposed\nid: "${c.id}"\ntitle: "${c.title}"\ndate: "${date}"\nowners: ["owner"]\nlinks: ["${linkRel}"]\nverification: { tests: false, integration: false, third_party: false }\n---\n\nContext\n\n- See linked source.\n\nDecision\n\n- Elevate to canonical purpose/plan; enforce NOT-PRODUCTION-READY until verified.\n\nConsequences\n\n- Central anchor; stale drafts will be retired monthly.\n\nVerification\n\n- Add tests/goldens/3rd-party reports before status→Accepted.\n\nChangelog\n\n- ${date} Proposed\n`;
    await fs.writeFile(adrFile, content, 'utf8');
    const rel = path.relative(ADR_DIR, adrFile).replace(/\\/g,'/');
    if (!idx.includes(c.id)){
      idx += `| ${c.id} | ${c.title} | ${date} | [${path.basename(adrFile)}](${path.basename(adrFile)}) | Proposed |\n`;
    }
  }
  await fs.writeFile(INDEX, idx, 'utf8');
  console.log('ADR promotion complete.');
}

promote().catch((e)=>{ console.error(e); process.exit(1); });
