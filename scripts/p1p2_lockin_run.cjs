// Run a specific two-hand MP4 and assert:
// 1) Right-hand pinch downs/ups = 1/1, then Left-hand = 1/1 (order by first downs)
// 2) Controller router assigns P1 to first pinch hand, P2 to second
// Uses startVideoUrl to engage controller router; falls back to processVideoUrl for per-hand counts when no events.

const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

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

function startServer({ root = process.cwd(), port = 0 } = {}){
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
            fs.createReadStream(safePath, { start, end }).pipe(res);
            return;
          }
        }
        res.setHeader('Content-Type', mime);
        res.setHeader('Content-Length', String(stats.size));
        fs.createReadStream(safePath).pipe(res);
      });
    } catch (e) { res.statusCode = 500; res.end('Server error'); }
  });
  return new Promise((resolve, reject) => {
    server.listen(port, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, port: addr.port });
    });
    server.on('error', reject);
  });
}

async function run() {
  const clipRel = process.argv[2] || 'September2025/TectangleHexagonal/videos/two_hands_stationary_right_then_left_index_pinch_hold_1s_v1.mp4';
  const clipAbs = path.resolve(clipRel);
  if (!fs.existsSync(clipAbs)) {
    console.error('Clip not found:', clipAbs);
    process.exit(1);
  }
  // Overall clip timeout (default 30s), enforced as a dynamic time budget
  const CLIP_TIMEOUT_MS = Number(process.env.CLIP_TIMEOUT_MS || 30000);
  const startedAt = Date.now();
  const deadline = startedAt + CLIP_TIMEOUT_MS;
  const timeLeft = () => Math.max(0, deadline - Date.now());

  let server, port, browser, page;
  try {
    const started = await startServer({ root: process.cwd(), port: 0 });
    server = started.server; port = started.port;
    const base = `http://127.0.0.1:${port}`;
    const pageUrl = `${base}/September2025/TectangleHexagonal/dev/controller_router_lab.html`;
    const clipUrl = `${base}/${clipRel.replace(/\\/g,'/')}`;

    const headful = !!(process.env.HEADFUL && /^(1|true)$/i.test(String(process.env.HEADFUL)));
  browser = await puppeteer.launch({ headless: headful ? false : 'new', args: ['--autoplay-policy=no-user-gesture-required'] });
    page = await browser.newPage();
    // Forward page console and errors to node for easier debugging
    page.on('console', (msg) => {
      try { console.log('[page]', msg.type(), msg.text()); } catch {}
    });
    page.on('pageerror', (err) => {
      try { console.error('[pageerror]', err && err.message ? err.message : String(err)); } catch {}
    });

    await page.evaluateOnNewDocument(() => {
      window.__events = [];
      window.addEventListener('hex-pinch', (e) => {
        const d = (e && e.detail) || {}; window.__events.push({ type: 'hex-pinch', ...d });
      });
      window.addEventListener('message', (ev) => {
        const d = ev && ev.data; if (d && d.type === 'pinch-key') { window.__events.push({ type: 'pinch-key', action: d.action, controllerId: d.controllerId, key: d.key }); }
      });
    });

    await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: Math.min(10000, timeLeft()) || 1 });
    // Network diagnostics
    page.on('response', (res) => {
      try { if (!res.ok()) console.warn('[page][response]', res.status(), res.url()); } catch {}
    });
    page.on('requestfailed', (req) => {
      try { console.error('[page][requestfailed]', req.failure() && req.failure().errorText, req.url()); } catch {}
    });
    // Preflight the clip URL quickly to surface 404 early
    try {
      await new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('preflight timeout')), Math.min(3000, timeLeft()));
        const req = http.get(clipUrl, { headers: { Range: 'bytes=0-0' } }, (res) => {
          clearTimeout(t);
          // 200 OK or 206 Partial Content acceptable
          if (res.statusCode === 200 || res.statusCode === 206) {
            res.resume(); resolve();
          } else {
            res.resume(); reject(new Error(`preflight status ${res.statusCode} for ${clipUrl}`));
          }
        });
        req.on('error', (e) => { clearTimeout(t); reject(e); });
      });
    } catch (e) {
      console.error('[preflight] video not reachable:', String(e && e.message ? e.message : e));
      process.exit(3);
    }

    // Start via startVideoUrl to ensure controller router & events are used
    await page.waitForFunction(() => typeof window.__hex !== 'undefined' && typeof window.__hex.startVideoUrl === 'function', { timeout: Math.min(10000, timeLeft()) || 1 });
    await page.evaluate(async (u) => {
      try {
        const r = window.__hex.startVideoUrl(u);
        if (r && typeof r.then === 'function') { await r; }
        // Wait for run-state to signal mpStarted
        const waitReady = async ()=>{
          const rs = window.__hexRunState; if (rs && rs.mpStarted) return true; await new Promise(r=> setTimeout(r, 50)); return waitReady();
        };
        await waitReady();
      } catch {}
    }, clipUrl);

    // Wait for downs up to remaining time (cap 25s)
    const downsWait = Math.min(25000, timeLeft());
    if (downsWait > 0) {
      try {
        await page.waitForFunction(() => (window.__events||[]).filter(e => e.type==='hex-pinch' && e.action==='down').length >= 2, { timeout: downsWait });
      } catch {}
    }

    const events = await page.evaluate(() => window.__events || []);
    const downs = events.filter(e => e.type==='hex-pinch' && e.action==='down');
    const ups = events.filter(e => e.type==='hex-pinch' && e.action==='up');

    // Fallback: derive per-hand from automation hook if pinch events not observed
    let perHand = null;
    if (downs.length < 2 && timeLeft() > 0) {
      try {
        // processVideoUrl returns telemetry with perHand counts — guard with remaining time
        const res = await Promise.race([
          page.evaluate((u) => window.__hex.processVideoUrl(u), clipUrl),
          new Promise((_, rej) => setTimeout(() => rej(new Error('processVideoUrl timeout')), timeLeft()))
        ]);
        perHand = res && res.telemetry && res.telemetry.perHand ? res.telemetry.perHand : null;
      } catch {}
    }

    // Decide pass/fail
    let rightOK = false, leftOK = false, controllerOK = false;

    // If we saw pinch events, infer hand order via key mapping
    if (downs.length >= 2) {
      // keys: Right->'Z', Left->'X'
      const keyDowns = events.filter(e => e.type==='pinch-key' && e.action==='down');
      const first = keyDowns[0]; const second = keyDowns[1];
      const upsByKey = key => events.filter(e => e.type==='pinch-key' && e.action==='up' && e.key===key).length;
      rightOK = keyDowns.filter(e => e.key==='Z').length >= 1 && upsByKey('Z') >= 1;
      leftOK = keyDowns.filter(e => e.key==='X').length >= 1 && upsByKey('X') >= 1;
      controllerOK = (first && first.controllerId === 'P1') && (second && second.controllerId === 'P2');
    } else if (perHand) {
      // No events observed; use per-hand counts only (mapping indeterminate)
      const rD = perHand.downs['Right']||0, rU = perHand.ups['Right']||0;
      const lD = perHand.downs['Left']||0, lU = perHand.ups['Left']||0;
      rightOK = (rD>=1 && rU>=1);
      leftOK = (lD>=1 && lU>=1);
      controllerOK = false; // cannot verify mapping without events
    }

    const pass = rightOK && leftOK && controllerOK;
    if (!pass) {
      const timedOut = timeLeft() <= 0;
      console.error('FAIL', { rightOK, leftOK, controllerOK, downs: downs.length, ups: ups.length, timedOut, clipTimeoutMs: CLIP_TIMEOUT_MS });
      process.exit(2);
    } else {
      console.log('PASS: Right 1/1 then Left 1/1 with P1→first, P2→second.');
    }
  } finally {
    try { if (browser) await browser.close(); } catch {}
    try { if (server) await new Promise((r) => server.close(() => r())); } catch {}
  }
}

run().catch(err => { console.error(err); process.exit(1); });
