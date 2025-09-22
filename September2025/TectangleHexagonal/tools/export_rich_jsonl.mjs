// WEBWAY:ww-2025-027 JSONL exporter for enriched seat-lock telemetry
// Purpose: Drive the V11 research console on a canned clip and dump per-frame enriched rows to JSONL.
// Revert: delete this file and the package.json script alias.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../..');

const base = process.env.SITE_BASE || 'http://127.0.0.1:8080';
const clip = process.env.CLIP || '../videos/two_hands_stationary_right_then_left_index_pinch_hold_1s_v1.mp4';
// Use frozen V11 page for stability; V12 reuses V11 content but may change frequently.
const pageUrl = `${base}/September2025/TectangleHexagonal/dev/integrated_hand_console_v11.html?autostart=1&nocam=1&clip=${encodeURIComponent(clip)}`;

const outDir = path.join(repoRoot, 'September2025', 'TectangleHexagonal', 'out');
const outFile = path.join(outDir, process.env.OUT || 'enriched.v11.jsonl');
const sumFile = path.join(outDir, (process.env.OUT_SUMMARY || 'enriched.v11.summary.json'));

function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p, { recursive:true }); }

function pickEnriched(e){
  if(!e) return null;
  const idx = (e.jointAngles && e.jointAngles.index) || {};
  return {
    seat: e.seat || e.id || null,
    locked: !!e.locked,
    norm: e.norm ?? null,
    rawNorm: e.rawNorm ?? null,
    velocity: e.velocity ?? null,
    acceleration: e.acceleration ?? null,
    palmAngleDeg: e.palmAngleDeg ?? null,
    jointAngles: { index: {
      mcpDeg: idx.mcpDeg ?? null,
      pipDeg: idx.pipDeg ?? null,
      dipDeg: idx.dipDeg ?? null,
    }},
    historyLen: e.historyLen ?? (Array.isArray(e.history)? e.history.length : null)
  };
}

function computeChangeCounts(rows){
  const fields = ['norm','rawNorm','velocity','acceleration','palmAngleDeg','jointAngles.index.mcpDeg','jointAngles.index.pipDeg','jointAngles.index.dipDeg'];
  const counts = Object.fromEntries(fields.map(f=>[f,{changes:0, nonNull:0}]));
  const last = {}; // per seat per field
  for(const r of rows){
    const seat = r.seat || 'unknown';
    for(const f of fields){
      const v = f.split('.').reduce((o,k)=> (o? o[k] : undefined), r);
      if(v!=null) counts[f].nonNull++;
      const key = seat+':'+f;
      if(last[key] !== undefined && v !== last[key]) counts[f].changes++;
      last[key] = v;
    }
  }
  return counts;
}

(async () => {
  ensureDir(outDir);
  const out = fs.createWriteStream(outFile, { flags:'w' });
  const allRows = [];
  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(30000);
    await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
    // Lower UI rate to reduce overhead
    await page.evaluate(() => { const sel=document.getElementById('richHz'); if(sel) sel.value='10'; });

    // Wait for a locked seat and collect seat ids
    const lockInfo = await page.waitForFunction(() => {
      const a = globalThis.__ihcV11?.seatLockAdapter; if(!a) return null;
      const snap = a.snapshot(); const keys = Object.keys(snap.enriched||{});
      const locked = keys.filter(k => snap.enriched[k]?.locked);
      if(!locked.length) return null;
      return { seats: locked };
    }, { timeout: 20000 });
    const locked = (await lockInfo.jsonValue()).seats;

    // Sample for ~5 seconds
    const start = Date.now();
    while(Date.now() - start < (process.env.DUR_MS? +process.env.DUR_MS : 5000)){
      const sample = await page.evaluate(() => {
        const a = globalThis.__ihcV11?.seatLockAdapter; if(!a) return null;
        const snap = a.snapshot();
        const ts = performance.now();
        const out=[];
        for(const [sid, e] of Object.entries(snap.enriched||{})){
          const picked = ({
            seat: sid,
            locked: !!e?.locked,
            norm: e?.norm ?? null,
            rawNorm: e?.rawNorm ?? null,
            velocity: e?.velocity ?? null,
            acceleration: e?.acceleration ?? null,
            palmAngleDeg: e?.palmAngleDeg ?? null,
            jointAngles: { index: {
              mcpDeg: e?.jointAngles?.index?.mcpDeg ?? null,
              pipDeg: e?.jointAngles?.index?.pipDeg ?? null,
              dipDeg: e?.jointAngles?.index?.dipDeg ?? null,
            }},
            historyLen: e?.historyLen ?? (Array.isArray(e?.history)? e.history.length : null)
          });
          out.push({ t: ts, kind:'enriched', ...picked });
        }
        return out;
      });
      if(Array.isArray(sample)){
        for(const row of sample){ out.write(JSON.stringify(row)+'\n'); allRows.push(row); }
      }
      await new Promise(r=>setTimeout(r, 50));
    }
  } finally {
    await browser.close();
    out.end();
  }

  const counts = computeChangeCounts(allRows);
  const summary = {
    page: pageUrl,
    outFile: path.relative(repoRoot, outFile),
    rows: allRows.length,
    seats: Array.from(new Set(allRows.map(r=>r.seat))).filter(Boolean),
    counts
  };
  fs.writeFileSync(sumFile, JSON.stringify(summary, null, 2));
  console.log('[export_rich_jsonl] Wrote', outFile, 'rows=', allRows.length);
  console.log('[export_rich_jsonl] Summary ->', sumFile);
})();
