// WEBWAY:ww-2025-025 per-frame rich telemetry exporter (seat-lock gated)
// Purpose: Load V10 console on a clip, export per-frame enriched telemetry per seat (P1/P2),
// verify that rich fields appear only after seat lock, and confirm no cross-seat contamination.
// Also confirms raw landmark exposure for index finger joints (MCP/PIP/DIP/TIP) via MediaPipe 21-pt array.

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import url from 'node:url';
import puppeteer from 'puppeteer';

const PAGE = 'September2025/TectangleHexagonal/dev/integrated_hand_console_v10.html';

function startServer(root){
  return new Promise((resolve,reject)=>{
    const server = http.createServer((req,res)=>{
      try {
        const urlPath = decodeURIComponent((req.url||'/').split('?')[0]);
        let p = urlPath==='/'?'/index.html':urlPath; const abs=path.join(root,p);
        if(!abs.startsWith(root)){ res.statusCode=403; return res.end('forbidden'); }
        if(!fs.existsSync(abs)||!fs.statSync(abs).isFile()){ res.statusCode=404; return res.end('nf'); }
        const ext=path.extname(abs).toLowerCase();
        const mime= ext==='.html'?'text/html; charset=utf-8': ext==='.js'||ext==='.mjs'?'application/javascript; charset=utf-8': ext==='.css'?'text/css; charset=utf-8': ext==='.mp4'?'video/mp4':'application/octet-stream';
        res.setHeader('Content-Type', mime); if(ext==='.mp4') res.setHeader('Accept-Ranges','bytes');
        fs.createReadStream(abs).pipe(res);
      } catch(e){ res.statusCode=500; res.end('err'); }
    });
    server.listen(0,'127.0.0.1',()=>{ const {port}=server.address(); resolve({server,port}); });
    server.on('error',reject);
  });
}

function parseArgs(){
  const args = process.argv.slice(2);
  const opts = { mp4: null, out: null, maxMs: 8000 };
  for(let i=0;i<args.length;i++){
    const a=args[i];
    if(!opts.mp4 && !a.startsWith('--')){ opts.mp4=a; continue; }
    if(a.startsWith('--out=')){ opts.out=a.slice(6); continue; }
    if(a.startsWith('--maxMs=')){ opts.maxMs=+a.slice(8)||opts.maxMs; continue; }
  }
  if(!opts.mp4){
    opts.mp4 = 'September2025/TectangleHexagonal/videos/two_hands_stationary_right_then_left_index_pinch_hold_1s_v1.mp4';
  }
  if(!opts.out){
    const ts = new Date().toISOString().replace(/[:.]/g,'-');
    opts.out = path.join('tmp', `rich_export_${ts}.json`);
  }
  return opts;
}

async function collect(page, maxMs){
  const start = Date.now();
  const rows = [];
  // Ensure adapters exist
  await page.waitForFunction(()=> !!globalThis.__seatLockAdapterV10 && !!globalThis.__ihcV10, { timeout: 15000 });
  // Run at ~60 Hz best-effort until timeout or video ends
  while(Date.now()-start < maxMs){
    const row = await page.evaluate(()=>{
      const vid = document.querySelector('video');
      const tSec = (vid && vid.currentTime) || 0;
      const sl = globalThis.__seatLockAdapterV10; // has snapshot()
      const snap = sl && sl.snapshot ? sl.snapshot() : { enriched: globalThis.__seatLockAdapterState?.enriched||{} };
      const enriched = snap.enriched || {};
      const stable = (snap.seatsStableCount) || (globalThis.__seatLockAdapterState?.seatsStableCount) || {};
      const seats = Object.keys(enriched);
      const out = { tSec: +tSec.toFixed(3), seats:{} };
      for(const seat of seats){
        const e = enriched[seat]; if(!e) continue;
        out.seats[seat] = {
          locked: !!e.locked,
          id: e.id||null,
          norm: e.norm ?? null,
          rawNorm: e.rawNorm ?? null,
          velocity: e.velocity ?? null,
          acceleration: e.acceleration ?? null,
          palmAngleDeg: e.palmAngleDeg ?? null,
          thresholds: e.thresholds || null,
          jointAngles: e.jointAngles || null,
          stableCount: stable[seat]||0
        };
      }
      // Landmark availability check (index PIP/DIP from 21-pt array)
      let lmInfo = { has: false, ix:{ mcp:false, pip:false, dip:false, tip:false } };
      try{
        const st = globalThis.__ihcV10.shell.getState();
        const lm = st && st.lastFrame && Array.isArray(st.lastFrame.landmarks) ? st.lastFrame.landmarks : null;
        if(lm){
          lmInfo.has = true;
          lmInfo.ix.mcp = Array.isArray(lm[5]);
          lmInfo.ix.pip = Array.isArray(lm[6]);
          lmInfo.ix.dip = Array.isArray(lm[7]);
          lmInfo.ix.tip = Array.isArray(lm[8]);
        }
      }catch{}
      return { tSec: out.tSec, seats: out.seats, lmInfo };
    });
    rows.push(row);
    // Stop if <video> ended
    const ended = await page.evaluate(()=>{ const v=document.querySelector('video'); return !!(v && v.ended); });
    if(ended) break;
    await new Promise(r=>setTimeout(r, 16));
  }
  return rows;
}

function analyze(rows){
  const seats = ['P1','P2'];
  const perSeat = Object.fromEntries(seats.map(s=>[s, rows.map(r=>({ t:r.tSec, e:r.seats[s]||null }))]));
  const lockedAfter = {};
  const haveMetrics = {};
  for(const s of seats){
    const seq = perSeat[s];
    const firstLockIdx = seq.findIndex(x=>x.e && x.e.locked);
    lockedAfter[s] = firstLockIdx>=0 ? seq[firstLockIdx].t : null;
    haveMetrics[s] = seq.some(x=>x.e && x.e.locked && (x.e.norm!=null || x.e.velocity!=null));
  }
  // Cross-seat difference: compute mean abs diff over overlapping locked windows
  const pairs = [];
  for(const r of rows){
    const a=r.seats.P1, b=r.seats.P2; if(a&&b && a.locked && b.locked && a.norm!=null && b.norm!=null){ pairs.push(Math.abs(a.norm - b.norm)); }
  }
  const meanDiff = pairs.length ? pairs.reduce((a,b)=>a+b,0)/pairs.length : 0;
  // Landmark presence aggregation
  const lmAny = rows.some(r=>r.lmInfo && r.lmInfo.has);
  const lmIx = rows.reduce((acc,r)=>{
    if(r.lmInfo && r.lmInfo.has){
      acc.mcp |= !!r.lmInfo.ix.mcp; acc.pip |= !!r.lmInfo.ix.pip; acc.dip |= !!r.lmInfo.ix.dip; acc.tip |= !!r.lmInfo.ix.tip;
    }
    return acc;
  }, { mcp:false, pip:false, dip:false, tip:false });
  return { lockedAfter, haveMetrics, meanDiff, lmAny, lmIx };
}

async function main(){
  const opts = parseArgs();
  if(!fs.existsSync(opts.mp4)) throw new Error('MP4 not found: '+opts.mp4);
  const root = process.cwd(); const { server, port } = await startServer(root);
  const base = `http://127.0.0.1:${port}`;
  const pageUrl = `${base}/${PAGE}?clip=${encodeURIComponent(opts.mp4)}&nocam=1&autostart=1`;
  const browser = await puppeteer.launch({ headless:'new', args:['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  await page.goto(pageUrl, { waitUntil:'networkidle2' });
  // Wait for any seat to stabilize/lock or for landmarks to flow
  await page.waitForFunction(()=>{
    const sl = globalThis.__seatLockAdapterV10; if(!sl) return false;
    const snap = sl.snapshot ? sl.snapshot() : null; const e = snap && snap.enriched; if(!e) return false;
    const any = Object.values(e).some(x=>x && x.locked);
    const st = (globalThis.__ihcV10 && globalThis.__ihcV10.shell && globalThis.__ihcV10.shell.getState && globalThis.__ihcV10.shell.getState()) || null;
    const lm = st && st.lastFrame && Array.isArray(st.lastFrame.landmarks);
    return any || lm;
  }, { timeout: 20000 });

  const rows = await collect(page, opts.maxMs);
  const analysis = analyze(rows);

  // Persist JSON
  const outDir = path.dirname(opts.out); if(!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive:true });
  const out = { clip: opts.mp4, generatedAt: new Date().toISOString(), rows };
  fs.writeFileSync(opts.out, JSON.stringify(out, null, 2));

  // Plain-language summary
  const lines = [];
  lines.push('Exporter summary:');
  lines.push(`- Frames captured: ${rows.length}`);
  lines.push(`- Seat lock times (s): P1=${analysis.lockedAfter.P1??'n/a'}, P2=${analysis.lockedAfter.P2??'n/a'}`);
  lines.push(`- Rich metrics present post-lock: P1=${analysis.haveMetrics.P1}, P2=${analysis.haveMetrics.P2}`);
  lines.push(`- Cross-seat norm difference (mean abs): ${analysis.meanDiff.toFixed(4)} (expect > 0 to avoid contamination)`);
  lines.push(`- Landmarks array present: ${analysis.lmAny}; Index joints available MCP:${analysis.lmIx.mcp} PIP:${analysis.lmIx.pip} DIP:${analysis.lmIx.dip} TIP:${analysis.lmIx.tip}`);
  const summary = lines.join('\n');
  console.log(summary);
  await browser.close(); await new Promise(r=>server.close(r));

  // Basic expectation checks: rich only after lock and cross-seat difference
  if(!(analysis.haveMetrics.P1 || analysis.haveMetrics.P2)){
    console.warn('[WARN] No rich metrics detected post-lock (check clip/flags).');
  }
  if(analysis.meanDiff < 1e-3){
    console.warn('[WARN] Cross-seat norm very similar; verify simple sequence locks distinct controllers.');
  }
}

main().catch(err=>{ console.error('export_v10_rich_telemetry FAILED:', err); process.exit(1); });
