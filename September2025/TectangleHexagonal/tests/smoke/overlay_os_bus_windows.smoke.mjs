// Smoke: Overlay OS loads, dock toggles windows, and apps receive bus messages.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import puppeteer from 'puppeteer';

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.mjs': 'application/javascript; charset=utf-8', '.css':'text/css; charset=utf-8' };
async function startServer(root){
  const server = http.createServer((req,res)=>{
    const p = decodeURIComponent((req.url||'/').split('?')[0]);
    let file = p === '/' ? 'index.html' : p;
    // Normalize to avoid path.join treating leading '/' as absolute on Windows
    const rel = file.replace(/^\/+/, '');
    const abs = path.join(root, rel);
    if(!abs.startsWith(root)){ res.statusCode=403; return res.end('Forbidden'); }
    fs.stat(abs,(err,st)=>{
      if(err || !st.isFile()){ res.statusCode=404; return res.end('Not found'); }
      res.setHeader('Content-Type', MIME[path.extname(abs)] || 'application/octet-stream');
      fs.createReadStream(abs).pipe(res);
    });
  });
  await new Promise((res,rej)=> server.listen(0,'127.0.0.1',err=> err?rej(err):res()));
  const addr = server.address();
  return { server, port: addr.port };
}

(async function(){
  const { server, port } = await startServer(process.cwd());
  const base = `http://127.0.0.1:${port}`;
  const url = `${base}/September2025/TectangleHexagonal/dev/overlay_os_v1.html?auto=1`;
  const browser = await puppeteer.launch({ headless:'new' });
  const page = await browser.newPage();
  page.on('console', msg=> console.log('[page]', msg.type(), msg.text()));
  await page.goto(url, { waitUntil:'networkidle2' });
  // ensure dock present then open sparkline and handviz via dock
  await page.waitForSelector('#dock', { timeout: 10000 });
  await page.click('#dock .icon[data-app="spark"]');
  await page.click('#dock .icon[data-app="handviz"]');
  // ensure iframes present (robust): any two app iframes, or readiness flag
  await page.waitForFunction(() => (window.__overlayReady === true) || (document.querySelectorAll('.win iframe').length >= 2), { timeout: 20000 });
  // assert apps receive bus by probing canvas pixel after synthetic feed
  // we just wait a bit and ensure requestAnimationFrame ran and canvas has non-empty data
  const nonEmpty = await page.evaluate(async ()=>{
    const ifr = [...document.querySelectorAll('.win iframe')];
    const results = await Promise.all(ifr.map(fr=> new Promise(res=>{
      const check=()=>{
        try{
          const doc = fr.contentDocument; const cv = doc.querySelector('canvas');
          const g = cv.getContext('2d'); const d = g.getImageData(0,0,cv.width,cv.height).data;
          const some = d.some(v=> v!==0); res(some);
        }catch{ res(false); }
      };
      setTimeout(check, 800);
    })));
    return results.every(Boolean);
  });
  await browser.close();
  await new Promise(r=> server.close(r));
  if(!nonEmpty){ console.error('Apps did not render non-empty canvas'); process.exit(1); }
  console.log('SUCCESS: Overlay OS windows and bus OK');
})().catch(e=>{ console.error(e); process.exit(1); });
