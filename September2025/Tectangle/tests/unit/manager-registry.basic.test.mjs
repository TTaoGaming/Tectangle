import { strict as assert } from 'assert';
import { register, unregister, get, getMeta, has, list, clear } from '../../src/ManagerRegistry.js';

describe('ManagerRegistry basic API', function () {
  beforeEach(function () {
    clear();
  });

  it('register/get/getMeta/has/list/unregister', function () {
    const inst = {};
    const meta = { foo: 'bar' };
    const returned = register('A', inst, meta);
    assert.equal(returned, inst);
    assert.equal(get('A'), inst);
    assert.equal(getMeta('A'), meta);
    assert.equal(has('A'), true);
    const names = list();
    assert.ok(Array.isArray(names) && names.includes('A'));
    assert.equal(unregister('A'), true);
    assert.equal(has('A'), false);
    assert.strictEqual(get('A'), null);
  });
});