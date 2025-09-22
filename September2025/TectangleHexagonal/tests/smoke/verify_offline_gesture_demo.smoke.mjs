// WEBWAY:ww-2025-089: Headless smoke for offline gesture demo
import puppeteer from 'puppeteer';

const SITE_BASE = process.env.SITE_BASE || 'http://127.0.0.1:8091';
const URL = `${SITE_BASE}/September2025/TectangleHexagonal/dev/gesture_tasks_offline.html`;

(async()=>{
  const browser = await puppeteer.launch({ headless: 'new', args:[ '--autoplay-policy=no-user-gesture-required' ] });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);
  await page.goto(URL, { waitUntil:'domcontentloaded' });
  await page.waitForSelector('#chipSelect');
  // Fire synthetic select via test hook
  await page.evaluate(()=> window.__gtOfflineSim?.fireOnce?.());
  const txt = await page.$eval('#chipSelect', el=> el.textContent || '');
  if(!/Selects:\s*1/.test(txt)){
    throw new Error(`Expected Selects: 1, got: ${txt}`);
  }
  await browser.close();
  console.log('OK: offline gesture demo smoke passed');
})();
