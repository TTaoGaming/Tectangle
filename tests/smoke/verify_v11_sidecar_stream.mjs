// Verify that V11 streams rich telemetry snapshots to a sidecar window
import puppeteer from 'puppeteer';

const base = process.env.SITE_BASE || 'http://127.0.0.1:8080';
const clip = '../videos/two_hands_stationary_right_then_left_index_pinch_hold_1s_v1.mp4';
const pageUrl = `${base}/September2025/TectangleHexagonal/dev/integrated_hand_console_v11.html?autostart=1&nocam=1&sidecar=1&clip=${encodeURIComponent(clip)}`;

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.setDefaultTimeout(25000);
  await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });

  // Wait for the sidecar window to open
  let sidecar;
  for (let i=0;i<20;i++){
    const pages = await browser.pages();
    sidecar = pages.find(p => (p.url()||'').includes('rich_sidecar.html'));
    if(sidecar) break; await new Promise(r=>setTimeout(r,200));
  }
  if(!sidecar){
    console.error('verify_v11_sidecar_stream: FAIL no sidecar');
    await browser.close(); process.exit(1);
  }

  // Allow some time for seat-lock and snapshots
  await new Promise(r=>setTimeout(r,6000));

  const res = await sidecar.evaluate(() => {
    const d = window.__sidecarLast || null;
    const keys = d && d.enriched ? Object.keys(d.enriched) : [];
    const anySeat = keys.length > 0;
    return { anySeat, keys, ts: d && d.at };
  });

  const main = await page.evaluate(() => {
    const ad = (globalThis.__ihcV11 && globalThis.__ihcV11.seatLockAdapter) ? globalThis.__ihcV11.seatLockAdapter.snapshot() : { enriched:{} };
    const keys = Object.keys(ad.enriched||{});
    const last = globalThis.__lastRichSnapshot || null;
    const lk = last && last.enriched ? Object.keys(last.enriched) : [];
    const diag = document.getElementById('diag')?.textContent || '';
    return { adapterKeys: keys, lastBroadcastKeys: lk, diag };
  });

  if(!res.anySeat){
    console.error('verify_v11_sidecar_stream: FAIL no enriched payload', { sidecar: res, main });
    await browser.close(); process.exit(1);
  }

  console.log('verify_v11_sidecar_stream: PASS', res);
  await browser.close();
})();
