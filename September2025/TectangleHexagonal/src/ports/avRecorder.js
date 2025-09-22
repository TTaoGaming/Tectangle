/*
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
 - [ ] Re-evaluate this artifact against current Hexagonal goals
 - [ ] Verify dependent modules and update factorization notes
 - [ ] Log decisions in TODO_2025-09-16.md
*/

// Minimal A/V recording: capture video from canvas + audio beeps (if provided MediaStream)

export function createAVRecorder(){
  let mediaRecorder=null; let chunks=[]; let url=null;
  async function start({ canvas, audioStream }={}){
    if(mediaRecorder) return url; chunks=[];
    const vStream = canvas?.captureStream?.(30);
    let mix = vStream;
    if(audioStream){ const ctx = new MediaStream([...vStream.getTracks(), ...audioStream.getTracks()]); mix = ctx; }
    mediaRecorder = new MediaRecorder(mix, { mimeType: 'video/webm;codecs=vp9' });
    mediaRecorder.ondataavailable = (e)=>{ if(e.data && e.data.size>0) chunks.push(e.data); };
    mediaRecorder.onstop = ()=>{ const blob = new Blob(chunks, { type: 'video/webm' }); url = URL.createObjectURL(blob); };
    mediaRecorder.start();
    return null;
  }
  function stop(){ if(!mediaRecorder) return null; mediaRecorder.stop(); mediaRecorder=null; return url; }
  return { start, stop, getUrl: ()=>url };
}
