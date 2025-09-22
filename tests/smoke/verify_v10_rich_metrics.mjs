// Smoke: verify V10 rich seat-lock metrics populate numeric fields (norm/raw/vel/palm/index angles)
// Usage: node tests/smoke/verify_v10_rich_metrics.mjs [mp4RelativePath]
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import puppeteer from 'puppeteer';

const PAGE = 'September2025/TectangleHexagonal/dev/integrated_hand_console_v10.html';

function startServer(root){
  return new Promise((resolve,reject)=>{
    const server = http.createServer((req,res)=>{
      try { const urlPath = decodeURIComponent((req.url||'/').split('?')[0]); let p = urlPath === '/' ? '/index.html' : urlPath; const abs = path.join(root,p); if(!abs.startsWith(root)){ res.statusCode=403; return res.end('forbidden'); }
        if(!fs.existsSync(abs) || !fs.statSync(abs).isFile()){ res.statusCode=404; return res.end('nf'); }
        const ext = path.extname(abs).toLowerCase(); const mime = ext==='.html'?'text/html; charset=utf-8': ext==='.js'||ext==='.mjs'?'application/javascript; charset=utf-8': ext==='.css'?'text/css; charset=utf-8': ext==='.mp4'?'video/mp4':'application/octet-stream'; res.setHeader('Content-Type', mime); if(ext==='.mp4') res.setHeader('Accept-Ranges','bytes'); fs.createReadStream(abs).pipe(res); }
      catch(e){ res.statusCode=500; res.end('err'); }
    });
    server.listen(0,'127.0.0.1',()=>{ const {port}=server.address(); resolve({server,port}); });
    server.on('error',reject);
  });
}

function extractTableRows(text){
  const lines = text.split(/\n+/).map(l=>l.trim()).filter(Boolean);
  return lines.filter(l=>/^P[12]/.test(l));
}

async function main(){
  const mp4Rel = process.argv[2] || 'September2025/TectangleHexagonal/videos/two_hands_stationary_right_then_left_index_pinch_hold_1s_v1.mp4';
  if(!fs.existsSync(mp4Rel)) throw new Error('MP4 not found: '+mp4Rel);
  const root = process.cwd();
  const {server, port} = await startServer(root);
  const base = `http://127.0.0.1:${port}`;
  const pageUrl = `${base}/${PAGE}?clip=${encodeURIComponent(mp4Rel)}&nocam=1&autostart=1`;
  const browser = await puppeteer.launch({ headless:'new', args:['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  await page.goto(pageUrl, { waitUntil:'networkidle2' });
  // Wait for both seats locked
  await page.waitForFunction(()=>/seatLock=P1:L P2:L/.test(document.getElementById('diag')?.textContent||''), { timeout:30000 });
  // Wait for at least one numeric value (non '-' ) in Norm column
  const richOk = await page.waitForFunction(()=>{
    const tbody = document.getElementById('richTBody'); if(!tbody) return false; const rows=[...tbody.querySelectorAll('tr')];
    return rows.some(r=>/P1|P2/.test(r.textContent||'') && /\d\./.test(r.textContent||''));
  }, { timeout:20000 }).catch(()=>false);
  const tableText = await page.$eval('#richTBody', el=> el.innerText);
  console.log('RICH TABLE RAW:\n'+tableText);
  if(!richOk){
    const trace = await page.evaluate(()=> globalThis.__v10BootTrace || []);
    console.error('Boot trace:', trace);
    throw new Error('Rich table did not show numeric metrics');
  }
  const rows = extractTableRows(tableText);
  console.log('Rows:', rows);
  if(!rows.length) throw new Error('No seat rows extracted');
  const parsed = rows.map(r=>{ const parts=r.split(/\s+/); return { seat:parts[0], lock:parts[1], id:parts[2] }; });
  console.log('Parsed summary:', parsed);
  await browser.close(); await new Promise(r=>server.close(r));
  console.log('V10 rich metrics smoke SUCCESS');
}

main().catch(err=>{ console.error('V10 rich metrics smoke FAILED:', err); process.exit(1); });
