// WEBWAY:ww-2025-026: SDK Facade idle (no-lock) smoke using deterministic JSONL injection
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.env.SITE_BASE || 'http://127.0.0.1:8080';
const clip = process.env.CLIP || 'September2025/TectangleHexagonal/out/two_hands_baseline_idle_v1.landmarks.jsonl';
const outDir = 'September2025/TectangleHexagonal/out';
const outFile = process.env.OUT || path.join(outDir, 'idle.sdk.smoke.summary.json');

const pageUrl = `${base}/September2025/TectangleHexagonal/dev/sdk_facade_smoke.html?autostart=1&nocam=1&useJsonl=1&clip=${encodeURIComponent(clip)}`;

(async () => {
  const headless = (process.env.HEADLESS === '0' || process.env.HEADFUL === '1') ? false : 'new';
  const browser = await puppeteer.launch({ headless });
  const page = await browser.newPage();
  page.setDefaultTimeout(45000);
  await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });

  // Wait for __sdk to be ready
  await page.waitForFunction(() => !!(globalThis.__sdk && __sdk.sample && __sdk.state), { timeout: 20000 });

  // Attach event capture for pinch down/up
  await page.evaluate(() => {
    if(!window.__sdk || !__sdk.api || !__sdk.api.on) throw new Error('sdk not ready');
    window.__sdk._cap = { downs:0, ups:0, events:[] };
    __sdk.api.on(evt => {
      if(!evt || !evt.type) return;
      if(evt.type === 'pinch:down') { __sdk._cap.downs++; __sdk._cap.events.push({t:evt.t,type:evt.type,seat:evt.seat||null}); }
      if(evt.type === 'pinch:up')   { __sdk._cap.ups++;   __sdk._cap.events.push({t:evt.t,type:evt.type,seat:evt.seat||null}); }
    });
  });

  // Read JSONL frames on Node side and feed them inside the page for determinism
  const abs = path.resolve(clip);
  const text = fs.readFileSync(abs, 'utf8');
  const lines = text.split(/\r?\n/).filter(Boolean);
  const frames = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  await page.evaluate((frames) => {
    const api = __sdk.api;
    const shell = api && api._unsafe && api._unsafe.shell;
    if(!shell) throw new Error('shell unavailable');
    let i=0;
    function tick(){
      if(i>=frames.length) return;
      const f = frames[i++];
      const frame = {
        t: f.t || performance.now(),
        hand: f.hand || 'Right',
        handId: f.handId || null,
        indexTip: f.indexTip, thumbTip: f.thumbTip, wrist: f.wrist,
        indexMCP: f.indexMCP, pinkyMCP: f.pinkyMCP,
        indexPIP: f.indexPIP || null,
        indexDIP: f.indexDIP || null,
        landmarks: f.landmarks || null,
      };
      try { shell.router.onFrame(frame); shell.hsm.onFrame(frame); } catch(e){ (window.__sdkErrors||[]).push({ kind:'emit-failed', err:String(e) }); }
      setTimeout(tick, 33);
    }
    tick();
  }, frames);

  // Sample for ~1.2s to ensure enough idle frames observed
  const summary = await page.evaluate(() => __sdk.sample(1200));
  const counts = await page.evaluate(() => __sdk._cap);

  const PASS = (counts.downs === 0 && counts.ups === 0);
  const finalSummary = { page: pageUrl, clip, PASS, counts, summary };
  try { fs.mkdirSync(outDir, { recursive: true }); fs.writeFileSync(outFile, JSON.stringify(finalSummary, null, 2)); } catch {}
  if(!PASS){ console.error('verify_sdk_facade_idle_no_lock: FAIL', finalSummary); await browser.close(); process.exit(1); }
  console.log('verify_sdk_facade_idle_no_lock: PASS', finalSummary);
  await browser.close();
})();
