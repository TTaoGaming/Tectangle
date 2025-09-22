// Smoke: verify V10 UI reflects live updates to seat-lock enriched metrics (simulated injection)
// Usage: node tests/smoke/verify_v10_live_update.mjs [mp4RelativePath]
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
        const ext=path.extname(abs).toLowerCase(); const mime= ext==='.html'?'text/html; charset=utf-8': ext==='.js'||ext==='.mjs'?'application/javascript; charset=utf-8': ext==='.css'?'text/css; charset=utf-8': ext==='.mp4'?'video/mp4':'application/octet-stream'; res.setHeader('Content-Type', mime); fs.createReadStream(abs).pipe(res); }
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
  // Wait for seat locks
  await page.waitForFunction(()=>/seatLock=P1:L/.test(document.getElementById('diag')?.textContent||''), { timeout:30000 });
  // Freeze adapter ticks and inject synthetic numeric metrics via helpers (prevents overwrite by next tick)
  await page.evaluate(()=>{
    if(!globalThis.__seatLockFreeze || !globalThis.__seatLockInject) throw new Error('injection helpers missing');
    globalThis.__seatLockFreeze();
    globalThis.__seatLockInject('P1', { seat:'P1', locked:true, id: 'hand:Right', norm:0.456, rawNorm:0.432, velocity:-1.23, acceleration:0.07, palmAngleDeg:12.3, jointAngles:{ index:{ mcpDeg:45, pipDeg:30, dipDeg:15 } }, history:[], historyLen:0 });
    globalThis.__seatLockInject('P2', { seat:'P2', locked:true, id: 'hand:Left', norm:0.789, rawNorm:0.755, velocity:-0.50, acceleration:0.02, palmAngleDeg:8.9, jointAngles:{ index:{ mcpDeg:50, pipDeg:28, dipDeg:12 } }, history:[], historyLen:0 });
  });
  // Wait for UI to reflect injected decimals
  await page.waitForFunction(()=>{
    const tbody=document.getElementById('richTBody'); if(!tbody) return false; const txt=tbody.innerText; return /0.456/.test(txt) && /0.789/.test(txt) && /12.3/.test(txt);
  }, { timeout:10000 });
  const table = await page.$eval('#richTBody', el=>el.innerText);
  console.log('Injected table contents:\n'+table);
  await browser.close(); await new Promise(r=>server.close(r));
  console.log('V10 live update UI exposure smoke SUCCESS');
}

main().catch(err=>{ console.error('V10 live update smoke FAILED:', err); process.exit(1); });
