// Quick smoke to verify P1/P2 lock-in using controller_router_lab.html (CommonJS)
const puppeteer = require('puppeteer');

(async () => {
  const PORT = Number(process.env.E2E_PORT || process.env.PORT || 8091);
  const BASE = `http://127.0.0.1:${PORT}`;
  const LAB = `${BASE}/September2025/TectangleHexagonal/dev/controller_router_lab.html`;
  const CLIP = process.env.TWO_HAND_CLIP || 'September2025/TectangleHexagonal/videos/two_hands_stationary_right_then_left_index_pinch_hold_1s_v1.mp4';

  const url = `${LAB}?src=${encodeURIComponent(CLIP)}&noauto=0&maxMs=30000`;
  // Headless often yields zero detections with MediaPipe; prefer headed for reliability
  const browser = await puppeteer.launch({ headless: false, args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();

  await page.evaluateOnNewDocument(() => {
    window.__events = [];
    window.addEventListener('hex-pinch', (e) => {
      const d = e && e.detail || {}; window.__events.push({ type: 'hex-pinch', ...d });
    });
    window.addEventListener('message', (ev) => {
      const d = ev && ev.data; if(d && d.type === 'pinch-key'){ window.__events.push({ type: 'pinch-key', action: d.action, controllerId: d.controllerId, key: d.key }); }
    });
  });

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__hexReady === true, { timeout: 10000 });

  // Wait for at least two downs or max 20s
  const start = Date.now();
  let downs = 0;
  while (Date.now() - start < 20000) {
    downs = await page.evaluate(() => window.__events.filter(e => e.type === 'hex-pinch' && e.action === 'down').length);
    if (downs >= 2) break;
    await new Promise(r => setTimeout(r, 250));
  }

  const events = await page.evaluate(() => window.__events);
  const downsEv = events.filter(e => e.type === 'hex-pinch' && e.action === 'down');
  const controllers = Array.from(new Set(downsEv.map(e => e.controllerId).filter(Boolean)));

  console.log('downs:', downsEv.length, 'controllers:', controllers);
  await browser.close();

  const ok = downsEv.length >= 2 && controllers.includes('P1') && controllers.includes('P2');
  if (!ok) {
    console.error('FAIL: Did not observe distinct P1 and P2 on pinch:down.', { downs: downsEv.length, controllers });
    process.exit(2);
  } else {
    console.log('PASS: Observed pinch downs assigning P1 and P2.');
  }
})();
