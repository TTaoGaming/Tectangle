// Simple smoke to guard the V10→V11 hand-off
import puppeteer from 'puppeteer';

const base = process.env.SITE_BASE || 'http://127.0.0.1:8080';
const pageUrl = `${base}/September2025/TectangleHexagonal/dev/integrated_hand_console_v11.html?autostart=1&nocam=1`;

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
  // Wait for window object to expose test handle
  await page.waitForFunction(() => !!window.__ihcV11, { timeout: 15000 });
  const ok = await page.evaluate(() => {
    const h = window.__ihcV11; if(!h) return { ok:false, reason:'no-handle' };
    const hasSeatLock = !!h.seatLockAdapter && typeof h.seatLockAdapter.snapshot === 'function';
    const title = document.title || '';
    return { ok: hasSeatLock && title.includes('V11'), title, hasSeatLock };
  });
  if(!ok.ok){
    console.error('verify_v11_boot: FAIL', ok);
    await browser.close();
    process.exit(1);
  }
  console.log('verify_v11_boot: PASS', ok);
  await browser.close();
})();
