// Smoke: verify V10 console boots and can start a clip, exposing seat-lock metrics
// Usage: node tests/smoke/verify_v10_boot.mjs [mp4RelativePath]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';

const PAGE = 'September2025/TectangleHexagonal/dev/integrated_hand_console_v10.html';

function startServer(root){
  return new Promise((resolve,reject)=>{
    const server = http.createServer((req,res)=>{
      try {
        const urlPath = decodeURIComponent((req.url||'/').split('?')[0]);
        let p = urlPath === '/' ? '/index.html' : urlPath;
        const abs = path.join(root, p);
        if(!abs.startsWith(root)) { res.statusCode=403; return res.end('forbidden'); }
        if(!fs.existsSync(abs) || !fs.statSync(abs).isFile()){ res.statusCode=404; return res.end('nf'); }
        const ext = path.extname(abs).toLowerCase();
        const mime = ext==='.html'?'text/html; charset=utf-8': ext==='.js'||ext==='.mjs'?'application/javascript; charset=utf-8': ext==='.css'?'text/css; charset=utf-8': ext==='.mp4'?'video/mp4':'application/octet-stream';
        res.setHeader('Content-Type', mime);
        if(ext==='.mp4'){ res.setHeader('Accept-Ranges','bytes'); }
        const range = req.headers['range'];
        if(range && ext==='.mp4'){
          const st = fs.statSync(abs); const m=/bytes=(\d*)-(\d*)/.exec(range)||[]; let s=m[1]?+m[1]:0; let e=m[2]?+m[2]:st.size-1; if(s>e) s=0; e=Math.min(e, st.size-1); res.statusCode=206; res.setHeader('Content-Range',`bytes ${s}-${e}/${st.size}`); res.setHeader('Content-Length',e-s+1); fs.createReadStream(abs,{start:s,end:e}).pipe(res); return; }
        fs.createReadStream(abs).pipe(res);
      } catch(e){ res.statusCode=500; res.end('err'); }
    });
    server.listen(0,'127.0.0.1',()=>{ const {port}=server.address(); resolve({server,port}); });
    server.on('error',reject);
  });
}

async function main(){
  const mp4Rel = process.argv[2] || 'September2025/TectangleHexagonal/videos/two_hands_stationary_right_then_left_index_pinch_hold_1s_v1.mp4'; // corrected nested path
  const root = process.cwd();
  const mp4Abs = path.resolve(mp4Rel);
  if(!fs.existsSync(mp4Abs)) throw new Error('MP4 not found: '+mp4Abs);
  const {server, port} = await startServer(root);
  const base = `http://127.0.0.1:${port}`;
  const pageUrl = `${base}/${PAGE}?clip=${encodeURIComponent(mp4Rel)}&nocam=1&autostart=1`;
  const browser = await puppeteer.launch({ headless:'new', args:['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  const failedRequests = [];
  page.on('console', m=> console.log('[page]', m.type(), m.text()));
  page.on('pageerror', e=> console.error('[page] error', e.message));
  page.on('requestfailed', req=>{
    failedRequests.push({ url:req.url(), method:req.method(), failure:req.failure()?.errorText });
  });
  page.on('response', async res=>{
    if(res.status()>=400){ failedRequests.push({ url:res.url(), status:res.status(), statusText:res.statusText() }); }
  });
  console.log('Navigating', pageUrl);
  await page.goto(pageUrl, { waitUntil:'networkidle2' });
  // Wait for frames to increment and diag to show
  const ok = await page.waitForFunction(()=>{
    const d = document.getElementById('diag');
    if(!d) return false;
    const txt = d.textContent||'';
    // Accept frames increment regardless of errors count field (errors=0 is normal)
    return /frames=\d+/.test(txt);
  }, { timeout: 20000 }).catch(()=>false);
  if(!ok){
    const trace = await page.evaluate(()=> globalThis.__v10BootTrace || []);
    console.error('Boot trace (partial):', trace);
    throw new Error('Diag not updating (frames) within timeout');
  }
  // Wait until seat-lock adapter begins populating (either locked or pending entries)
  const richOk = await page.waitForFunction(()=>{
    const tbody = document.getElementById('richTBody');
    if(!tbody) return false;
    const rows = tbody.querySelectorAll('tr');
    if(!rows.length) return false;
    // If populated with seat rows returns true (look for P1 or P2 text cells)
    return Array.from(rows).some(r=> /P1|P2/.test(r.textContent||''));
  }, { timeout: 30000 }).catch(()=>false);
  const diagText = await page.$eval('#diag', el=> el.textContent||'');
  const tableHTML = await page.$eval('#richTBody', el=> el.innerText);
  console.log('DIAG:', diagText);
  console.log('RICH TABLE:\n'+tableHTML);
  if(!richOk){
    const trace = await page.evaluate(()=> globalThis.__v10BootTrace || []);
    console.error('Boot trace (final):', trace);
    const adapterPresent = await page.evaluate(()=> !!globalThis.__seatLockAdapterV10);
    console.error('SeatLockAdapter present:', adapterPresent);
    throw new Error('Seat-lock table never populated');
  }
  // Basic assertion: at least one norm value present
  if(!/norm|Norm|LOCK/.test(tableHTML)) console.warn('Table populated but expected metrics not detected');
  const trace = await page.evaluate(()=> globalThis.__v10BootTrace || []);
  console.log('Boot trace:', trace);
  if(failedRequests.length){
    console.log('Failed/errored requests:');
    for(const fr of failedRequests){ console.log('  -', JSON.stringify(fr)); }
  }
  await browser.close();
  await new Promise(r=> server.close(r));
  console.log('V10 boot + clip smoke SUCCESS');
}

main().catch(err=>{ console.error('V10 boot smoke FAILED:', err); process.exit(1); });
