/*
Collects TTI samples by driving the v4 Material demo with a golden clip,
then reports median and 90p error vs user lookahead.
*/

const fs = require('node:fs/promises');
const path = require('node:path');

const base = process.env.SITE_BASE || 'http://127.0.0.1:8080';
const clip = process.env.CLIP || '/September2025/TectangleHexagonal/videos/golden/golden.two_hands_pinch_seq.v1.mp4';
const lookahead = +(process.env.LA || 100);

(async()=>{
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  const url = `${base}/September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v4_material.html?autostart=1&clip=${encodeURIComponent(clip)}`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.getElementById('cam') && document.getElementById('cam').readyState >= 2);
  await page.evaluate((la)=>{ const el=document.getElementById('la'); if(el) el.value=String(la); }, lookahead);
  await page.evaluate((t)=>{ const v=document.getElementById('cam'); if(v) v.currentTime = t; }, 1.5);
  await new Promise(r=>setTimeout(r, 2500));
  const samples = await page.evaluate(()=> (window.__tti && Array.isArray(window.__tti.getSamples()) ? window.__tti.getSamples() : []));
  function quantile(arr, p){ if(!arr.length) return NaN; const s=arr.slice().sort((a,b)=>a-b); const i=Math.floor((s.length-1)*p); return s[i]; }
  const errs = samples.map(s=>s.err).filter(x=>Number.isFinite(x));
  const med = quantile(errs, 0.5), p90 = quantile(errs, 0.9);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ count: samples.length, median_err_ms: med, p90_err_ms: p90, lookahead }, null, 2));
})();
