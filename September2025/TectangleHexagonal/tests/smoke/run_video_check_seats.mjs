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
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.mp4': 'video/mp4'
};

async function startServer({ root = process.cwd(), port = 0 } = {}){
  const server = http.createServer((req, res) => {
    try {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      let pathname = urlPath || '/';
      if (pathname === '/') pathname = '/index.html';
      if (pathname.endsWith('/')) pathname += 'index.html';
      const safePath = path.normalize(path.join(root, pathname));
      if (!safePath.startsWith(path.normalize(root))) {
        res.statusCode = 403; res.end('Forbidden'); return;
      }
      fs.stat(safePath, (err, stats) => {
        if (err || !stats.isFile()) { res.statusCode = 404; res.end('Not found'); return; }
        const ext = path.extname(safePath).toLowerCase();
        const mime = MIME[ext] || 'application/octet-stream';
        const range = req.headers['range'];
        res.setHeader('Accept-Ranges', 'bytes');
        if (range) {
          const m = /^bytes=(\d*)-(\d*)$/.exec(String(range));
          if (m) {
            let start = m[1] ? parseInt(m[1], 10) : 0;
            let end = m[2] ? parseInt(m[2], 10) : (stats.size - 1);
            if (isNaN(start) || start < 0) start = 0;
            if (isNaN(end) || end >= stats.size) end = stats.size - 1;
            if (start > end) { res.statusCode = 416; res.setHeader('Content-Range', `bytes */${stats.size}`); res.end(); return; }
            res.statusCode = 206;
            res.setHeader('Content-Range', `bytes ${start}-${end}/${stats.size}`);
            res.setHeader('Content-Length', String(end - start + 1));
            res.setHeader('Content-Type', mime);
            const stream = fs.createReadStream(safePath, { start, end });
            stream.on('error', () => { res.statusCode = 500; res.end('Server error'); });
            stream.pipe(res);
            return;
          }
        }
        res.setHeader('Content-Type', mime);
        res.setHeader('Content-Length', String(stats.size));
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
  if(!inputPath){ console.error('Usage: node .../run_video_check_seats.mjs <relative-path-to-mp4>'); process.exit(1); }
  const absInput = path.resolve(inputPath);
  if(!fs.existsSync(absInput)){ console.error('Input not found:', absInput); process.exit(1); }

  let server, baseUrl;
  const started = await startServer({ root: process.cwd(), port: 0 }); server = started.server; baseUrl = `http://127.0.0.1:${started.port}`;

  const hostUrl = `${baseUrl}/September2025/TectangleHexagonal/dev/index.html`;
  const guessChromeWin = 'C\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe';
  const execPath = process.env.CHROME || process.env.PUPPETEER_EXECUTABLE_PATH || (process.platform==='win32' ? guessChromeWin : undefined);
  const launchOpts = { headless: 'new', args:[ '--autoplay-policy=no-user-gesture-required' ] };
  if (execPath && fs.existsSync(execPath)) launchOpts.executablePath = execPath;
  const browser = await puppeteer.launch(launchOpts);
  const page = await browser.newPage();
  page.on('console', msg=> console.log('[page]', msg.type(), msg.text()));
  page.on('pageerror', e=> console.error('[page] error', e?.message||String(e)));
  await page.goto(hostUrl, { waitUntil: 'networkidle2' });

  // wait for automation to be ready
  await page.waitForFunction(() => typeof window.__hex === 'object' && !!window.__hex && typeof window.__hex.processVideoUrl === 'function', { timeout: 60000 });

  // optional tuning from env
  await page.evaluate(({enter, exit, cone, palmGate, speculative})=>{
    const setNum=(id,v)=>{ const el=document.getElementById(id); if(el!=null && typeof v==='number'){ el.value=String(v); el.dispatchEvent(new Event('input',{bubbles:true})); } };
    const setChk=(id,v)=>{ const el=document.getElementById(id); if(el && typeof v==='boolean'){ el.checked = v; el.dispatchEvent(new Event('change',{bubbles:true})); } };
    if(typeof enter==='number') setNum('enter', enter);
    if(typeof exit==='number') setNum('exit', exit);
    if(typeof cone==='number') setNum('cone', cone);
    if(typeof palmGate==='boolean') setChk('palmGate', palmGate);
    if(typeof speculative==='boolean') setChk('speculative', speculative);
  }, {
    enter: process.env.ENTER ? +process.env.ENTER : undefined,
    exit: process.env.EXIT ? +process.env.EXIT : undefined,
    cone: process.env.CONE ? +process.env.CONE : undefined,
    palmGate: process.env.PALMGATE ? (String(process.env.PALMGATE)==='1' || /true/i.test(String(process.env.PALMGATE))) : undefined,
    speculative: process.env.SPECULATIVE ? (String(process.env.SPECULATIVE)==='1' || /true/i.test(String(process.env.SPECULATIVE))) : undefined
  });

  const relFromRoot = path.relative(process.cwd(), absInput).split(path.sep).join('/');
  const inputUrl = `${baseUrl}/${encodeURI(relFromRoot)}`;

  // Prefer the live pipeline (MediaPipe + ControllerRouter): startVideoUrl and wait for the video to end.
  // Start playback in page context
  await page.evaluate(async (u)=>{
    const api = window.__hex;
    if(!api || typeof api.startVideoUrl !== 'function') throw new Error('startVideoUrl not available');
    window.__hexProcessTimeoutMs = 60000;
    await api.startVideoUrl(u);
  }, inputUrl);
  // Wait until we have at least a pinch or some frames
  await page.waitForFunction(() => {
    try{
      const t = (typeof window.__getTelemetry==='function') ? window.__getTelemetry() : null;
      if(!t) return false;
      return ((t.downs||0) + (t.ups||0) >= 1) || (t.frames||0) >= 15;
    }catch{ return false; }
  }, { timeout: 60000 });
  // Stop and collect results
  const result = await page.evaluate(() => {
    try{ window.__hex.stop(); }catch{}
    const telemetry = (typeof window.__getTelemetry==='function') ? window.__getTelemetry() : null;
    return { telemetry };
  });

  // collect controller router state (wait briefly for availability)
  try {
    await page.waitForFunction(() => {
      try {
        return typeof window.__controller === 'object' &&
          window.__controller &&
          typeof window.__controller.getState === 'function' &&
          !!window.__controller.getState();
      } catch { return false; }
    }, { timeout: 5000 });
  } catch {}
  const state = await page.evaluate(() => {
    try{
      const s = (typeof window.__controller === 'object' && window.__controller && typeof window.__controller.getState === 'function') ? window.__controller.getState() : null;
      return s || null;
    }catch{ return null; }
  });

  // Print concise summary
  console.log('Telemetry:', result?.telemetry || null);
  if(state){
    const seats = (state.map||[]).map(([key, seat])=>({ key, seat }));
    const usesHandIds = seats.some(({key})=> /^id:/.test(String(key)) );
    console.log('Seats:', seats);
    console.log('HandId present:', usesHandIds, 'Reserved:', state.reserved || []);
    // Machine-readable for CI pipeline
    try { console.log('JSON_STATE:' + JSON.stringify(state)); } catch {}
  } else {
    console.log('Seats: <unavailable>');
    // Fallback machine-readable output so downstream scripts still parse
    try { console.log('JSON_STATE:' + JSON.stringify({ map: [], reserved: [], note: 'no-state' })); } catch {}
  }

  await browser.close();
  await stopServer(server);
}

main().catch(err=>{ console.error(err); process.exit(1); });
