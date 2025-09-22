// LLM Port: provider-agnostic router with simple generate()
// Usage: await generate({ messages, provider, model, temperature, maxTokens, seat })

function env(name, def=''){ return process.env[name] ?? def; }

async function callProvider({ provider, ...opts }){
  switch((provider||'').toLowerCase()){
    case 'mock': {
      const { request } = await import('./providers/mock_adapter.mjs');
      return request(opts);
    }
    case 'openai': {
      const key = env('OPENAI_API_KEY','');
      if (!key) throw new Error('OPENAI_API_KEY missing');
      const base = env('OPENAI_BASE_URL','https://api.openai.com/v1');
      const res = await fetch(base + '/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type':'application/json' },
        body: JSON.stringify({
          model: opts.model || env('HFO_LLM_MODEL','gpt-4o-mini'),
          temperature: opts.temperature ?? 0.2,
          max_tokens: opts.maxTokens ?? 512,
          messages: opts.messages || []
        })
      });
      if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || '';
      let json=null; try{ json = JSON.parse(text); }catch{}
      return { text, json, usage: data?.usage || {}, raw: data };
    }
    case 'anthropic': {
      const key = env('ANTHROPIC_API_KEY','');
      if (!key) throw new Error('ANTHROPIC_API_KEY missing');
      const base = env('ANTHROPIC_BASE_URL','https://api.anthropic.com');
      const sys = (opts.messages||[]).find(m=>m.role==='system')?.content || '';
      const user = (opts.messages||[]).filter(m=>m.role!=='system').map(m=>m.content).join('\n');
      const res = await fetch(base + '/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': key, 'anthropic-version':'2023-06-01', 'Content-Type':'application/json' },
        body: JSON.stringify({
          model: opts.model || env('HFO_LLM_MODEL','claude-3-5-sonnet'),
          max_tokens: opts.maxTokens ?? 512,
          temperature: opts.temperature ?? 0.2,
          system: sys,
          messages: [{ role:'user', content: user }]
        })
      });
      if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}`);
      const data = await res.json();
      const text = (data?.content?.[0]?.text) || '';
      let json=null; try{ json = JSON.parse(text); }catch{}
      return { text, json, usage: data?.usage || {}, raw: data };
    }
    case 'github': {
      const key = env('GITHUB_TOKEN','');
      if (!key) throw new Error('GITHUB_TOKEN missing');
      const model = opts.model || env('HFO_LLM_MODEL','gpt-4o-mini');
      const res = await fetch('https://api.githubcopilot.com/v1/responses', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type':'application/json' },
        body: JSON.stringify({
          model,
          input: (opts.messages||[]).map(m=>({ role: m.role, content: [{ type:'text', text: m.content }] }))
        })
      });
      if (!res.ok) throw new Error(`GitHub Models HTTP ${res.status}`);
      const data = await res.json();
      const text = data?.output_text || '';
      let json=null; try{ json = JSON.parse(text); }catch{}
      return { text, json, usage: {}, raw: data };
    }
    case 'ollama': {
      const base = env('OLLAMA_BASE_URL','http://localhost:11434');
      const model = opts.model || env('HFO_LLM_MODEL','llama3:instruct');
      const prompt = (opts.messages||[]).map(m=>`[${m.role}] ${m.content}`).join('\n');
      const res = await fetch(base + '/api/generate', {
        method: 'POST', headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ model, prompt, options:{temperature:opts.temperature??0.2}})
      });
      if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
      const text = await res.text();
      let outText='';
      try{ outText = text.trim().split('\n').map(l=>{ try{ return JSON.parse(l).response||''; }catch{ return ''; } }).join(''); }catch{ outText=text; }
      let json=null; try{ json = JSON.parse(outText); }catch{}
      return { text: outText, json, usage: {}, raw: text };
    }
    default:
      throw new Error(`Unknown LLM provider: ${provider}`);
  }
}

export async function generate({ messages=[], provider, model, temperature=0.2, maxTokens=512, seat }={}){
  const chosen = provider || process.env.HFO_LLM_PROVIDER || '';
  if (!chosen) throw new Error('No provider set. Set --provider or HFO_LLM_PROVIDER');
  return callProvider({ provider: chosen, messages, model, temperature, maxTokens, seat });
}

