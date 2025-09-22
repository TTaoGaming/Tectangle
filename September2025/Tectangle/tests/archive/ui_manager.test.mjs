import assert from 'assert';
import ui, { UIManager } from '../../../src/UIManager.js';
import registry from '../../../src/ManagerRegistry.js';

(async function () {
  try {
    // Create fake manager instance with getState and setParams
    const fake = {
      params: { showRaw: true },
      getState() { return this.params; },
      setParams(p) { Object.assign(this.params, p); }
    };
    registry.register('FakeManager', fake, {
      UI_METADATA: { tabId: 'fake', title: 'Fake Manager', order: 1, controls: [{ key: 'showRaw', type: 'checkbox', label: 'Show Raw' }] }
    });

    const instance = ui || new UIManager();
    await instance.init();
    instance.renderTabs();

    // Check DOM contains a button with text 'Fake Manager'
    if (typeof document === 'undefined') {
      console.warn('ui_manager test: skipped (no DOM)');
    } else {
      const btns = Array.from(document.querySelectorAll('button'));
      const found = btns.some(b => b.textContent && b.textContent.includes('Fake Manager'));
      assert.ok(found, 'UIManager did not render Fake Manager tab');
      console.log('ui_manager test: ok');
    }
  } catch (e) {
    console.error('ui_manager test: failed', e);
    throw e;
  }
})();