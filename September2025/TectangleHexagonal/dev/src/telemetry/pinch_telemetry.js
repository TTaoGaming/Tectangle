// WEBWAY:ww-2025-032: Minimal pinch telemetry scaffold (user-tunable; post-mortem ready)
// Contract: record({t, handId, norm, fsm, thresholds, palmAngleDeg}) -> push into ring buffer and optional onFlush()

export function createPinchTelemetry({ size=2048, onFlush }={}){
  const buf = new Array(size);
  let head = 0, count = 0;

  function record(evt){
    buf[head] = evt;
    head = (head + 1) % size;
    if (count < size) count++;
  }

  function snapshot(){
    const out = new Array(count);
    for(let i=0;i<count;i++){
      const idx = (head - count + i + size) % size;
      out[i] = buf[idx];
    }
    return out;
  }

  function flush(){
    const data = snapshot();
    if(onFlush) try{ onFlush(data); }catch{}
    head = 0; count = 0;
    return data;
  }

  return { record, snapshot, flush };
}
