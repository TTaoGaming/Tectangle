#!/usr/bin/env node
"use strict";
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function main() {
  try {
    const repoRoot = process.cwd();
    const outDir = path.join(repoRoot, 'docs', 'knowledge');
    fs.mkdirSync(outDir, { recursive: true });

    const gitCmd = 'git --no-pager log --all --since="7 months ago" --date=iso-strict --pretty=format:%aI';
    const out = execSync(gitCmd, { encoding: 'utf8' }).trim();
    if (!out) {
      console.error('No git commits in range.');
      process.exit(0);
    }
    const lines = out.split(/\r?\n/).filter(Boolean);
    const monthMap = new Map();
    for (const l of lines) {
      // l is ISO timestamp
      const d = new Date(l);
      if (isNaN(d)) continue;
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`;
      monthMap.set(key, (monthMap.get(key)||0)+1);
    }
    const months = Array.from(monthMap.keys()).sort();
    const data = months.map((m,i) => {
      const count = monthMap.get(m)||0;
      return { month: m, count };
    });
    // compute cumulative
    let cum = 0;
    for (const row of data) { cum += row.count; row.cumulative = cum; }
    // write CSV
    const csvPath = path.join(outDir, 'git_timeline.csv');
    const csvLines = ['month,count,cumulative', ...data.map(r => `${r.month},${r.count},${r.cumulative}`)];
    fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf8');
    console.log('WROTE CSV:', csvPath);
    // create SVG
    const svgPath = path.join(outDir, 'git_timeline.svg');
    const svg = buildSvg(data);
    fs.writeFileSync(svgPath, svg, 'utf8');
    console.log('WROTE SVG:', svgPath);
  } catch (err) {
    console.error('ERROR:', err && err.message || err);
    process.exit(1);
  }
}

function buildSvg(data) {
  const width = 1000;
  const height = 360;
  const margin = { top: 20, right: 60, bottom: 60, left: 60 };
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;
  const n = data.length || 1;
  const gap = 8;
  const barW = Math.max(4, (w - gap*(n-1))/n);
  const maxCount = Math.max(...data.map(d=>d.count), 1);
  const maxCum = Math.max(...data.map(d=>d.cumulative), 1);
  // scale functions
  const scaleYCount = c => margin.top + (h - Math.round((c / maxCount) * h));
  const scaleYCum = c => margin.top + (h - Math.round((c / maxCum) * h));
  // Build bars and polyline
  let bars = '';
  let points = [];
  for (let i=0;i<data.length;i++){
    const d = data[i];
    const x = margin.left + i * (barW + gap);
    const y = scaleYCount(d.count);
    const bh = margin.top + h - y;
    bars += `<rect x="${x.toFixed(1)}" y="${y}" width="${barW.toFixed(1)}" height="${bh}" fill="#4C9AFF" />\n`;
    const cx = (x + barW/2).toFixed(1);
    const cy = scaleYCum(d.cumulative).toFixed(1);
    points.push(`${cx},${cy}`);
  }
  const polyline = `<polyline fill="none" stroke="#FF7A54" stroke-width="2" points="${points.join(' ')}" />\n`;
  // X labels
  let xLabels = '';
  for (let i=0;i<data.length;i++){
    const d = data[i];
    const x = margin.left + i * (barW + gap);
    const label = d.month;
    xLabels += `<text x="${(x + barW/2).toFixed(1)}" y="${margin.top + h + 20}" font-size="11" text-anchor="middle">${label}</text>\n`;
  }
  // Y axis ticks
  let yAxis = '';
  const ticks = 5;
  for (let t=0;t<=ticks;t++){
    const val = Math.round(maxCount * (t/ticks));
    const y = margin.top + (h - Math.round((val / maxCount) * h));
    yAxis += `<line x1="${margin.left-6}" y1="${y}" x2="${margin.left}" y2="${y}" stroke="#666"/>\n`;
    yAxis += `<text x="${margin.left-10}" y="${y+4}" font-size="11" text-anchor="end">${val}</text>\n`;
  }
  const title = 'Git activity (commits) — last 7 months';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <style>text{font-family: Arial, Helvetica, sans-serif; fill:#222}</style>
  <rect width="100%" height="100%" fill="#fff"/>
  <text x="${margin.left}" y="${margin.top-5}" font-size="14" font-weight="bold">${title}</text>
  ${yAxis}
  <g>${bars}</g>
  ${polyline}
  <g>${xLabels}</g>
  </svg>`;
  return svg;
}

main();