import { strict as assert } from 'assert';
import { clear, registerFactory, create, get } from '../../src/ManagerRegistry.js';

describe('ManagerRegistry factories', function () {
  beforeEach(function () {
    clear();
  });

  it('registerFactory and create (sync factory)', async function () {
    const factory = (value) => ({ value });
    registerFactory('SyncFactory', factory);
    const inst = await create('SyncFactory', { args: [42], meta: { kind: 'sync' } });
    assert.deepEqual(inst, { value: 42 });
    assert.equal(get('SyncFactory'), inst);
  });

  it('registerFactory and create (async factory)', async function () {
    const factory = async (value) => {
      await new Promise((r) => setTimeout(r, 1));
      return { value };
    };
    registerFactory('AsyncFactory', factory);
    const inst = await create('AsyncFactory', { args: ['hello'], meta: { kind: 'async' } });
    assert.deepEqual(inst, { value: 'hello' });
    assert.equal(get('AsyncFactory'), inst);
  });
});