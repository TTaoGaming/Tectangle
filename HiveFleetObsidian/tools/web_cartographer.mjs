// Web Cartographer: map local HTML/MD entrypoints and their links
// Usage: node HiveFleetObsidian/tools/web_cartographer.mjs [--since-days 365]
// Outputs: HiveFleetObsidian/cartography/web_map.json and web_map.md

import fs from 'node:fs';
import path from 'node:path';

function arg(name, def=''){ const i = process.argv.indexOf(`--${name}`); return i>-1 ? (process.argv[i+1]||def) : def; }

const baseNest = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const outDir = path.join(baseNest, 'cartography');
const sinceDays = Number(arg('since-days','365'));
const startTime = Date.now() - sinceDays * 24*60*60*1000;

const IGNORE_SEGMENTS = new Set(['node_modules','.git','.history','.husky','.github','.devcontainer','.venv','archive-stale']);

const roots = [
  'docs',
  'September2025',
  '.',
].filter(p=>fs.existsSync(p));

function shouldSkip(rel){
  const parts = rel.split(/[\\\/]+/);
  return parts.some(p=>IGNORE_SEGMENTS.has(p)) || /archive-20\d{2}/.test(rel);
}

function listFiles(){
  const all=[];
  for(const r of roots){
    const stack=[r];
    while(stack.length){
      const cur = stack.pop();
      for(const e of fs.readdirSync(cur, { withFileTypes:true })){
        const p = path.join(cur, e.name);
        const rel = path.relative(process.cwd(), p);
        if(shouldSkip(rel)) continue;
        if(e.isDirectory()) { stack.push(p); continue; }
        if(e.isFile()){
          const ext = path.extname(e.name).toLowerCase();
          if(!['.html','.md'].includes(ext)) continue;
          const st = fs.statSync(p);
          if(st.mtimeMs >= startTime) all.push(p);
        }
      }
    }
  }
  return [...new Set(all)];
}

function readFile(p){ try { return fs.readFileSync(p,'utf8'); } catch { return ''; } }

function titleFor(p, txt){
  const ext = path.extname(p).toLowerCase();
  if(ext === '.html'){
    const m = txt.match(/<title>([^<]+)<\/title>/i); if(m) return m[1].trim();
    const h1 = txt.match(/<h1[^>]*>(.*?)<\/h1>/i); if(h1) return h1[1].replace(/<[^>]+>/g,'').trim();
  } else if(ext === '.md'){
    const h1 = txt.split(/\r?\n/).find(l=>/^#\s+/.test(l)); if(h1) return h1.replace(/^#\s+/,'').trim();
  }
  return path.basename(p);
}

function extractLinks(p, txt){
  const ext = path.extname(p).toLowerCase();
  const links = [];
  if(ext === '.html'){
    for(const m of txt.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) links.push(m[1]);
  } else if(ext === '.md'){
    for(const m of txt.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) links.push(m[1]);
  }
  const external = links.filter(u=>/^https?:/i.test(u));
  const local = links.filter(u=>!/^https?:/i.test(u) && !u.startsWith('data:'));
  return { external, local };
}

const files = listFiles();
const nodes = [];
const edges = [];

for(const p of files){
  const txt = readFile(p);
  const title = titleFor(p, txt);
  const rel = path.relative(process.cwd(), p).replace(/\\/g,'/');
  const { external, local } = extractLinks(p, txt);
  nodes.push({ id: rel, title, externalCount: external.length, localCount: local.length });
  for(const l of local){
    // strip anchors and query strings
    const clean = l.replace(/[?#].*$/, '');
    const tgt = path.normalize(path.join(path.dirname(rel), clean)).replace(/\\/g,'/');
    edges.push({ from: rel, to: tgt, raw: l });
  }
}

fs.mkdirSync(outDir, { recursive:true });

// Analyze graph
const nodeSet = new Set(nodes.map(n=>n.id));
const inDeg = new Map(nodes.map(n=>[n.id,0]));
for(const e of edges){ if (inDeg.has(e.to)) inDeg.set(e.to, (inDeg.get(e.to)||0) + 1); }
const orphans = nodes.filter(n => (inDeg.get(n.id)||0) === 0).map(n=>n.id);
const dangling = [];
for(const e of edges){
  if (nodeSet.has(e.to)) continue;
  if (fs.existsSync(e.to)) continue; // exists but not scanned (older than sinceDays)
  dangling.push({ from: e.from, to: e.to, raw: e.raw });
}
const topHubs = nodes.slice().sort((a,b)=> (b.localCount||0) - (a.localCount||0)).slice(0,10).map(n=>({ id:n.id, title:n.title, out:n.localCount }));

// JSON report
const jsonPath = path.join(outDir, 'web_map.json');
fs.writeFileSync(jsonPath, JSON.stringify({
  generatedAt: new Date().toISOString(),
  nodes, edges,
  stats: { pages: nodes.length, localEdges: edges.length, orphans: orphans.length, dangling: dangling.length },
  orphans,
  dangling: dangling.slice(0,50),
  topHubs
}, null, 2));

// Markdown report
const mdPath = path.join(outDir, 'web_map.md');
const seeds = nodes.filter(n=>/index\.html$|README\.md$/i.test(n.id)).slice(0, 30);
let md = `# Web Cartography (generated)\n\nGenerated: ${new Date().toISOString()}\n\n## Seeds (index/README)\n`;
for(const s of seeds){ md += `- ${s.title} - ${s.id} (links: ${s.localCount}, external: ${s.externalCount})\n`; }
md += `\n## Stats\n- Pages scanned: ${nodes.length}\n- Local edges: ${edges.length}\n- Orphans (no inbound links): ${orphans.length}\n- Dangling links (missing targets): ${dangling.length}\n`;
if (topHubs.length){ md += `\n## Top Hubs (by out-links)\n`; for(const h of topHubs){ md += `- ${h.title} -> ${h.id} (out: ${h.out})\n`; } }
if (orphans.length){ md += `\n## Orphans (first 20)\n`; for(const o of orphans.slice(0,20)){ md += `- ${o}\n`; } }
if (dangling.length){ md += `\n## Dangling Links (first 20)\n`; for(const d of dangling.slice(0,20)){ md += `- ${d.from} -> ${d.to} (raw: ${d.raw})\n`; } }
fs.writeFileSync(mdPath, md, 'utf8');

console.log(`[Cartographer] Mapped ${nodes.length} pages -> ${mdPath}`);

// Optional guardrail: fail on dangling links (off by default)
if (process.env.HFO_CARTO_FAIL_ON_MISSING === '1' && dangling.length > 0) {
  console.error(`[Cartographer] Dangling links detected: ${dangling.length}`);
  process.exit(1);
}
