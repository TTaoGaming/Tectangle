import assert from 'assert';
import * as registryModule from '../../src/ManagerRegistry.js';

describe('ManagerRegistry integration smoke', function() {
  it('can register, get, list, has and unregister a dummy manager', function() {
    const { register, get, has, list, unregister, getMeta } = registryModule;
    const dummy = { name: 'dummy' };
    const meta = { EARS: 'TREQ-REG-TEST' };

    register('DummyManager', dummy, meta);

    assert.strictEqual(has('DummyManager'), true);
    assert.strictEqual(get('DummyManager'), dummy);
    const names = list();
    assert.ok(Array.isArray(names));
    assert.ok(names.includes('DummyManager'));
    assert.deepStrictEqual(getMeta('DummyManager'), meta);

    const removed = unregister('DummyManager');
    assert.strictEqual(removed, true);
    assert.strictEqual(has('DummyManager'), false);
  });
});