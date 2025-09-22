/*
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T21:07-06:00
Expires: 2025-09-23T21:07-06:00 (auto-expire after 7 days)

Checklist:
 - [ ] Re-evaluate this artifact against current Hexagonal goals
 - [ ] Run this test with the latest September2025 build
 - [ ] Log decisions in TODO_2025-09-16.md
*/

import assert from 'assert';
import {
  loadGameProfile,
  listGameProfiles,
  registerGameProfile,
  resetGameProfileRegistry
} from '../../src/app/gameProfiles/index.js';

describe('gameProfiles registry', () => {
  beforeEach(() => {
    resetGameProfileRegistry();
  });

  it('provides legacy profile by default', () => {
    const profile = loadGameProfile();
    assert.strictEqual(profile.id, 'legacy-primary');
    assert.ok(Array.isArray(profile.rules));
    assert.ok(profile.rules.some(r => r.id === 'legacy-primary-down'));
  });

  it('creates parameterised single-key profiles', () => {
    const profile = loadGameProfile({ use: 'single-key', params: { key: 'KeyQ', keyLabel: 'Q' } });
    assert.strictEqual(profile.id, 'single-key');
    assert.deepStrictEqual(profile.params, { key: 'KeyQ', keyLabel: 'Q' });
    const downRule = profile.rules.find(r => r.id === 'single-key-down');
    assert.ok(Array.isArray(downRule.emit));
    assert.strictEqual(downRule.emit[0].action, 'KEY_DOWN');
  });

  it('allows registering custom profiles', () => {
    registerGameProfile({
      id: 'custom-dbg',
      label: 'Custom Debug',
      factory(){
        return {
          rules: [
            { id: 'dbg-down', when: { type: 'pinch:down' }, emit: [{ action: 'DBG_START' }] }
          ]
        };
      }
    });
    const catalog = listGameProfiles();
    assert.ok(catalog.find(p => p.id === 'custom-dbg'));
    const profile = loadGameProfile('custom-dbg');
    assert.strictEqual(profile.rules[0].emit[0].action, 'DBG_START');
  });
});


