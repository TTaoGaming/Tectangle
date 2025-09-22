// V13 quick telemetry smoke: load the V13 page, optionally auto-play default clip, sample ~1s and assert basic signals are present
import puppeteer from 'puppeteer';

const base = process.env.SITE_BASE || 'http://127.0.0.1:8080';
const clip = process.env.CLIP || 'September2025/TectangleHexagonal/videos/two_hands_stationary_right_then_left_index_pinch_hold_1s_v1.mp4';
const pageUrl = `${base}/September2025/TectangleHexagonal/dev/integrated_hand_console_v13.html?autostart=1&nocam=1&clip=${encodeURIComponent(clip)}`;

(async () => {
  const headless = (process.env.HEADLESS === '0' || process.env.HEADFUL === '1') ? false : 'new';
  const browser = await puppeteer.launch({ headless });
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);
  await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });

  await page.evaluate(() => { const sel = document.getElementById('richHz'); if(sel) sel.value = 'frame'; });

  // Wait for page globals to be ready
  await page.waitForFunction(() => !!(globalThis.__ihcV13 && __ihcV13.vmCore && __ihcV13.seatLockAdapter), { timeout: 20000 });

  // Sample adapter/VM presence for up to ~4s; this does not require a seat lock (faster feedback)
  const info = await page.evaluate(async () => {
    const a = globalThis.__ihcV13 && globalThis.__ihcV13.seatLockAdapter;
    const vm = globalThis.__ihcV13 && globalThis.__ihcV13.vmCore;
    const out = { hasAdapter: !!a, hasVM: !!vm, frames: 0, anyHands: 0, anySeats: 0, anyRich: 0 };
    const start = performance.now();
    while(performance.now() - start < 4000){
      const snapVm = vm?.snapshot();
      const hands = snapVm?.hands || {};
      if(Object.keys(hands).length) out.anyHands++;
      const snap = a?.snapshot();
      if(snap && snap.enriched && Object.keys(snap.enriched).length) out.anyRich++;
      const seats = snapVm?.seats || {};
      if(seats.P1 || seats.P2) out.anySeats++;
      out.frames++;
      // Early exit if we have activity
      if(out.anyHands>0 || out.anyRich>0) break;
      await new Promise(r=>setTimeout(r, 50));
    }
    return out;
  });

  const PASS = info.hasAdapter && info.hasVM && info.frames >= 1 && (info.anyHands >= 1 || info.anyRich >= 1);
  if(!PASS){
    console.error('verify_v13_quick_telemetry: FAIL', info);
    await browser.close();
    process.exit(1);
  }
  console.log('verify_v13_quick_telemetry: PASS', info);
  await browser.close();
})();
