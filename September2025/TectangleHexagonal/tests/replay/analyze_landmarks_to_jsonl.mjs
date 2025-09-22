/*
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
 - [ ] Re-evaluate this artifact against current Hexagonal goals
 - [ ] Run this test with the latest September2025 build
 - [ ] Log decisions in TODO_2025-09-16.md
*/

import puppeteer from 'puppeteer';
import fs from 'fs';
import http from 'http';
import path from 'path';

if(process.argv.length < 5){
  console.error('Usage: node tests/replay/analyze_landmarks_to_jsonl.mjs <devPageUrlOrPath> <landmarks.jsonl> <out.jsonl>');
  process.exit(2);
}

const pageArg = process.argv[2];
const tracePath = process.argv[3];
const outPath = process.argv[4];

async function waitForUrl(url, timeoutMs=10000){
  const t0 = Date.now();
  while(Date.now()-t0 < timeoutMs){
    try{ const res = await fetch(url, { method:'GET' }); if(res.ok) return true; }catch{}
    await new Promise(r=>setTimeout(r,200));
  }
  return false;
}

function guessContentType(file){
  const ext = path.extname(file).toLowerCase();
  return (
    ext === '.html' ? 'text/html' :
    ext === '.js' || ext === '.mjs' ? 'application/javascript' :
    ext === '.css' ? 'text/css' :
    ext === '.json' ? 'application/json' :
    ext === '.png' ? 'image/png' :
    ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
    'application/octet-stream'
  );
}

async function ensureServerForPath(pagePath){
  const root = process.cwd();
  const ports = [8081, 8082, 8090, 3000];
  async function tryListen(port){
    return await new Promise((resolve)=>{
      const server = http.createServer((req, res)=>{
        try{
          const u = decodeURIComponent((req.url||'/').split('?')[0]);
          const rel = u.replace(/^\/+/, '');
          const filePath = path.normalize(path.join(root, rel));
          if(!filePath.startsWith(root)){ res.writeHead(403); res.end('Forbidden'); return; }
          let target = filePath;
          if(fs.existsSync(target) && fs.statSync(target).isDirectory()){
            target = path.join(target, 'index.html');
          }
          if(!fs.existsSync(target)){
            res.writeHead(404); res.end('Not Found'); return;
          }
          const ct = guessContentType(target);
          res.writeHead(200, { 'Content-Type': ct, 'Access-Control-Allow-Origin': '*' });
          fs.createReadStream(target).pipe(res);
        }catch(e){ res.writeHead(500); res.end('Server error'); }
      });
      server.on('error', ()=> resolve(null));
      server.listen(port, '127.0.0.1', async ()=>{
        resolve(server);
      });
    });
  }
  for(const p of ports){
    const server = await tryListen(p);
    if(server){
      const url = `http://127.0.0.1:${p}/${pagePath.replace(/^\/+/, '')}`;
      const ok = await waitForUrl(url, 5000);
      if(ok) return { url, close: ()=> server.close() };
      try{ server.close(); }catch{}
    }
  }
  throw new Error('Could not start a local server for dev page');
}

function readJsonl(path){
  const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/).filter(Boolean);
  const arr = [];
  for(const ln of lines){ try{ arr.push(JSON.parse(ln)); }catch{} }
  if(arr.length && arr[0].meta) arr.shift();
  return arr;
}

function writeLines(out, lines){ fs.mkdirSync(path.dirname(out), { recursive:true }); fs.writeFileSync(out, lines.join('\n')+'\n', 'utf8'); }

(async ()=>{
  const frames = readJsonl(tracePath);
  let server = null;
  let devUrl = pageArg;
  if(!/^https?:\/\//i.test(pageArg)){
    const s = await ensureServerForPath(pageArg);
    devUrl = s.url; server = s;
  }

  const browser = await puppeteer.launch({ headless: 'new' });
  try{
    const page = await browser.newPage();
    await page.goto(devUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction('window.__hexReady===true', { timeout: 10000 });

    await page.evaluate((frames)=> window.__hex.replayLandmarks(frames), frames);

    // Pull analysis lines and telemetry snapshot
    const analysis = await page.evaluate(()=> (window.__getAnalysis && window.__getAnalysis()) || []);
    const telemetry = await page.evaluate(()=> window.__getTelemetry && window.__getTelemetry());

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  writeLines(outPath, analysis);
    const summary = { downs: telemetry?.downs||0, ups: telemetry?.ups||0, frames: telemetry?.frames||0, lastToiError: telemetry?.lastToiError ?? null };
    console.log(JSON.stringify({ ok:true, out: outPath, summary }));
  } finally {
    await browser.close();
  if(server){ try{ server.close(); }catch{} }
  }
})();
