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

// Usage: node September2025/TectangleHexagonal/tests/smoke/run_sphere_by_palmwidth.js "September2025/TectangleHexagonal/videos/right_hand_normal.mp4"
// Spins a tiny static server, opens the fingertip sphere page, feeds the MP4, and reports PASS/FAIL based on radius variation.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import puppeteer from 'puppeteer';

const MIME = { '.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.mjs':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.wasm':'application/wasm','.ico':'image/x-icon','.map':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8', '.mp4':'video/mp4' };

async function startServer({ root = process.cwd(), port = 0 } = {}){
  const server = http.createServer((req, res) => {
    try {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      let pathname = urlPath || '/';
      if (pathname === '/') pathname = '/index.html';
      if (pathname.endsWith('/')) pathname += 'index.html';
      const safePath = path.normalize(path.join(root, pathname));
      if (!safePath.startsWith(path.normalize(root))) { res.statusCode = 403; res.end('Forbidden'); return; }
      fs.stat(safePath, (err, stats) => {
        if (err || !stats.isFile()) { res.statusCode = 404; res.end('Not found'); return; }
        const ext = path.extname(safePath).toLowerCase();
        const mime = MIME[ext] || 'application/octet-stream';
        res.setHeader('Content-Type', mime);
        const stream = fs.createReadStream(safePath);
        stream.on('error', () => { res.statusCode = 500; res.end('Server error'); });
        stream.pipe(res);
      });
    } catch (e) { res.statusCode = 500; res.end('Server error'); }
  });
  return new Promise((resolve, reject) => {
    server.listen(port, '127.0.0.1', () => {
      const addr = server.address();
      const actualPort = (addr && typeof addr === 'object' && addr.port) ? addr.port : port;
      resolve({ server, port: actualPort });
    });
    server.on('error', (err) => reject(err));
  });
}

async function stopServer(server){ if(!server) return; await new Promise((res, rej)=> server.close(err=> err? rej(err): res())); }

async function main(){
  const inputPath = process.argv[2];
  if(!inputPath){ console.error('Provide a path to an MP4 file. Example:\n  node September2025/TectangleHexagonal/tests/smoke/run_sphere_by_palmwidth.js "September2025/TectangleHexagonal/videos/right_hand_normal.mp4"'); process.exit(1); }
  const absInput = path.resolve(inputPath);
  if(!fs.existsSync(absInput)){ console.error('Input not found:', absInput); process.exit(1); }

  const { server, port } = await startServer({ root: process.cwd(), port: 0 });
  const baseUrl = `http://127.0.0.1:${port}`;
  const pageUrl = `${baseUrl}/September2025/TectangleHexagonal/dev/fingertip_sphere.html`;

  const browser = await puppeteer.launch({ headless: 'new', args:[ '--autoplay-policy=no-user-gesture-required' ] });
  try{
    const page = await browser.newPage();
    page.on('pageerror', e=> console.error('Page error:', e));
    page.on('console', msg=> console.log('[page]', msg.type(), msg.text()));
    await page.goto(pageUrl, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => window.__hexReady === true, { timeout: 60000 });

    const relFromRoot = path.relative(process.cwd(), absInput).split(path.sep).join('/');
    const inputUrl = `${baseUrl}/${encodeURI(relFromRoot)}`;

    await page.evaluate((u)=>{
      if(!window.__hex||!window.__hex.processVideoUrl) throw new Error('processVideoUrl not available');
      window.__procDone = false; window.__procResult = null;
      window.__hex.processVideoUrl(u).then(r=>{ window.__procResult = r; window.__procDone = true; }).catch(e=>{ window.__procResult = { error: String(e) }; window.__procDone = true; });
    }, inputUrl);
    await page.waitForFunction(() => window.__procDone === true, { timeout: 300000 });
    const result = await page.evaluate(() => window.__procResult || {});

  const t = result?.telemetry || {}; const frames = t.frames||0; const rng = t.range||0; const minR=t.minR, maxR=t.maxR; const tip=t.tipRangePx||0; const draws=t.draws||0; const err = result && result.error;
    if(err){ console.error('Processing error:', err); process.exitCode = 2; }
  // Pass if: video produced frames and draws, and either sphere scaled a bit OR sphere followed the tip a bit
  const pass = frames>10 && draws>5 && ((isFinite(rng) && rng > 2) || (isFinite(tip) && tip > 10));
  console.log(JSON.stringify({ pass, frames, draws, minR, maxR, range:rng, tipRangePx:tip }, null, 2));
    if(!pass) process.exitCode = 2;
  } finally {
    await browser.close(); await stopServer(server);
  }
}

main().catch(err=>{ console.error(err); process.exit(1); });
