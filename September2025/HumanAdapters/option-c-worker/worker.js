// Worker adapter that runs Human detection and returns hands landmarks (normalized if <=1 assumed)
self.onmessage = async (ev)=>{
  const msg = ev.data;
  if(msg?.type === 'init'){
    const { humanEsm, models } = msg;
    const { Human } = await import(humanEsm);
    self.human = new Human({
      backend: 'wasm',
      wasmPath: (models + '/tfjs-wasm/'),
      modelBasePath: models,
      face: { enabled: false },
      hand: { enabled: true },
      body: { enabled: false },
      gesture: { enabled: true },
      filter: { enabled: false },
    });
    await self.human.load();
    self.postMessage({ type: 'ready' });
    return;
  }
  if(msg?.type === 'frame'){
    const { bitmap } = msg;
    const res = await self.human.detect(bitmap);
    const hands = res.hands || res.hand || [];
    self.postMessage({ type: 'hands', hands });
    bitmap.close?.();
  }
};
