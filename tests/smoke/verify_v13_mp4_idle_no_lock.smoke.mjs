// V13 MP4 idle smoke: play golden idle clip and assert no seat locks
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.env.SITE_BASE || 'http://127.0.0.1:8080';
const clip = process.env.CLIP || 'September2025/TectangleHexagonal/videos/golden/golden.two_hands_idle.v1.mp4';
const outDir = 'September2025/TectangleHexagonal/out';
const outFile = process.env.OUT || path.join(outDir, 'idle.v13.smoke.summary.json');

const pageUrl = `${base}/September2025/TectangleHexagonal/dev/integrated_hand_console_v13.html?autostart=1&nocam=1&clip=${encodeURIComponent(clip)}`;

(async () => {
  const headless = (process.env.HEADLESS === '0' || process.env.HEADFUL === '1') ? false : 'new';
  const browser = await puppeteer.launch({ headless });
  const page = await browser.newPage();
  page.setDefaultTimeout(45000);
  await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });

  await page.evaluate(() => { const sel = document.getElementById('richHz'); if(sel) sel.value = 'frame'; });
  await page.waitForFunction(() => !!(globalThis.__ihcV13 && __ihcV13.vmCore && __ihcV13.seatLockAdapter), { timeout: 20000 });

  // Observe for a short window and ensure seats never reach locked=true
  const observed = await page.evaluate(async () => {
    const a = globalThis.__ihcV13.seatLockAdapter;
    let anyLock = false; let frames=0; let anglePresence=0;
    const start = performance.now();
    while(performance.now() - start < 2500){
      const snap = a.snapshot(); frames++;
      for(const sid of ['P1','P2']){
        const e = snap.enriched?.[sid];
        if(e?.locked) anyLock = true;
        const idx = e?.jointAngles?.index;
        if(idx && (idx.mcpDeg!=null || idx.pipDeg!=null || idx.dipDeg!=null)) anglePresence++;
      }
      await new Promise(r=>setTimeout(r, 50));
    }
    return { anyLock, frames, anglePresence };
  });

  const PASS = (observed.anyLock === false);
  const summary = { page: pageUrl, clip, PASS, observed };
  try { fs.mkdirSync(outDir, { recursive: true }); fs.writeFileSync(outFile, JSON.stringify(summary, null, 2)); } catch {}
  if(!PASS){ console.error('verify_v13_mp4_idle_no_lock: FAIL', summary); await browser.close(); process.exit(1); }
  console.log('verify_v13_mp4_idle_no_lock: PASS', summary);
  await browser.close();
})();
