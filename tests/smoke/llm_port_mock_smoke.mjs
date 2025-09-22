import { strict as assert } from 'assert';

describe('LLM Port (mock) smoke', function(){
  this.timeout(10000);
  it('returns seat-shaped JSON', async function(){
    const { generate } = await import('../../HiveFleetObsidian/tools/llm/llm_port.mjs');
    const res = await generate({ provider:'mock', model:'mock', seat:'explore', messages:[{role:'system', content:'s'},{role:'user', content:'u'}] });
    assert.ok(res && res.json, 'no json payload');
    assert.ok(res.json.what && res.json.how && Array.isArray(res.json.how), 'malformed json');
  });
});

