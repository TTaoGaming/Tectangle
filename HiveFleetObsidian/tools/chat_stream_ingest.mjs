// Chat Stream Ingest: convert chat_*.json transcripts into a JSONL stream for durable search
// Usage: node HiveFleetObsidian/tools/chat_stream_ingest.mjs [--since-days 14]

import fs from 'node:fs';
import path from 'node:path';

const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const chatsDir = path.join(base, 'reports','chats');
const outPath = path.join(base, 'history','chat_stream.jsonl');

function arg(name, def=''){ const i = process.argv.indexOf(`--${name}`); return i>-1 ? (process.argv[i+1]||def) : def; }
const sinceDays = Number(arg('since-days','14'));
const cutoff = Date.now() - sinceDays*24*3600*1000;

function listChats(){
  if (!fs.existsSync(chatsDir)) return [];
  return fs.readdirSync(chatsDir).filter(n=>/chat_.*\.json$/i.test(n)).map(n=>path.join(chatsDir,n)).filter(p=>fs.statSync(p).mtimeMs>=cutoff).sort((a,b)=>fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs);
}

function parseLine(s){
  const m = s.match(/^([^:]+):\s*(.*)$/);
  return m ? { speaker: m[1].trim(), text: m[2].trim() } : { speaker:'', text:s.trim() };
}

function main(){
  fs.mkdirSync(path.dirname(outPath), { recursive:true });
  const out = fs.createWriteStream(outPath, { flags:'a', encoding:'utf8' });
  let count=0;
  for (const file of listChats()){
    try{
      const data = JSON.parse(fs.readFileSync(file,'utf8'));
      const ts = data.generatedAt || new Date(fs.statSync(file).mtimeMs).toISOString();
      const ref = path.relative(process.cwd(), file).replace(/\\/g,'/');
      const turn = (data.counselRef||'').replace(/\\/g,'/');
      for (let i=0;i<(data.chat||[]).length;i++){
        const raw = String(data.chat[i]||'');
        if (!raw) continue;
        const { speaker, text } = parseLine(raw);
        const rec = { ts, speaker, text, chatRef: ref, line: i, counselRef: turn };
        out.write(JSON.stringify(rec)+'\n');
        count++;
      }
    }catch{}
  }
  out.end();
  console.log('[Scribe] Ingested', count, 'chat line(s) ->', outPath);
}

main();

