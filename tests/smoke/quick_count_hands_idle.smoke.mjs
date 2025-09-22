// WEBWAY:ww-2025-090 Quick hands/palm probe on V13 frozen page for idle golden clip
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.env.SITE_BASE || 'http://127.0.0.1:8080';
const clip = process.env.CLIP || 'September2025/TectangleHexagonal/videos/golden/golden.two_hands_idle.v1.mp4';
const outDir = 'September2025/TectangleHexagonal/out';
const outFile = process.env.OUT || path.join(outDir, 'idle.v13.quick.hands.summary.json');

const pageUrl = `${base}/September2025/TectangleHexagonal/dev/integrated_hand_console_v13.html?autostart=1&nocam=1&clip=${encodeURIComponent(clip)}`;

(async () => {
  const headless = (process.env.HEADLESS === '0' || process.env.HEADFUL === '1') ? false : 'new';
  const browser = await puppeteer.launch({ headless });
  const page = await browser.newPage();
  page.setDefaultTimeout(45000);
  await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });

  // Prefer frame-rate updates for faster signal visibility
  await page.evaluate(() => { const sel = document.getElementById('richHz'); if(sel) sel.value = 'frame'; });

  // Wait for V13 globals and initial hands or adapter
  await page.waitForFunction(() => !!(globalThis.__ihcV13 && __ihcV13.seatLockAdapter), { timeout: 20000 });

  // Observe for ~6 seconds (give the decoder and pipeline time in headless)
  const result = await page.evaluate(async () => {
    const seat = globalThis.__ihcV13?.seatLockAdapter;
    const vm = globalThis.__ihcV13?.vmCore;
    const seenCounts = new Set();
    let frames = 0;
    let anyLock = false;
    const palmPresence = { P1: 0, P2: 0 };
    let pinchDowns = 0, pinchUps = 0;
    try { globalThis.__ihcV13?.shell?.onEvent?.((e)=>{ if(!e||!e.type) return; if(e.type==='pinch:down') pinchDowns++; if(e.type==='pinch:up') pinchUps++; }); } catch {}
    let everHands = false;
    const start = performance.now();
    while (performance.now() - start < 6000) {
      const snapVm = vm?.snapshot?.();
      const handsCount = snapVm && snapVm.hands ? Object.keys(snapVm.hands).length : 0;
      seenCounts.add(handsCount);
      if(handsCount > 0) everHands = true;
      const snap = seat?.snapshot?.();
      const enr = snap?.enriched || {};
      for (const sid of ['P1','P2']) {
        const e = enr[sid];
        if (e?.locked) anyLock = true;
        if (typeof e?.palmAngleDeg === 'number') palmPresence[sid]++;
      }
      frames++;
      await new Promise(r => setTimeout(r, 50));
    }
    const maxHands = Math.max(0, ...Array.from(seenCounts));
    return { frames, maxHands, everHands, palmPresence, anyLock, pinchDowns, pinchUps };
  });

  const PASS = (result.maxHands >= 2) && (result.anyLock === false) && (result.pinchDowns === 0);
  const summary = { page: pageUrl, clip, PASS, observed: result };
  try { fs.mkdirSync(outDir, { recursive: true }); fs.writeFileSync(outFile, JSON.stringify(summary, null, 2)); } catch {}
  if (!PASS) { console.error('quick_count_hands_idle: FAIL', summary); await browser.close(); process.exit(1); }
  console.log('quick_count_hands_idle: PASS', summary);
  await browser.close();
})();
