// Usage: node tests/smoke/run_video_collect_golden.js <relative-path-to-mp4>
// Automates: spins a static server, opens Hex dev page, runs MP4 through MediaPipe->Pinch core, collects JSONL.
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
        // Basic Range support for media files
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
    console.error('Provide a path to an MP4 file or a folder of frames. Example: node tests/smoke/run_video_collect_golden.js "videos/right_hand_normal.mp4"');
    process.exit(1);
  }
  const absInput = path.resolve(inputPath);
  if(!fs.existsSync(absInput)){
    console.error('Input not found:', absInput);
    process.exit(1);
  }
  // WEBWAY:ww-2025-013 Rich Telemetry enablement via env RICH=1 (expires 2025-10-08)
  const richRequested = !!(process.env.RICH && /^(1|true)$/i.test(String(process.env.RICH)));
  // Spin local server unless DEMO_URL provided
  let server, baseUrl;
  if(process.env.DEMO_URL){ baseUrl = process.env.DEMO_URL.replace(/\/index\.html$/,''); }
  else { const started = await startServer({ root: process.cwd(), port: 0 }); server = started.server; baseUrl = `http://127.0.0.1:${started.port}`; }

  const url = (process.env.DEMO_URL && process.env.DEMO_URL.endsWith('.html'))
    ? process.env.DEMO_URL
    : `${baseUrl}/${(process.env.DEMO_PAGE || 'September2025/TectangleHexagonal/dev/index.html').replace(/^\/+/, '')}`;

  const guessChromeWin = 'C\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe';
  const execPath = process.env.CHROME || process.env.PUPPETEER_EXECUTABLE_PATH || (process.platform==='win32' ? guessChromeWin : undefined);
  const headful = !!(process.env.HEADFUL && /^(1|true)$/i.test(String(process.env.HEADFUL)));
  const launchOpts = { headless: headful? false : 'new', args:[ '--autoplay-policy=no-user-gesture-required' ] };
  if (headful) launchOpts.defaultViewport = null;
  if (execPath && fs.existsSync(execPath)) launchOpts.executablePath = execPath;
  const browser = await puppeteer.launch(launchOpts);
  const page = await browser.newPage();
  page.on('console', msg=> console.log('[page]', msg.type(), msg.text()));
  page.on('pageerror', e=> console.error('[page] error', e?.message||String(e)));
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Wait until app signals readiness
  // Robust readiness: poll for automation surface (__hex.processVideoUrl)
  {
    const start = Date.now();
    let ok = false;
    while(Date.now() - start < 120000){
      try{
        ok = await page.evaluate(() => typeof window.__hex === 'object' && !!window.__hex && (typeof window.__hex.processVideoUrl === 'function' || typeof window.__hex.startVideoUrl === 'function'));
        if(ok) break;
      }catch{}
      await new Promise(r=> setTimeout(r, 250));
    }
    if(!ok) throw new Error('Automation surface not ready: window.__hex.processVideoUrl missing');
  }

  // Set in-page processing timeout (ms) for this run to avoid long hangs
  const procTimeoutMs = process.env.PROC_TIMEOUT_MS ? Math.max(5000, +process.env.PROC_TIMEOUT_MS) : 45000;
  await page.evaluate((ms)=>{ window.__hexProcessTimeoutMs = ms; }, procTimeoutMs);
  // Policy: treat first Pinched gated frame as a down if requested
  const firstPinchIsDown = !!(process.env.FIRST_PINCH_IS_DOWN && /^(1|true)$/i.test(String(process.env.FIRST_PINCH_IS_DOWN)));
  await page.evaluate((flag)=>{ window.__firstPinchIsDown = !!flag; }, firstPinchIsDown);

  // Set thresholds and smoothing if provided via env, otherwise keep defaults
  await page.evaluate(({enter, exit, cone, palmGate, speculative, minCutoff, beta, dCutoff, confirmUpMs, palmStableMs, holdDeadzoneEnabled, holdDeadzone})=>{
    const setNum=(id,v)=>{ const el=document.getElementById(id); if(el!=null && typeof v==='number'){ el.value=String(v); el.dispatchEvent(new Event('input',{bubbles:true})); } };
    const setChk=(id,v)=>{ const el=document.getElementById(id); if(el && typeof v==='boolean'){ el.checked = v; el.dispatchEvent(new Event('change',{bubbles:true})); } };
    if(typeof enter==='number') setNum('enter', enter);
    if(typeof exit==='number') setNum('exit', exit);
    if(typeof cone==='number') setNum('cone', cone);
    if(typeof palmGate==='boolean') setChk('palmGate', palmGate);
    if(typeof speculative==='boolean') setChk('speculative', speculative);
    // OneEuro smoothing knobs
    if(typeof minCutoff==='number') setNum('minCutoff', minCutoff);
    if(typeof beta==='number') setNum('beta', beta);
    if(typeof dCutoff==='number') setNum('dCutoff', dCutoff);
    // Velocity-assisted up and gating stability (optional controls)
    if(typeof confirmUpMs==='number') setNum('confirmUpMs', confirmUpMs);
    if(typeof palmStableMs==='number') setNum('palmStableMs', palmStableMs);
    // Hold deadzone (optional)
    if(typeof holdDeadzone==='number') setNum('holdDeadzone', holdDeadzone);
    if(typeof holdDeadzoneEnabled==='boolean') setChk('holdDeadzoneEnabled', holdDeadzoneEnabled);
    // Ensure cores pick up latest values
    if(window.__hex && typeof window.__hex.applyConfigToCores==='function'){
      window.__hex.applyConfigToCores();
    }
  }, {
    enter: process.env.ENTER ? +process.env.ENTER : undefined,
    exit: process.env.EXIT ? +process.env.EXIT : undefined,
    cone: process.env.CONE ? +process.env.CONE : undefined,
    palmGate: process.env.PALMGATE ? (String(process.env.PALMGATE)==='1' || /true/i.test(String(process.env.PALMGATE))) : undefined,
    speculative: process.env.SPECULATIVE ? (String(process.env.SPECULATIVE)==='1' || /true/i.test(String(process.env.SPECULATIVE))) : undefined,
    minCutoff: process.env.MINCUTOFF ? +process.env.MINCUTOFF : undefined,
    beta: process.env.BETA ? +process.env.BETA : undefined,
    dCutoff: process.env.DCUTOFF ? +process.env.DCUTOFF : undefined,
    confirmUpMs: process.env.CONFIRM_UP_MS ? +process.env.CONFIRM_UP_MS : undefined,
    palmStableMs: process.env.PALM_STABLE_MS ? +process.env.PALM_STABLE_MS : undefined,
    holdDeadzone: process.env.HOLD_DEADZONE ? +process.env.HOLD_DEADZONE : undefined,
    holdDeadzoneEnabled: process.env.HOLD_DEADZONE_ENABLED ? (String(process.env.HOLD_DEADZONE_ENABLED)==='1' || /true/i.test(String(process.env.HOLD_DEADZONE_ENABLED))) : undefined
  });

  // Build a URL to the MP4 under the static server root
  const relFromRoot = path.relative(process.cwd(), absInput).split(path.sep).join('/');
  const pageOrigin = (()=>{ try{ const u = new URL(url); return `${u.protocol}//${u.host}`; } catch { return baseUrl; } })();
  const inputUrl = `${pageOrigin}/${encodeURI(relFromRoot)}`;

  // If the target is a dev HTML page, navigate with ?noauto=1&src=<mp4> so the page loads the clip itself
  if (/\.html$/i.test(url)){
    const u = new URL(url);
    u.searchParams.set('noauto', '1');
    if(!u.searchParams.has('src') && !u.searchParams.has('mp4')){
      u.searchParams.set('src', inputUrl);
    }
    await page.goto(u.toString(), { waitUntil: 'networkidle2' });
  }

  // Kick off processing inside the page without holding the protocol call open
  let result;
  // Decide path: file vs directory
  const isDir = fs.existsSync(absInput) && fs.statSync(absInput).isDirectory();
  if(!isDir){
    await page.evaluate((u, rich)=>{
      window.__procDone = false; window.__procResult = null;
      if(rich){ window.FEATURE_RICH_TELEM_V1 = true; }
      if(!window.__hex || !window.__hex.processVideoUrl){ throw new Error('Hex automation hook not available'); }
      window.__hex.processVideoUrl(u).then(r=>{ window.__procResult = r; window.__procDone = true; }).catch(e=>{ window.__procResult = { error: String(e) }; window.__procDone = true; });
    }, inputUrl, richRequested);
  } else {
    // Build sorted list of image URLs
    const files = fs.readdirSync(absInput).filter(f=>/\.(png|jpg|jpeg)$/i.test(f)).sort();
    const urls = files.map(f=> `${inputUrl}/${encodeURIComponent(f)}`);
    await page.evaluate((list, rich)=>{
      window.__procDone = false; window.__procResult = null;
      if(rich){ window.FEATURE_RICH_TELEM_V1 = true; }
      if(!window.__hex || !window.__hex.processFrameUrls){ throw new Error('Hex processFrameUrls hook not available'); }
      window.__hex.processFrameUrls(list).then(r=>{ window.__procResult = r; window.__procDone = true; }).catch(e=>{ window.__procResult = { error: String(e) }; window.__procDone = true; });
    }, urls, richRequested);
  }

  // Wait up to 5 minutes for completion (long videos)
  await page.waitForFunction(() => window.__procDone === true, { timeout: 300000 });
  result = await page.evaluate(() => window.__procResult || {});
  if(result.error){ throw new Error('Processing failed: ' + result.error); }
  const golden = result.golden || [];
  const landmarks = result.landmarks || [];
  const telem = result.telemetry || null;
  // Full in-page telemetry (if exposed)
  let fullTelemetry = null;
  try { fullTelemetry = await page.evaluate(() => (typeof window.__getTelemetry === 'function') ? window.__getTelemetry() : null); } catch {}
  // Optional analysis lines (frames + events + TOI + possibly per-hand)
  let analysis = [];
  try {
    analysis = await page.evaluate(() => (typeof window.__getAnalysis === 'function') ? (window.__getAnalysis() || []) : []);
  } catch {}
  // Debug: print quick summary and first few golden lines
  const head = golden.slice(0, Math.min(5, golden.length));
  console.log('Summary:', { goldenCount: golden.length, landmarksCount: landmarks.length, telemetry: telem });
  if (head.length) { console.log('Golden head:', head); }

  const outDir = path.resolve('September2025/TectangleHexagonal/out');
  fs.mkdirSync(outDir, { recursive: true });
  const labelEnv = process.env.LABEL && String(process.env.LABEL).trim();
  // Always use the input filename (without extension) as the base, unless explicitly overridden via LABEL.
  const baseName = labelEnv || path.basename(absInput).replace(/\.[^.]+$/, '');
  const outGolden = path.join(outDir, baseName + '.jsonl');
  const outLand = path.join(outDir, baseName + '.landmarks.jsonl');
  const outAnalysis = path.join(outDir, baseName + '.analysis.jsonl');
  const outTelemetry = path.join(outDir, baseName + '.telemetry.json');
  const outDiag = path.join(outDir, baseName + '.ihcdiag.json');
  fs.writeFileSync(outGolden, golden.join('\n')+'\n');
  fs.writeFileSync(outLand, landmarks.join('\n')+'\n');
  if (analysis && analysis.length) { fs.writeFileSync(outAnalysis, analysis.join('\n')+'\n'); console.log('Saved analysis:', outAnalysis, `(lines=${analysis.length})`); }
  if (fullTelemetry) { fs.writeFileSync(outTelemetry, JSON.stringify(fullTelemetry, null, 2)); console.log('Saved telemetry:', outTelemetry); }
  if(richRequested && result.rich && result.rich.frames){
    const outRich = path.join(outDir, baseName + '.rich.jsonl');
    fs.writeFileSync(outRich, result.rich.frames.map(f=> JSON.stringify(f)).join('\n')+'\n');
    const outRichSummary = path.join(outDir, baseName + '.rich.summary.json');
    fs.writeFileSync(outRichSummary, JSON.stringify(result.rich.summary, null, 2));
    console.log('Saved rich telemetry:', outRich, `frames=${result.rich.frames.length}`);
    console.log('Rich summary:', result.rich.summary);
  } else if(richRequested) {
    console.warn('Rich requested but no rich frames returned');
  }
  // Console diagnostics (if v2 console present)
  try {
    const diag = await page.evaluate(()=> window.__ihcDiag || null);
    if(diag){ fs.writeFileSync(outDiag, JSON.stringify(diag, null, 2)); console.log('Saved overlay diagnostics:', outDiag, diag); }
  } catch(err){ console.warn('Diag capture failed', err?.message||err); }
  console.log('Saved golden:', outGolden);
  console.log('Saved landmarks:', outLand);
  console.log('Telemetry:', telem);
  // Persist quick counts for CI and smoke checks
  try {
    const countsOut = path.join(outDir, baseName + '.counts.json');
    const counts = { downs: telem?.downs ?? null, ups: telem?.ups ?? null, gdowns: telem?.gdowns ?? null, gups: telem?.gups ?? null };
    fs.writeFileSync(countsOut, JSON.stringify(counts, null, 2));
    console.log('Saved counts:', countsOut, counts);
  } catch {}

  await browser.close();
  await stopServer(server);
}

main().catch(err=>{ console.error(err); process.exit(1); });
