// WEBWAY:ww-2025-089: Fetch gesture_recognizer.task into assets/models for offline use
// Usage: node September2025/TectangleHexagonal/tools/fetch_gesture_model.mjs
import fs from 'fs';
import path from 'path';
import https from 'https';

const DEST = path.resolve('September2025/TectangleHexagonal/assets/models/gesture_recognizer.task');
const URL = process.env.MP_GESTURE_URL || 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task';

fs.mkdirSync(path.dirname(DEST), { recursive: true });

function download(url, dest){
  return new Promise((resolve, reject)=>{
    const file = fs.createWriteStream(dest);
    https.get(url, res=>{
      if(res.statusCode !== 200){ reject(new Error(`HTTP ${res.statusCode}`)); return; }
      res.pipe(file);
      file.on('finish', ()=> file.close(()=> resolve(dest)));
    }).on('error', err=>{ fs.unlink(dest, ()=> reject(err)); });
  });
}

(async()=>{
  if(fs.existsSync(DEST) && fs.statSync(DEST).size > 1024*100){
    console.log('Model already present:', DEST);
    process.exit(0);
  }
  console.log('Downloading gesture model from', URL);
  await download(URL, DEST);
  const sz = fs.statSync(DEST).size;
  console.log('Saved', DEST, 'bytes=', sz);
})();
