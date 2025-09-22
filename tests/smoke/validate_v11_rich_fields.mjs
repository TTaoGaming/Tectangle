// WEBWAY:ww-2025-025 Validate per-field presence/zeros for enriched telemetry post-lock
import puppeteer from 'puppeteer';

const base = process.env.SITE_BASE || 'http://127.0.0.1:8080';
const clip = '../videos/two_hands_stationary_right_then_left_index_pinch_hold_1s_v1.mp4';
const pageUrl = `${base}/September2025/TectangleHexagonal/dev/integrated_hand_console_v11.html?autostart=1&nocam=1&clip=${encodeURIComponent(clip)}`;

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);
  await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { const sel=document.getElementById('richHz'); if(sel) sel.value='10'; }); // 10 Hz to reduce flakiness

  // Wait for lock
  const lockInfo = await page.waitForFunction(() => {
    const a = globalThis.__ihcV11?.seatLockAdapter; if(!a) return null;
    const snap = a.snapshot(); const keys = Object.keys(snap.enriched||{});
    const locked = keys.filter(k => snap.enriched[k]?.locked);
    return locked.length ? { seat: locked[0] } : null;
  }, { timeout: 15000 });
  const lockedSeat = (await lockInfo.jsonValue()).seat;
  if(!lockedSeat){ console.error('[validate_v11_rich_fields] FAIL: No locked seat'); await browser.close(); process.exit(1); }

  // Sample ~2.5s
  const samples = await page.evaluate(async (seat) => {
    const a = globalThis.__ihcV11.seatLockAdapter; const out=[];
    const start = performance.now();
    while(performance.now()-start < 2500){
      const e = a.snapshot().enriched[seat];
      out.push({
        norm:e?.norm, rawNorm:e?.rawNorm, velocity:e?.velocity, acceleration:e?.acceleration,
        palmAngleDeg:e?.palmAngleDeg,
        mcpDeg: e?.jointAngles?.index?.mcpDeg,
        pipDeg: e?.jointAngles?.index?.pipDeg,
        dipDeg: e?.jointAngles?.index?.dipDeg,
      });
      await new Promise(r=>setTimeout(r, 50));
    }
    return out;
  }, lockedSeat);

  function stat(key){
    const vals = samples.map(s=>s[key]);
    const nonNull = vals.filter(v=>v!=null).length;
    const zeros = vals.filter(v=>v===0).length; // explicit zero
    return { nonNull, zeros, total: samples.length };
  }

  const fields = ['norm','rawNorm','velocity','acceleration','palmAngleDeg','mcpDeg','pipDeg','dipDeg'];
  const report = Object.fromEntries(fields.map(f=>[f, stat(f)]));

  // Heuristic PASS: at least 2 of the primary metrics present (norm/rawNorm/velocity/palmAngleDeg) and some finger angle presence
  const primaries = ['norm','rawNorm','velocity','palmAngleDeg'];
  const primaryPresent = primaries.reduce((n,f)=> n + (report[f].nonNull>3 ? 1 : 0), 0);
  const anyAnglePresent = (report.mcpDeg.nonNull + report.pipDeg.nonNull + report.dipDeg.nonNull) > 3;
  const PASS = primaryPresent >= 2 && anyAnglePresent;

  if(!PASS){
    console.error('[validate_v11_rich_fields] FAIL', { report, note:'Low presence for core metrics or finger angles. Check continuity fill-forward and producer paths.' });
    await browser.close(); process.exit(1);
  }
  console.log('[validate_v11_rich_fields] PASS', { report });
  await browser.close();
})();
