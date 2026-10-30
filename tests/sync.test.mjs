import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createController } from '../scripts/controller.mjs';
import { DEFAULTS, writeConfig, readConfig } from '../scripts/lib/config.mjs';
import { managerAction } from '../scripts/service.mjs';

test('workspace edits survive repeated sync in either target order, reconnect and manager changes', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'moon-sync-'));
  await writeConfig(path.join(dir, 'settings.json'), { ...DEFAULTS, enabled: true });
  const windows = new Map(['first', 'second'].map(id => [id, { own: null }]));
  const app = await createController({ port: 0, dataDir: dir, interval: 60000,
    discoverTargets: async () => [...windows.keys()].map(id => ({ id })),
    openSession: async target => ({ closed: false, close() {}, async evaluate(expression) {
      const window = windows.get(target.id);
      if (expression.includes('? {settings:')) return structuredClone(window.own);
      if (expression.includes('return {restored:true}')) { if (window.own) window.own.settings.enabled = false; return { restored: true }; }
      const match = expression.match(/\}\)\((\{[\s\S]*\})\)\s*$/);
      assert.ok(match, 'expected renderer payload');
      const payload = JSON.parse(match[1]);
      window.own = { settings: payload.config, revision: payload.revision };
      return { applied: true };
    } }) });
  t.after(async () => { await app.close(); await fs.rm(dir, { recursive: true, force: true }); });
  const tick = () => managerAction('/api/check', {}, app.url);
  const stable = async (key, expected) => {
    for (let i = 0; i < 4; i++) {
      await tick();
      assert.equal(app.inspect().config[key], expected);
      for (const w of windows.values()) assert.equal(w.own.settings[key], expected);
    }
    assert.equal((await readConfig(path.join(dir, 'settings.json')))[key], expected);
  };
  await tick();
  windows.get('first').own.settings.petVisible = false;
  await stable('petVisible', false);
  windows.get('second').own.settings.petVisible = true;
  await stable('petVisible', true);
  windows.get('second').own.settings.petVisible = false;
  await stable('petVisible', false);
  windows.get('first').own.settings.petVisible = true;
  await stable('petVisible', true);
  // Independent edits in different windows must both survive.
  windows.get('first').own.settings.mood = 'night';
  windows.get('second').own.settings.character = 'chibi';
  await stable('mood', 'night'); await stable('character', 'chibi');
  await managerAction('/api/config', { petVisible: false }, app.url);
  await stable('petVisible', false);
  // A new/reconnected window's stale snapshot is not a new user edit.
  windows.set('new', { own: { revision: windows.get('first').own.revision, settings: { ...DEFAULTS, enabled: true } } });
  await stable('petVisible', false);
  windows.get('new').own.settings.petVisible = true;
  await stable('petVisible', true);
  windows.get('second').own.settings.enabled = false;
  await tick(); assert.equal(app.inspect().config.enabled, false);
  assert.equal(app.inspect().status.applied, 0);
});
