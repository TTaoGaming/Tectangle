// Fetch MediaPipe hand_landmarker.task to local assets directory
// Writes to: September2025/TectangleHexagonal/assets/models/hand_landmarker.task
import fs from 'node:fs/promises';
import path from 'node:path';

const URLS = [
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float32/1/hand_landmarker.task'
];

const outDir = path.join('September2025','TectangleHexagonal','assets','models');
const outFile = path.join(outDir, 'hand_landmarker.task');

async function download(url, dest){
  console.log('[fetch] downloading', url);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  const res = await fetch(url);
  if(res.status >= 300 && res.status < 400 && res.headers.get('location')){
    const res2 = await fetch(res.headers.get('location'));
    if(!res2.ok) throw new Error('HTTP '+res2.status);
    const buf = Buffer.from(await res2.arrayBuffer());
    await fs.writeFile(dest, buf);
    return;
  }
  if(!res.ok) throw new Error('HTTP '+res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(dest, buf);
}

(async () => {
  for(const u of URLS){
    try { await download(u, outFile); console.log('[fetch] saved', outFile); process.exit(0); } catch(e){ console.warn('[fetch] failed url, trying next', u, e.message); }
  }
  console.error('[fetch] all URLs failed');
  process.exit(1);
})();
