// Optional browser regression check: npm run test:toolbar (Playwright + Edge).
import assert from 'node:assert/strict';
import http from 'node:http';
import { buildPayload } from '../scripts/controller.mjs';

const { chromium } = await import(process.env.MOON_GARDEN_PLAYWRIGHT || 'playwright');
const fixture = `<!doctype html><html><head><style>
body{margin:0;font:16px sans-serif}main{padding:24px}
textarea{position:fixed;bottom:60px;left:24px;width:calc(100% - 56px);height:100px}
nav{position:fixed;bottom:16px;right:24px;display:flex;gap:16px}nav button{padding:12px}
</style></head><body><main><p id="conversation">Existing conversation.</p><textarea>Unsent draft.</textarea>
<nav><button id="model" onclick="window.modelClicks=(window.modelClicks||0)+1">GPT model</button>
<button id="stop" aria-label="Stop generating" onclick="window.stopClicks=(window.stopClicks||0)+1">Stop</button></nav>
</main></body></html>`;
const server = http.createServer((req, res) => { res.setHeader('Content-Type', 'text/html'); res.end(fixture); });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const config = { version: 1, enabled: true, character: 'portrait', mood: 'day', size: 100, artwork: 70, petVisible: false, motion: true, side: 'right' };
  const payload = await buildPayload(config);
  assert.equal((await page.evaluate(payload.expression)).applied, true);
  const host = page.locator('#gpt-moon-garden-live');
  const launcher = host.getByRole('button', { name: '月白云庭外观设置', exact: true });
  const tools = host.locator('.tools');
  assert.equal(await tools.isVisible(), false, 'Controls must start collapsed');
  const initial = await launcher.boundingBox();
  assert.equal(initial.width, 36);
  assert(initial.y + initial.height < (await page.locator('textarea').boundingBox()).y);
  await page.locator('#model').click(); await page.locator('#stop').click();
  assert.equal(await page.evaluate(() => window.modelClicks), 1);
  assert.equal(await page.evaluate(() => window.stopClicks), 1);

  await launcher.click(); assert.equal(await tools.isVisible(), true);
  await host.getByRole('button', { name: '切换Q版人物' }).click();
  assert.equal(await page.evaluate(() => globalThis.__gptMoonGarden.settings.character), 'chibi');
  await host.getByRole('button', { name: '切换背景氛围' }).click();
  assert.equal(await page.evaluate(() => globalThis.__gptMoonGarden.settings.mood), 'night');
  await host.getByRole('button', { name: '折叠外观设置' }).click();
  assert.equal(await tools.isVisible(), false);

  async function drag(dx, dy) {
    const box = await launcher.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + dx, box.y + box.height / 2 + dy, { steps: 10 }); await page.mouse.up();
  }
  await drag(-300, -140);
  const moved = await launcher.boundingBox();
  assert(Math.abs(moved.x - (initial.x - 300)) < 1);
  assert(Math.abs(moved.y - (initial.y - 140)) < 1);
  assert.equal(await tools.isVisible(), false, 'Dragging must not open controls');
  await page.evaluate(payload.expression);
  const reloaded = await launcher.boundingBox();
  assert.equal(reloaded.x, moved.x); assert.equal(reloaded.y, moved.y);
  assert.equal(await host.count(), 1, 'Hot reload must not duplicate the toolbar');
  await launcher.click(); await page.locator('#model').click();
  assert.equal(await tools.isVisible(), false, 'Clicking native UI must collapse controls without blocking the native click');
  assert.equal(await page.evaluate(() => window.modelClicks), 2);
  await launcher.focus(); await launcher.press('ArrowLeft');
  assert.equal((await launcher.boundingBox()).x, reloaded.x - 16);
  await launcher.press('Enter'); assert.equal(await tools.isVisible(), true);
  await page.keyboard.press('Escape'); assert.equal(await tools.isVisible(), false);
  assert.equal(await launcher.evaluate(el => el === el.getRootNode().activeElement), true);

  await drag(2000, 2000);
  let box = await launcher.boundingBox();
  assert(box.x + box.width <= 1280 - 12);
  assert(box.y + box.height <= (await page.locator('textarea').boundingBox()).y - 12);
  await page.setViewportSize({ width: 320, height: 600 });
  await launcher.click();
  const panel = await tools.boundingBox(); box = await launcher.boundingBox();
  assert(panel.x >= 12 && panel.x + panel.width <= 308);
  assert(panel.y >= 12 && panel.y + panel.height <= (await page.locator('textarea').boundingBox()).y - 12);
  assert(box.x >= 12 && box.x + box.width <= 308);
  await page.locator('#stop').click(); assert.equal(await tools.isVisible(), false);
  await page.locator('textarea').evaluate(el => el.style.height = '220px');
  await page.waitForFunction(() => {
    const entry = document.getElementById('gpt-moon-garden-live').shadowRoot.querySelector('.launcher').getBoundingClientRect();
    return entry.bottom <= document.querySelector('textarea').getBoundingClientRect().top - 12;
  });
  if (process.env.MOON_GARDEN_TOOLBAR_SCREENSHOT) {
    await page.setViewportSize({ width: 1280, height: 850 });
    await page.screenshot({ path: process.env.MOON_GARDEN_TOOLBAR_SCREENSHOT });
  }
  assert.equal(await page.locator('textarea').inputValue(), 'Unsent draft.');
  assert.equal(await page.locator('#conversation').textContent(), 'Existing conversation.');
  await launcher.click(); await host.getByRole('button', { name: '恢复默认界面' }).click();
  assert.equal(await host.count(), 0);
  assert.equal(await page.locator('#gpt-moon-garden-live-native').count(), 0);
  assert.deepEqual(errors, []);
  console.log('Toolbar browser checks passed: collapsed entry, native model/stop clicks, dragging, saved position, keyboard, resize, growing composer, narrow window, hot reload and restore.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
