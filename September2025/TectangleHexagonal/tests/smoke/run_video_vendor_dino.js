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

// Usage: node September2025/TectangleHexagonal/tests/smoke/run_video_vendor_dino.js <relative-path-to-mp4>
// Purpose: Drive MP4 -> Pinch core (left iframe) on dev/pinch_dino.html, count Space keydown/up inside Dino iframe.
// Outcome: Prints counts and saves out/<basename>.dino_counts.json
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
  if(!inputPath){
    console.error('Provide a path to an MP4 file. Example: node September2025/TectangleHexagonal/tests/smoke/run_video_vendor_dino.js "videos/right_hand_normal.mp4"');
    process.exit(1);
  }
  const absInput = path.resolve(inputPath);
  if(!fs.existsSync(absInput)){
    console.error('Input not found:', absInput);
    process.exit(1);
  }

  let server, baseUrl;
  if(process.env.DEMO_URL){ baseUrl = process.env.DEMO_URL.replace(/\/index\.html$/,''); }
  else { const started = await startServer({ root: process.cwd(), port: 0 }); server = started.server; baseUrl = `http://127.0.0.1:${started.port}`; }

  const hostUrl = (process.env.DEMO_URL && process.env.DEMO_URL.endsWith('.html'))
    ? process.env.DEMO_URL
    : `${baseUrl}/September2025/TectangleHexagonal/dev/pinch_dino.html`;

  const guessChromeWin = 'C\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe';
  const execPath = process.env.CHROME || process.env.PUPPETEER_EXECUTABLE_PATH || (process.platform==='win32' ? guessChromeWin : undefined);
  // Run headed to avoid codec/COOP quirks; use system Chrome when available.
  const launchOpts = { headless: false, defaultViewport: null, args:[ '--autoplay-policy=no-user-gesture-required' ] };
  if (execPath && fs.existsSync(execPath)) launchOpts.executablePath = execPath;
  const browser = await puppeteer.launch(launchOpts);
  const page = await browser.newPage();
  page.on('console', msg=> console.log('[page]', msg.type(), msg.text()));
  page.on('pageerror', e=> console.error('[page] error', e?.message||String(e)));
  await page.goto(hostUrl, { waitUntil: 'networkidle2' });

  // Allow a little extra time for Dino assets to finish (fonts/audio)
  await new Promise(r=> setTimeout(r, 2500));

  const getFrames = () => {
    const frames = page.frames();
    const pinch = frames.find(f => /\/TectangleHexagonal\/dev\/index\.html$/.test(f.url()) || /\/dev\/index\.html$/.test(f.url()));
    const vendor = frames.find(f => /\/vendor\/dino\/index\.html$/.test(f.url()));
    return { pinch, vendor };
  };

  // Wait for both frames
  {
    const start = Date.now();
    while(Date.now() - start < 45000){
      const { pinch, vendor } = getFrames();
      if(pinch && vendor) break;
      await new Promise(r=> setTimeout(r, 200));
    }
    const { pinch, vendor } = getFrames();
    if(!pinch || !vendor) throw new Error('Expected both pinch and dino vendor frames to load');
  }
  const { pinch, vendor } = getFrames();

  // Prepare key counters inside the dino iframe (Space only)
  await vendor.evaluate(() => {
    window.__probe = window.__probe || { downs:0, ups:0, seq:[] };
    const norm = (e)=> (e.key===' '||e.code==='Space'||e.keyCode===32)?'Space':e.key;
    if(!window.__probe._wired){
      window.addEventListener('keydown', e=>{ if(norm(e)==='Space'){ window.__probe.downs++; window.__probe.seq.push({t:Date.now(),type:'down'}); } });
      window.addEventListener('keyup', e=>{ if(norm(e)==='Space'){ window.__probe.ups++; window.__probe.seq.push({t:Date.now(),type:'up'}); } });
      window.__probe._wired = true;
    }
  });

  // Bring window to front and focus/click the vendor iframe so it can receive Space events
  try {
    await page.bringToFront();
    const gameEl = await vendor.frameElement();
    if (gameEl) {
      await gameEl.click();
    }
    await vendor.evaluate(() => { try { window.focus(); } catch {} });
  } catch {}

  // Wait for pinch automation
  {
    const start = Date.now();
    let ok = false;
    while(Date.now() - start < 120000){
      try{
        ok = await pinch.evaluate(() => typeof window.__hex === 'object' && !!window.__hex && typeof window.__hex.processVideoUrl === 'function');
        if(ok) break;
      }catch{}
      await new Promise(r=> setTimeout(r, 250));
    }
    if(!ok) throw new Error('Pinch automation not ready in left iframe');
  }

  // Set options in pinch frame
  const procTimeoutMs = process.env.PROC_TIMEOUT_MS ? Math.max(5000, +process.env.PROC_TIMEOUT_MS) : 45000;
  await pinch.evaluate((ms)=>{ window.__hexProcessTimeoutMs = ms; }, procTimeoutMs);
  const firstPinchIsDown = !!(process.env.FIRST_PINCH_IS_DOWN && /^(1|true)$/i.test(String(process.env.FIRST_PINCH_IS_DOWN)));
  await pinch.evaluate((flag)=>{ window.__firstPinchIsDown = !!flag; }, firstPinchIsDown);
  await pinch.evaluate(({enter, exit, cone, palmGate, speculative})=>{
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

  // Build a URL to the MP4
  const relFromRoot = path.relative(process.cwd(), absInput).split(path.sep).join('/');
  const inputUrl = `${baseUrl}/${encodeURI(relFromRoot)}`;

  // Kick off processing in pinch frame
  // Small warmup to mirror manual usage where the page stabilizes before feeding the video
  await new Promise(r=> setTimeout(r, 1000));
  await pinch.evaluate((u)=>{
    window.__procDone = false; window.__procResult = null;
    window.__hex.processVideoUrl(u).then(r=>{ window.__procResult = r; window.__procDone = true; }).catch(e=>{ window.__procResult = { error: String(e) }; window.__procDone = true; });
  }, inputUrl);

  // Wait for completion
  await pinch.waitForFunction(() => window.__procDone === true, { timeout: 300000 });
  const result = await pinch.evaluate(() => window.__procResult || {});
  if(result.error){ throw new Error('Processing failed: ' + result.error); }

  // Read counts from dino frame
  const counts = await vendor.evaluate(() => ({
    downs: window.__probe?.downs ?? 0,
    ups: window.__probe?.ups ?? 0,
    seqTail: (window.__probe?.seq || []).slice(-10)
  }));

  const outDir = path.resolve('September2025/TectangleHexagonal/out');
  fs.mkdirSync(outDir, { recursive: true });
  const baseName = (process.env.LABEL && String(process.env.LABEL).trim()) || path.basename(absInput).replace(/\.[^.]+$/, '');
  const outCounts = path.join(outDir, baseName + '.dino_counts.json');
  fs.writeFileSync(outCounts, JSON.stringify(counts, null, 2));

  console.log('Dino counts:', counts, '\nSaved:', outCounts);
  console.log('Pinch telemetry:', result?.telemetry || null);

  await browser.close();
  await stopServer(server);
}

main().catch(err=>{ console.error(err); process.exit(1); });
