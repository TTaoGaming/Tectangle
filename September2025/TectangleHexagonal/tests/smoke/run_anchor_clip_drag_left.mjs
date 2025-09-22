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
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    let file = urlPath === '/' ? '/index.html' : urlPath;
    const abs = path.join(root, file);
    if(!abs.startsWith(root)){ res.statusCode = 403; return res.end('Forbidden'); }
    fs.stat(abs,(err,st)=>{
      if(err || !st.isFile()){ res.statusCode = 404; return res.end('Not found'); }
      res.setHeader('Content-Type', MIME[path.extname(abs)] || 'application/octet-stream');
      fs.createReadStream(abs).pipe(res);
    });
  });
  await new Promise((resolve, reject)=> server.listen(0,'127.0.0.1', err=> err?reject(err):resolve()));
  const { port } = server.address();
  return { server, port };
}

async function main(){
  const clipPath = 'September2025/TectangleHexagonal/videos/right_hand_pinch_anchor_drag_left_v1.mp4';
  if(!fs.existsSync(clipPath)){
    console.error('Clip missing:', clipPath);
    process.exit(2);
  }
  const root = process.cwd();
  const { server, port } = await startServer(root);
  const base = `http://127.0.0.1:${port}`;
  const pageUrl = `${base}/September2025/TectangleHexagonal/dev/anchor_joystick_demo.html?clip=${encodeURIComponent(clipPath)}`;
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.on('console', msg => console.log('[page]', msg.type(), msg.text()));
  await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Array.isArray(window.__anchorEvents), { timeout: 15000 }).catch(()=>{});

  const ok = await page.waitForFunction(() => {
    if(!Array.isArray(window.__anchorEvents)) return false;
    const updates = window.__anchorEvents.filter(e => e.type === 'anchor:update');
    if(!updates.length) return false;
    return updates.some(u => Array.isArray(u.vector) && u.vector[0] < -0.1);
  }, { timeout: 60000 }).catch(()=> false);

  const events = await page.evaluate(() => window.__anchorEvents || []);
  await browser.close();
  await new Promise(resolve => server.close(resolve));

  if(!ok){
    console.error('No anchor:update with negative X detected. Captured events:', events);
    process.exit(1);
  }
  console.log('ANCHOR_CLIP_LEFT_OK');
  events.forEach(e => console.log(e));
}

main().catch(err => { console.error(err); process.exit(1); });
