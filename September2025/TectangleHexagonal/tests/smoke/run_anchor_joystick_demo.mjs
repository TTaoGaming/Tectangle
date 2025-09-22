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
  const root = process.cwd();
  const { server, port } = await startServer(root);
  const base = `http://127.0.0.1:${port}`;
  const pageUrl = `${base}/September2025/TectangleHexagonal/dev/anchor_joystick_demo.html`;
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.on('console', msg => console.log('[page]', msg.type(), msg.text()));
  await page.goto(`${pageUrl}?clip=September2025/TectangleHexagonal/videos/two_hands_stationary_right_then_left_index_pinch_hold_1s_v1.mp4`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof window.__anchorDemo === 'object', { timeout: 10000 });

  // Simulate anchor events via debug helper.
  await page.evaluate(() => {
    window.__anchorDemo.emit({ type:'anchor:start', t:100, vector:[0,0,0], handKey:'hand:Right' });
    window.__anchorDemo.emit({ type:'anchor:update', t:150, vector:[0.35,-0.15,0.05], handKey:'hand:Right' });
    window.__anchorDemo.emit({ type:'anchor:end', t:220, vector:[0.10,0.02,0], handKey:'hand:Right' });
  });

  const anchorState = await page.$eval('#anchorState', el => el.textContent);
  const logText = await page.$eval('#debugLog', el => el.textContent);
  if(anchorState !== 'released'){ throw new Error(`expected anchorState released, got ${anchorState}`); }
  if(!/anchor:update/.test(logText) || !logText.includes('0.350')){
    throw new Error('anchor update vector not logged as expected');
  }

  await browser.close();
  await new Promise(resolve => server.close(resolve));
  console.log('ANCHOR_JOYSTICK_DEMO_OK');
}

main().catch(err => { console.error(err); process.exit(1); });
