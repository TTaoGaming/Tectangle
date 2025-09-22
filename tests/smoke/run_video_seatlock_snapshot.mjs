// Capture seat lock adapter enriched snapshot after processing a clip (uses integrated_hand_console_v9)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';

async function main(){
  const clip = process.argv[2] || 'September2025/TectangleHexagonal/videos/two_hands_stationary_right_then_left_index_pinch_hold_1s_v1.mp4';
  if(!fs.existsSync(clip)) throw new Error('Clip not found: '+clip);
  // Reuse existing run_video_collect_golden server logic by inlining minimal server here (simpler than refactor)
  const { createServer } = await import('node:http');
  const devRoot = path.join(process.cwd(),'September2025','TectangleHexagonal','dev');
  const server = createServer((req,res)=>{
    try {
      let urlPath = decodeURIComponent((req.url||'/').split('?')[0]);
      if(urlPath==='/'||urlPath==='/index.html') urlPath='/September2025/TectangleHexagonal/dev/integrated_hand_console_v9.html';
      let candidate = path.join(process.cwd(), urlPath.replace(/^\//,''));
      if(!fs.existsSync(candidate)) candidate = path.join(devRoot, urlPath.replace(/^\//,''));
      if(!fs.existsSync(candidate) || fs.statSync(candidate).isDirectory()){ res.statusCode=404; res.end('nf'); return; }
      const stat = fs.statSync(candidate);
      const ext = path.extname(candidate).toLowerCase();
      const mime = { '.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.mjs':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.mp4':'video/mp4' }[ext]||'application/octet-stream';
      res.setHeader('Accept-Ranges','bytes');
      const range = req.headers['range'];
      if(range){
        const m = /^bytes=(\d*)-(\d*)$/.exec(String(range));
        if(m){
          let start = m[1] ? parseInt(m[1],10) : 0;
            let end = m[2] ? parseInt(m[2],10) : (stat.size-1);
            if(isNaN(start)||start<0) start=0; if(isNaN(end)||end>=stat.size) end=stat.size-1; if(start>end){ res.statusCode=416; res.setHeader('Content-Range',`bytes */${stat.size}`); res.end(); return; }
            res.statusCode=206;
            res.setHeader('Content-Range',`bytes ${start}-${end}/${stat.size}`);
            res.setHeader('Content-Length', String(end-start+1));
            res.setHeader('Content-Type', mime);
            return fs.createReadStream(candidate,{start,end}).pipe(res);
        }
      }
      res.setHeader('Content-Type', mime);
      res.setHeader('Content-Length', String(stat.size));
      fs.createReadStream(candidate).pipe(res);
    } catch(err){ res.statusCode=500; res.end('err'); }
  });
  await new Promise(r=> server.listen(0,'127.0.0.1',r));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  const pageUrl = `${base}/September2025/TectangleHexagonal/dev/integrated_hand_console_v9.html?autostart=1&nocam=1&clip=${encodeURIComponent(clip)}`; // use autostart per console initQP
  const browser = await puppeteer.launch({ headless:'new', args:['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  page.on('console', m=> console.log('[page]', m.type(), m.text()));
  await page.goto(pageUrl, { waitUntil:'networkidle2' });
  // wait for processing frames (heuristic: 5s or until seatLock for P1 locked)
  const start = Date.now();
  let snapshot;
  while(Date.now()-start < 15000){
    try {
      snapshot = await page.evaluate(()=> {
        const sl = globalThis.__seatLockAdapterV9?.snapshot();
        return sl ? { enriched: sl.enriched, counts: sl.stableCounts, frames: globalThis.__ihcV9?.diag?.frames } : null;
      });
      if(snapshot && snapshot.enriched && Object.values(snapshot.enriched).some(v=>v.locked)) break;
    } catch {}
    await new Promise(r=> setTimeout(r,300));
  }
  if(!snapshot) throw new Error('No snapshot captured');
  const outDir = 'September2025/TectangleHexagonal/out';
  fs.mkdirSync(outDir,{recursive:true});
  const outFile = path.join(outDir, path.basename(clip).replace(/\.[^.]+$/,'') + '.seatlock.snapshot.json');
  fs.writeFileSync(outFile, JSON.stringify(snapshot,null,2));
  console.log('Saved seatlock snapshot:', outFile);
  console.log('Snapshot summary:', Object.fromEntries(Object.entries(snapshot.enriched).map(([k,v])=>[k,{ locked:v.locked, norm:v.norm, historyLen:v.historyLen }])));
  await browser.close();
  server.close();
}

main().catch(e=>{ console.error(e); process.exit(1); });
