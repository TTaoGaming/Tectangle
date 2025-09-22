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

// Smoke: Load appshell_demo.html and process an MP4 ensuring two distinct seats are assigned after playback.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import puppeteer from 'puppeteer';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.mp4': 'video/mp4'
};

async function startServer(root){
  const server = http.createServer((req,res)=>{
    const p = decodeURIComponent((req.url||'/').split('?')[0]);
    let file = p === '/' ? '/index.html' : p;
    const abs = path.join(root, file);
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

async function main(){
  const relMp4 = process.argv[2] || 'September2025/TectangleHexagonal/videos/two_hands_stationary_right_then_left_index_pinch_hold_1s_v1.mp4';
  if(!fs.existsSync(relMp4)){
    console.error('MP4 not found:', relMp4);
    process.exit(2);
  }
  const root = process.cwd();
  const { server, port } = await startServer(root);
  const base = `http://127.0.0.1:${port}`;
  const pageUrl = `${base}/September2025/TectangleHexagonal/dev/appshell_demo.html`;
  const browser = await puppeteer.launch({ headless:'new' });
  const page = await browser.newPage();
  page.on('console', msg=> console.log('[page]', msg.type(), msg.text()));
  await page.goto(pageUrl, { waitUntil:'networkidle2' });
  await page.waitForFunction(()=> !!window.__appshellPlayUrl, { timeout: 20000 });
  const videoUrl = `${base}/${relMp4.split(path.sep).join('/')}`;
  await page.evaluate(url=> window.__appshellPlayUrl(url), videoUrl);

  const ok = await page.waitForFunction(()=>{
    try{
      const st = window.__appshellGetState && window.__appshellGetState();
      if(!st) return false;
      const map = st.seats?.map || [];
      const seatsUsed = new Set(map.map(p => p[1]));
      return seatsUsed.has('P1') && seatsUsed.has('P2');
    }catch{ return false; }
  }, { timeout: 60000 }).catch(()=> false);

  const finalState = await page.evaluate(()=> window.__appshellGetState && window.__appshellGetState());
  console.log('FINAL_STATE:', JSON.stringify(finalState, null, 2));
  await browser.close();
  await new Promise(r=> server.close(r));
  if(!ok){
    console.error('Did not observe P1 and P2 during playback.');
    process.exit(1);
  }
  console.log('SUCCESS: P1 and P2 observed.');
}

main().catch(e=>{ console.error(e); process.exit(1); });
