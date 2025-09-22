import { strict as assert } from 'assert';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { clear, createAllFromWiring, get, runLifecycle } from '../../src/ManagerRegistry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('ManagerRegistry wiring', function () {
  beforeEach(function () {
    clear();
  });

  it('createAllFromWiring resolves refs and registers instances', async function () {
    const mocksDir = path.join(__dirname, '..', 'mocks');
    const eventBusUrl = pathToFileURL(path.join(mocksDir, 'EventBusManager.mjs')).href;
    const landmarkRawUrl = pathToFileURL(path.join(mocksDir, 'LandmarkRawManager.mjs')).href;

    const wiring = [
      {
        name: 'EventBusManager',
        module: eventBusUrl,
        exportName: 'default',
        args: [],
        meta: {},
        startAfter: []
      },
      {
        name: 'LandmarkRawManager',
        module: landmarkRawUrl,
        exportName: 'default',
        args: [{ ref: 'EventBusManager' }],
        meta: {},
        startAfter: ['EventBusManager']
      }
    ];

    const { created, wiringMap } = await createAllFromWiring(wiring);
    // created should include both managers
    assert.ok(Array.isArray(created));
    assert.ok(created.includes('EventBusManager'));
    assert.ok(created.includes('LandmarkRawManager'));

    const eb = get('EventBusManager');
    const lr = get('LandmarkRawManager');

    assert.ok(eb, 'EventBusManager should be registered');
    assert.ok(lr, 'LandmarkRawManager should be registered');
    // LandmarkRawManager should have received a reference to EventBusManager
    assert.equal(lr.eventBus, eb);

    // run lifecycle to ensure start() is invoked and order respects startAfter relation
    const res = await runLifecycle('start');
    assert.equal(typeof res.ok, 'boolean');
    assert.equal(res.ok, true);
    assert.ok(res.results.EventBusManager && res.results.EventBusManager.ok === true);
    assert.ok(res.results.LandmarkRawManager && res.results.LandmarkRawManager.ok === true);
  });
});