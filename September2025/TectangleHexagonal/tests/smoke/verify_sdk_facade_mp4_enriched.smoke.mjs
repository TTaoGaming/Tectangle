// SDK Facade MP4 smoke: play a clip via sdk_facade_smoke.html and assert P1/P2 metrics presence
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.env.SITE_BASE || 'http://127.0.0.1:8080';
const clip = process.env.CLIP || 'September2025/TectangleHexagonal/out/two_hands_stationary_right_then_left_index_pinch_hold_1s_v1.landmarks.jsonl';
const outDir = 'September2025/TectangleHexagonal/out';
const outFile = process.env.OUT || path.join(outDir, 'enriched.sdk.smoke.summary.json');

const pageUrl = `${base}/September2025/TectangleHexagonal/dev/sdk_facade_smoke.html?autostart=1&nocam=1&useJsonl=1&clip=${encodeURIComponent(clip)}`;

(async () => {
  const headless = (process.env.HEADLESS === '0' || process.env.HEADFUL === '1') ? false : 'new';
  const browser = await puppeteer.launch({ headless });
  const page = await browser.newPage();
  page.setDefaultTimeout(45000);
  await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });

  // Wait for __sdk to be ready
  await page.waitForFunction(() => !!(globalThis.__sdk && __sdk.sample && __sdk.state), { timeout: 20000 });
  // Read JSONL frames on Node side and feed them inside the page without relying on HTTP video/jsonl fetch
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

  // Allow up to 30s for either seat assignment or enriched presence to become available for both P1 and P2
  let bothReady = null;
  try {
    bothReady = await page.waitForFunction(() => {
      const s = __sdk.state();
      const seatsReady = !!(s.seats && s.seats.P1 && s.seats.P2);
      const enrichedReady = !!(s.enrichedBySeat && s.enrichedBySeat.P1 && s.enrichedBySeat.P2);
      return (seatsReady || enrichedReady) ? { P1:true, P2:true } : null;
    }, { timeout: 30000 });
  } catch (err) {
    // handled below
  }

  if(!bothReady){
    const dbg = await page.evaluate(() => ({ state: __sdk && __sdk.state && __sdk.state(), errors: __sdk && __sdk.errors && __sdk.errors() }));
    const summary = { page: pageUrl, clip, PASS: false, reason: 'P1/P2 enriched not present', dbg };
    try { fs.mkdirSync(outDir, { recursive: true }); fs.writeFileSync(outFile, JSON.stringify(summary, null, 2)); } catch {}
    console.error('verify_sdk_facade_mp4_enriched: FAIL', summary);
    await browser.close(); process.exit(1);
  }

  const summary = await page.evaluate(() => __sdk.sample(1500));
  const PASS = (summary.P1.present >= 10 && summary.P1.anyMetrics) && (summary.P2.present >= 10 && summary.P2.anyMetrics);
  const finalSummary = { page: pageUrl, clip, PASS, summary };
  try { fs.mkdirSync(outDir, { recursive: true }); fs.writeFileSync(outFile, JSON.stringify(finalSummary, null, 2)); } catch {}
  if(!PASS){ console.error('verify_sdk_facade_mp4_enriched: FAIL', finalSummary); await browser.close(); process.exit(1); }
  console.log('verify_sdk_facade_mp4_enriched: PASS', finalSummary);
  await browser.close();
})();
