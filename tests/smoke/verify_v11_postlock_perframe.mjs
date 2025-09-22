// Verify that after seat-lock, enriched data updates continuously per frame (or configured Hz)
import puppeteer from 'puppeteer';

const base = process.env.SITE_BASE || 'http://127.0.0.1:8080';
const clip = '../videos/two_hands_stationary_right_then_left_index_pinch_hold_1s_v1.mp4';
const pageUrl = `${base}/September2025/TectangleHexagonal/dev/integrated_hand_console_v11.html?autostart=1&nocam=1&clip=${encodeURIComponent(clip)}`;

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);
  await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });

  // Force UI to update every frame (so broadcaster/table throttle won't limit evidence)
  await page.evaluate(() => {
    const sel = document.getElementById('richHz'); if(sel){ sel.value = 'frame'; }
  });

  // Wait until we see a locked seat
  const lockInfo = await page.waitForFunction(() => {
    const a = (globalThis.__ihcV11 && globalThis.__ihcV11.seatLockAdapter) ? globalThis.__ihcV11.seatLockAdapter : null;
    const snap = a ? a.snapshot() : null; if(!snap) return null;
    const keys = Object.keys(snap.enriched||{});
    const locked = keys.filter(k => snap.enriched[k] && snap.enriched[k].locked);
    return locked.length ? { seat: locked[0], keys } : null;
  }, { timeout: 15000 });

  const lockedSeat = (await lockInfo.jsonValue()).seat;
  if(!lockedSeat){ console.error('FAIL: no seat lock'); await browser.close(); process.exit(1); }

  // Sample adapter frame counter and presence over ~1.5s
  const samples = await page.evaluate(async (seat) => {
    const a = globalThis.__ihcV11.seatLockAdapter;
    const out = [];
    const start = performance.now();
    while(performance.now() - start < 1500){
      const frame = a._state.frame;
      const snap = a.snapshot();
      const has = !!(snap.enriched && snap.enriched[seat] && snap.enriched[seat].locked);
      const v = snap.enriched && snap.enriched[seat] ? {
        norm: snap.enriched[seat].norm,
        rawNorm: snap.enriched[seat].rawNorm,
        velocity: snap.enriched[seat].velocity,
        acceleration: snap.enriched[seat].acceleration,
        palmAngleDeg: snap.enriched[seat].palmAngleDeg,
        historyLen: snap.enriched[seat].historyLen
      } : null;
      out.push({ frame, has, v });
      await new Promise(r=>setTimeout(r, 50)); // 20 Hz sampling
    }
    return out;
  }, lockedSeat);

  const distinctFrames = new Set(samples.map(s => s.frame)).size;
  const lockedCount = samples.filter(s => s.has).length;
  const anyNonNullMetric = samples.some(s => s.v && (s.v.norm!=null || s.v.rawNorm!=null || s.v.velocity!=null || s.v.acceleration!=null || s.v.palmAngleDeg!=null));

  const PASS = distinctFrames >= 10 && lockedCount >= 10 && anyNonNullMetric;
  if(!PASS){
    console.error('verify_v11_postlock_perframe: FAIL', { distinctFrames, lockedCount, anyNonNullMetric, samples: samples.slice(0,5) });
    await browser.close(); process.exit(1);
  }
  console.log('verify_v11_postlock_perframe: PASS', { distinctFrames, lockedCount, anyNonNullMetric });
  await browser.close();
})();
