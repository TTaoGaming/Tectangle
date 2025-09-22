/*
Run: node September2025/TectangleFSMRunner/tests/smoke/run_opo_runner_demo.mjs <relative-path-to-mp4>
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
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

async function startServer({ root = process.cwd(), port = 0 } = {}) {
  const server = http.createServer((req, res) => {
    try {
      const raw = decodeURIComponent((req.url || '/').split('?')[0]);
      let pathname = raw || '/';
      if (pathname.endsWith('/')) pathname += 'index.html';
      const safe = path.normalize(path.join(root, pathname));
      if (!safe.startsWith(path.normalize(root))) {
        res.statusCode = 403;
        res.end('Forbidden');
        return;
      }
      fs.stat(safe, (err, stats) => {
        if (err || !stats.isFile()) {
          res.statusCode = 404;
          res.end('Not found');
          return;
        }
        const ext = path.extname(safe).toLowerCase();
        const mime = MIME[ext] || 'application/octet-stream';
        const range = req.headers['range'];
        res.setHeader('Accept-Ranges', 'bytes');
        if (range) {
          const match = /^bytes=(\d*)-(\d*)$/.exec(String(range));
          if (match) {
            let start = match[1] ? parseInt(match[1], 10) : 0;
            let end = match[2] ? parseInt(match[2], 10) : stats.size - 1;
            if (Number.isNaN(start) || start < 0) start = 0;
            if (Number.isNaN(end) || end >= stats.size) end = stats.size - 1;
            if (start > end) {
              res.statusCode = 416;
              res.setHeader('Content-Range', `bytes */${stats.size}`);
              res.end();
              return;
            }
            res.statusCode = 206;
            res.setHeader('Content-Range', `bytes ${start}-${end}/${stats.size}`);
            res.setHeader('Content-Length', String(end - start + 1));
            res.setHeader('Content-Type', mime);
            const stream = fs.createReadStream(safe, { start, end });
            stream.on('error', () => { res.statusCode = 500; res.end('Server error'); });
            stream.pipe(res);
            return;
          }
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', mime);
        res.setHeader('Content-Length', String(stats.size));
        const stream = fs.createReadStream(safe);
        stream.on('error', () => { res.statusCode = 500; res.end('Server error'); });
        stream.pipe(res);
      });
    } catch (error) {
      res.statusCode = 500;
      res.end('Server error');
    }
  });

  return new Promise((resolve, reject) => {
    server.listen(port, '127.0.0.1', () => {
      const addr = server.address();
      const actual = typeof addr === 'object' && addr ? addr.port : port;
      resolve({ server, port: actual });
    });
    server.on('error', reject);
  });
}

async function stopServer(server) {
  if (!server) return;
  await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
}

async function main(){
  const relClip = process.argv[2];
  if(!relClip){
    console.error('Usage: node September2025/TectangleFSMRunner/tests/smoke/run_opo_runner_demo.mjs <relative-path-to-mp4>');
    process.exit(1);
  }
  const clipPath = path.resolve(relClip);
  if(!fs.existsSync(clipPath)){
    console.error('Clip not found:', clipPath);
    process.exit(1);
  }

  let serverInstance;
  const started = await startServer({ root: process.cwd(), port: 0 });
  serverInstance = started.server;
  const baseUrl = `http://127.0.0.1:${started.port}`;

  const pageUrl = `${baseUrl}/September2025/TectangleFSMRunner/dev/opo_runner.html`;
  const clipUrl = '/' + relClip.replace(/\\/g, '/').replace(/^\/+/, '');

  const browser = await puppeteer.launch({ headless: 'new', args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);
  await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });

  await page.waitForFunction(() => !!window.__opo, { timeout: 20000 });
  await page.evaluate(() => window.__opo.reset());

  const summary = await page.evaluate(async clip => {
    return await window.__opo.processClip(clip, { reset: true });
  }, clipUrl);

  const telemetry = await page.evaluate(() => window.__opo.telemetry());

  await browser.close();
  await stopServer(serverInstance);

  const outDir = path.resolve('September2025/TectangleFSMRunner/out');
  fs.mkdirSync(outDir, { recursive: true });
  const baseName = path.basename(relClip).replace(/\.[^.]+$/, '');
  const outJsonl = path.join(outDir, `${baseName}.opo.telemetry.jsonl`);
  fs.writeFileSync(outJsonl, telemetry.frames.map(f => JSON.stringify(f)).join('\n') + '\n');
  const outSummary = path.join(outDir, `${baseName}.opo.summary.json`);
  fs.writeFileSync(outSummary, JSON.stringify(summary, null, 2));

  const p1 = summary.seats?.P1 || {};
  const p2 = summary.seats?.P2 || {};

  if((p1.readyFrames || 0) < 3){
    console.error('Expected P1 ready frames >= 3, got', p1.readyFrames);
    process.exit(2);
  }
  if((p2.readyFrames || 0) < 3){
    console.error('Expected P2 ready frames >= 3, got', p2.readyFrames);
    process.exit(3);
  }
  const fireEvents = (summary.events || []).filter(evt => evt.type === 'fire').length;
  if(fireEvents !== 0){
    console.error('Expected no fire events for idle clip, got', fireEvents);
    process.exit(4);
  }

  console.log('OPO runner demo summary:', summary);
  console.log('Telemetry saved to', outJsonl);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
