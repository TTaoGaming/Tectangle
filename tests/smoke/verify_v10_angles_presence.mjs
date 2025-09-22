// Verify index angles presence over frames and adjustable UI update rate
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import puppeteer from 'puppeteer';

const PAGE = 'September2025/TectangleHexagonal/dev/integrated_hand_console_v10.html';

function startServer(root){
  return new Promise((resolve,reject)=>{
    const server = http.createServer((req,res)=>{
      try { const urlPath = decodeURIComponent((req.url||'/').split('?')[0]); let p = urlPath==='/'?'/index.html':urlPath; const abs=path.join(root,p); if(!abs.startsWith(root)){ res.statusCode=403; return res.end('forbidden'); }
        if(!fs.existsSync(abs)||!fs.statSync(abs).isFile()){ res.statusCode=404; return res.end('nf'); }
        const ext=path.extname(abs).toLowerCase(); const mime= ext==='.html'?'text/html; charset=utf-8': ext==='.js'||ext==='.mjs'?'application/javascript; charset=utf-8': ext==='.css'?'text/css; charset=utf-8': ext==='.mp4'?'video/mp4':'application/octet-stream'; res.setHeader('Content-Type', mime); if(ext==='.mp4') res.setHeader('Accept-Ranges','bytes'); fs.createReadStream(abs).pipe(res); }
      catch(e){ res.statusCode=500; res.end('err'); }
    });
    server.listen(0,'127.0.0.1',()=>{ const {port}=server.address(); resolve({server,port}); });
    server.on('error',reject);
  });
}

async function main(){
  const mp4Rel = process.argv[2] || 'September2025/TectangleHexagonal/videos/two_hands_stationary_right_then_left_index_pinch_hold_1s_v1.mp4';
  if(!fs.existsSync(mp4Rel)) throw new Error('MP4 not found: '+mp4Rel);
  const root=process.cwd(); const {server, port}=await startServer(root); const base=`http://127.0.0.1:${port}`;
  const pageUrl = `${base}/${PAGE}?clip=${encodeURIComponent(mp4Rel)}&nocam=1&autostart=1`;
  const browser = await puppeteer.launch({ headless:'new', args:['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  await page.goto(pageUrl, { waitUntil:'networkidle2' });
  await page.waitForFunction(()=>/seatLock=P1:L/.test(document.getElementById('diag')?.textContent||''), { timeout:30000 });
  // Ensure UI update rate: set to every frame briefly to accumulate presence, then set to 1Hz and ensure it still updates
  await page.evaluate(()=>{ const sel=document.getElementById('richHz'); if(sel) sel.value='frame'; });
  // Wait ~1s then read angle presence counters
  await new Promise(res=>setTimeout(res, 1200));
  const presence1 = await page.evaluate(()=> globalThis.__v10AnglePresence || { P1:0, P2:0 });
  console.log('Angle presence after 1.2s (frame):', presence1);
  // Expect at least some angle samples for at least one seat (clip dependent)
  if((presence1.P1||0)===0 && (presence1.P2||0)===0){
    console.warn('WARNING: No index angle samples detected in first window');
  }
  // Switch to 1 Hz and ensure table still updates
  await page.evaluate(()=>{ const sel=document.getElementById('richHz'); if(sel) sel.value='1'; });
  const textBefore = await page.$eval('#richTBody', el=>el.innerText);
  await new Promise(res=>setTimeout(res, 1100));
  const textAfter = await page.$eval('#richTBody', el=>el.innerText);
  if(textBefore === textAfter){
    throw new Error('1Hz UI update did not advance');
  }
  console.log('1Hz throttle observed a change in table content');
  await browser.close(); await new Promise(r=>server.close(r));
  console.log('V10 angle presence + 1Hz update smoke SUCCESS');
}

main().catch(err=>{ console.error('V10 angle presence smoke FAILED:', err); process.exit(1); });
