// WEBWAY:ww-2025-026: Size-only comparator for summary JSONs
import fs from 'node:fs';
import path from 'node:path';

function load(p){
  const abs = path.resolve(p);
  return fs.readFileSync(abs);
}

function main(){
  const args = process.argv.slice(2);
  const seed = args.includes('--seed');
  const filtered = args.filter(a => a !== '--seed');
  const [aPath, bPath] = filtered;
  if(!aPath || !bPath){
    console.error('Usage: node compare_summary_size.mjs <current.json> <golden.json> [--seed]');
    process.exit(2);
  }
  try{
    const aBuf = load(aPath);
    let bBuf;
    try{
      bBuf = load(bPath);
    }catch(err){
      if(seed && err && err.code === 'ENOENT'){
        const absGolden = path.resolve(bPath);
        fs.mkdirSync(path.dirname(absGolden), { recursive: true });
        fs.writeFileSync(absGolden, aBuf);
        console.log('compare_summary_size: seeded golden from current', JSON.stringify({ golden: bPath, size: aBuf.length }));
        process.exit(0);
      }
      throw err;
    }
    const aSize = aBuf.length;
    const bSize = bBuf.length;
    const PASS = (aSize === bSize);
    const report = { PASS, current:aPath, golden:bPath, sizes:{ current:aSize, golden:bSize } };
    console.log('compare_summary_size:', JSON.stringify(report));
    if(!PASS) process.exit(1);
  }catch(err){
    console.error('compare_summary_size: ERROR', String(err));
    process.exit(2);
  }
}

main();
