// WEBWAY:ww-2025-094 overlay bus v1
// Simple BroadcastChannel wrapper with topic namespacing and late-join replay option.
export function createBus(name='overlay-bus'){
  const ch = new BroadcastChannel(name);
  const listeners = new Map(); // topic -> Set(fn)
  const lastByTopic = new Map();
  ch.onmessage = (ev)=>{
    const { topic, data } = ev.data || {};
    if(!topic) return;
    lastByTopic.set(topic, data);
    const set = listeners.get(topic);
    if(set){ for(const fn of set) try{ fn(data); }catch(e){ console.warn('bus listener error', e); } }
  };
  function publish(topic, data){
    ch.postMessage({ topic, data });
  }
  function subscribe(topic, fn, { replay=false }={}){
    if(!listeners.has(topic)) listeners.set(topic, new Set());
    listeners.get(topic).add(fn);
    if(replay && lastByTopic.has(topic)){
      queueMicrotask(()=> fn(lastByTopic.get(topic)));
    }
    return ()=> listeners.get(topic)?.delete(fn);
  }
  function close(){ ch.close(); listeners.clear(); }
  return { publish, subscribe, close, channel: ch };
}
