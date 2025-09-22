// V13 MP4 smoke: play a clip, wait for seat lock, sample enriched metrics, and write a small summary
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.env.SITE_BASE || 'http://127.0.0.1:8080';
// Main two-hands clip: right then left pinch, should produce P1 then P2 locks
const clip = process.env.CLIP || 'September2025/TectangleHexagonal/videos/two_hands_stationary_right_then_left_index_pinch_hold_1s_v1.mp4';
const outDir = 'September2025/TectangleHexagonal/out';
const outFile = process.env.OUT || path.join(outDir, 'enriched.v13.smoke.summary.json');

const pageUrl = `${base}/September2025/TectangleHexagonal/dev/integrated_hand_console_v13.html?autostart=1&nocam=1&clip=${encodeURIComponent(clip)}`;

(async () => {
  const headless = (process.env.HEADLESS === '0' || process.env.HEADFUL === '1') ? false : 'new';
  const browser = await puppeteer.launch({ headless });
  const page = await browser.newPage();
  page.setDefaultTimeout(45000);
  await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });

  // Prefer every-frame UI update and ensure globals exist
  await page.evaluate(() => { const sel = document.getElementById('richHz'); if(sel) sel.value = 'frame'; });
  await page.waitForFunction(() => !!(globalThis.__ihcV13 && __ihcV13.vmCore && __ihcV13.seatLockAdapter), { timeout: 20000 });

  // Wait up to 25s for both P1 and P2 to lock
  const both = await page.waitForFunction(() => {
    const a = globalThis.__ihcV13?.seatLockAdapter; if(!a) return null;
    const e = a.snapshot().enriched || {};
    const p1 = !!(e.P1 && e.P1.locked);
    const p2 = !!(e.P2 && e.P2.locked);
    return (p1 && p2) ? { P1: true, P2: true } : null;
  }, { timeout: 25000 });

  if(!both){
    // As debug aid, capture a small VM summary
    const vmDbg = await page.evaluate(() => {
      const vm = globalThis.__ihcV13?.vmCore; if(!vm) return null;
      const snap = vm.snapshot();
      return { hands: Object.keys(snap.hands||{}).length, seats: snap.seats||{} };
    });
    const summary = { page: pageUrl, clip, PASS: false, reason: 'Both seats did not lock', vmDbg };
    try { fs.mkdirSync(outDir, { recursive: true }); fs.writeFileSync(outFile, JSON.stringify(summary, null, 2)); } catch {}
    console.error('verify_v13_mp4_enriched: FAIL', summary);
    await browser.close(); process.exit(1);
  }

  // Sample ~1.5s for both seats
  const summary = await page.evaluate(async () => {
    const a = globalThis.__ihcV13.seatLockAdapter;
    const seats = ['P1','P2'];
    const samples = { P1:[], P2:[] };
    const start = performance.now();
    while(performance.now() - start < 1500){
      const snap = a.snapshot();
      for(const sid of seats){
        const e = snap.enriched?.[sid];
        samples[sid].push(e ? {
          frame: a._state.frame,
          norm: e.norm,
          rawNorm: e.rawNorm,
          velocity: e.velocity,
          acceleration: e.acceleration,
          palmAngleDeg: e.palmAngleDeg,
          idx: e.jointAngles?.index || null,
        } : null);
      }
      await new Promise(r=>setTimeout(r, 50));
    }
    function analyze(arr){
      const present = arr.filter(Boolean);
      const frames = new Set(present.map(s=>s.frame)).size;
      const any = present.some(s => s.norm!=null || s.rawNorm!=null || s.velocity!=null || s.acceleration!=null || s.palmAngleDeg!=null);
      const anglePresence = present.filter(s => s.idx && (s.idx.mcpDeg!=null || s.idx.pipDeg!=null || s.idx.dipDeg!=null)).length;
      return { count: arr.length, present: present.length, distinctFrames: frames, anyMetrics: any, anglePresence };
    }
    return { P1: analyze(samples.P1), P2: analyze(samples.P2) };
  });

  const PASS = (summary.P1.distinctFrames >= 10 && summary.P1.anyMetrics) && (summary.P2.distinctFrames >= 10 && summary.P2.anyMetrics);
  const finalSummary = { page: pageUrl, clip, seats: { P1:true, P2:true }, PASS, summary };
  try { fs.mkdirSync(outDir, { recursive: true }); fs.writeFileSync(outFile, JSON.stringify(finalSummary, null, 2)); } catch {}
  if(!PASS){ console.error('verify_v13_mp4_enriched: FAIL', finalSummary); await browser.close(); process.exit(1); }
  console.log('verify_v13_mp4_enriched: PASS', finalSummary);
  await browser.close();
})();
