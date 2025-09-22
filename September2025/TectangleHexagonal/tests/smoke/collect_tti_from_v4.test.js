/* Collects TTI samples by driving the v4 Material demo with a golden clip,
then reports median and 90p error vs user lookahead. */

const base = process.env.SITE_BASE || 'http://127.0.0.1:8080';
const clip = process.env.CLIP || '/September2025/TectangleHexagonal/videos/golden/golden.two_hands_pinch_seq.v1.mp4';
const lookahead = +(process.env.LA || 100);

function quantile(arr, p){ if(!arr.length) return NaN; const s=arr.slice().sort((a,b)=>a-b); const i=Math.floor((s.length-1)*p); return s[i]; }

describe('TTI collection (v4 + golden clip)', () => {
  // WEBWAY:ww-2025-051: TTI telemetry smoke for v4 Material demo (auto-expire in 21d)
  it('collects TTI samples and prints stats', async () => {
    await page.setViewport({ width: 1280, height: 720 });
    const url = `${base}/September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v4_material.html?autostart=1&clip=${encodeURIComponent(clip)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    // Ensure video element is ready and playback starts
    await page.waitForFunction(() => document.getElementById('cam') && document.getElementById('cam').readyState >= 2);
    await page.evaluate((la)=>{ const el=document.getElementById('la'); if(el) el.value=String(la); }, lookahead);
    await page.evaluate(() => { const v=document.getElementById('cam'); try{ v.play?.(); }catch{} });
    // Wait until the pipeline produces rich snapshots (norm present)
    await page.waitForFunction(() => {
      const sdk = window.__sdk; if(!sdk || typeof sdk.getRichSnapshot !== 'function') return false;
      const rich = sdk.getRichSnapshot();
      return Array.isArray(rich) && rich.some(s => s && typeof s.norm === 'number');
    }, { timeout: 10000 });
    // Wait up to 15s for at least one TTI sample to be recorded
    await page.waitForFunction(() => (window.__tti && typeof window.__tti.getSamples === 'function' && window.__tti.getSamples().length > 0), { timeout: 15000 });
    const samples = await page.evaluate(()=> (window.__tti && Array.isArray(window.__tti.getSamples()) ? window.__tti.getSamples() : []));
    const errs = samples.map(s=>s.err).filter(x=>Number.isFinite(x));
    const med = quantile(errs, 0.5), p90 = quantile(errs, 0.9);
    // eslint-disable-next-line no-console
    console.log('[TTI]', JSON.stringify({ count: samples.length, median_err_ms: med, p90_err_ms: p90, lookahead }));
    expect(samples.length).toBeGreaterThanOrEqual(1);
  }, 30000);
});
