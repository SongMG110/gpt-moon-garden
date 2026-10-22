import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DEFAULTS, readConfig, validateConfig, writeConfig } from './lib/config.mjs';
import { CdpSession, listTargets, validateEndpoint } from './lib/cdp.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const dataDirectory = () => process.env.MOON_GARDEN_DATA_DIR || path.join(process.env.LOCALAPPDATA || process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'GPTMoonGarden');
export function readableError(error) {
  if (error.message === 'fetch failed' || ['ECONNREFUSED', 'ETIMEDOUT'].includes(error.cause?.code)) {
    return '管理器正常运行，但 Codex 尚未开启本机连接。请用“文件 → 退出”正常关闭客户端，再运行 Enable.cmd 一键启动并应用。';
  }
  return error.message;
}
export async function buildPayload(config, root = ROOT) {
  const images = {};
  const hash = crypto.createHash('sha256');
  for (const name of ['background', 'portrait', 'chibi']) {
    const bytes = await fs.readFile(path.join(root, 'assets', name + '.webp'));
    images[name] = 'data:image/webp;base64,' + bytes.toString('base64'); hash.update(bytes);
  }
  const source = await fs.readFile(path.join(root, 'renderer', 'skin.js'), 'utf8'); hash.update(source);
  const revision = hash.digest('hex').slice(0, 16);
  return { revision, source, expression: source.replace('__PAYLOAD__', () => JSON.stringify({ config: validateConfig(config), images, revision })) };
}

export async function createController(options = {}) {
  const root = options.root || ROOT;
  const configFile = path.join(options.dataDir || dataDirectory(), 'settings.json');
  const endpoint = validateEndpoint(options.endpoint || process.env.MOON_GARDEN_CDP || 'http://127.0.0.1:9335');
  const token = crypto.randomBytes(24).toString('hex');
  let config = await readConfig(configFile);
  let status = { connected: false, targets: 0, applied: 0, message: '尚未连接；打开管理页后可检查。', revision: null };
  const sessions = new Map();
  let queue = Promise.resolve();
  let stopped = false;
  const serialized = operation => { const next = queue.then(operation); queue = next.catch(() => {}); return next; };
  async function save(next) { config = await writeConfig(configFile, next); return config; }
  async function connectTargets() {
    const targets = await listTargets(endpoint);
    status.connected = targets.length > 0; status.targets = targets.length;
    const ids = new Set(targets.map(t => t.id));
    for (const [id, session] of sessions) if (!ids.has(id) || session.closed) { session.close(); sessions.delete(id); }
    return targets;
  }
  async function applyToTargets(force = false) {
    const targets = await connectTargets();
    if (!targets.length) throw new Error('调试接口可访问，但没有找到 Codex/ChatGPT app:// 工作区。');
    const payload = await buildPayload(config, root);
    let applied = 0;
    for (const target of targets) {
      let session = sessions.get(target.id);
      if (!session || session.closed) { session = await new CdpSession(target.webSocketDebuggerUrl).connect(); sessions.set(target.id, session); }
      if (!force && session.revision === payload.revision) {
        const own = await session.evaluate('globalThis.__gptMoonGarden ? {settings:globalThis.__gptMoonGarden.settings,revision:globalThis.__gptMoonGarden.revision} : null');
        if (own?.settings?.enabled === false) { await save({ ...config, enabled: false }); await restoreTargets(); return; }
        if (own?.settings) {
          const valid = validateConfig(own.settings);
          if (JSON.stringify(valid) !== JSON.stringify(config)) { await save(valid); force = true; }
          else { applied++; continue; }
        }
      }
      const currentPayload = force ? await buildPayload(config, root) : payload;
      const result = await session.evaluate(currentPayload.expression);
      if (result?.applied) { applied++; session.revision = payload.revision; }
    }
    status.applied = applied; status.revision = payload.revision;
    status.message = applied ? '已应用；素材和样式变化会实时更新。' : '未找到支持的聊天表面，未修改界面。';
    if (!applied) throw new Error(status.message);
  }
  async function restoreTargets() {
    for (const session of sessions.values()) {
      try { await session.evaluate('(()=>{const p=globalThis.__gptMoonGarden;if(p){p.settings.enabled=false;p.cleanup();}return {restored:true};})()'); } catch {}
      session.revision = null;
    }
    status.applied = 0; status.message = '已停用；已连接页面中的插件样式和人物已移除。';
  }
  async function tick() {
    if (stopped) return;
    try { if (config.enabled) await applyToTargets(); else await connectTargets(); }
    catch (e) { status.connected = false; status.applied = 0; status.message = readableError(e); }
  }
  const server = http.createServer(async (req, res) => {
    const address = server.address();
    const origin = `http://127.0.0.1:${address.port}`;
    const headers = { 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'" };
    const send = (code, body, type = 'application/json; charset=utf-8') => { res.writeHead(code, { ...headers, 'Content-Type': type }); res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body)); };
    try {
      if (req.headers.host !== new URL(origin).host) return send(403, { error: 'Invalid host' });
      const url = new URL(req.url, origin);
      if (req.method === 'POST') {
        if (req.headers.origin !== origin || req.headers['x-moon-token'] !== token) return send(403, { error: 'Invalid request origin or token' });
        if (!['/api/config', '/api/apply', '/api/restore', '/api/check'].includes(url.pathname)) return send(404, { error: 'Not found' });
        let text = ''; for await (const chunk of req) { text += chunk; if (Buffer.byteLength(text) > 8192) return send(413, { error: 'Request too large' }); }
        const body = text ? JSON.parse(text) : {};
        await serialized(async () => {
          if (url.pathname === '/api/config') {
            if ('enabled' in body) throw new Error('Use Apply or Restore to change the enabled state');
            await save({ ...config, ...validateConfig(body, { partial: true }) }); if (config.enabled) await applyToTargets(true);
          }
          if (url.pathname === '/api/apply') {
            // Discover the endpoint before recording an enabled state.
            const targets = await connectTargets(); if (!targets.length) throw new Error('没有可用的 Codex 工作区，请先按说明启用本机调试接口。');
            const previous = { ...config };
            try { await save({ ...config, enabled: true }); await applyToTargets(true); }
            catch (e) { await restoreTargets(); await save({ ...previous, enabled: false }); throw e; }
          }
          if (url.pathname === '/api/restore') { await save({ ...config, enabled: false }); await restoreTargets(); }
          if (url.pathname === '/api/check') await tick();
        });
        return send(200, { config, status });
      }
      if (req.method !== 'GET') return send(405, { error: 'Method not allowed' });
      if (url.pathname === '/api/status') return send(200, { config, status, endpoint, version: '0.1.2', service: { mode: process.env.MOON_GARDEN_SERVICE || 'process' } });
      if (url.pathname === '/') {
        const template = await fs.readFile(path.join(root, 'manager', 'index.html'), 'utf8');
        return send(200, template.replace('__CSRF_TOKEN__', token), 'text/html; charset=utf-8');
      }
      if (url.pathname === '/preview' || url.pathname === '/preview/') {
        headers['Content-Security-Policy'] = headers['Content-Security-Policy'].replace("frame-ancestors 'none'", "frame-ancestors 'self'");
        return send(200, await fs.readFile(path.join(root, 'preview', 'index.html')), 'text/html; charset=utf-8');
      }
      if (/^\/assets\/(background|portrait|chibi)\.webp$/.test(url.pathname)) return send(200, await fs.readFile(path.join(root, url.pathname.slice(1))), 'image/webp');
      return send(404, { error: 'Not found' });
    } catch (e) { status.message = readableError(e); send(400, { error: status.message, config, status }); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(options.port ?? Number(process.env.MOON_GARDEN_PORT || 46321), '127.0.0.1', resolve); });
  const timer = setInterval(() => serialized(tick), options.interval ?? 2500); timer.unref();
  return {
    server, url: `http://127.0.0.1:${server.address().port}`,
    close: async () => { stopped = true; clearInterval(timer); await queue; for (const session of sessions.values()) session.close(); await new Promise(resolve => server.close(resolve)); },
    inspect: () => ({ config: { ...config }, status: { ...status } }),
  };
}

async function main() {
  if (process.argv.includes('--doctor')) {
    try { const endpoint = validateEndpoint(process.env.MOON_GARDEN_CDP || 'http://127.0.0.1:9335'); const targets = await listTargets(endpoint); console.log(JSON.stringify({ node: process.versions.node, endpoint, workspaces: targets.length, ready: targets.length > 0 }, null, 2)); }
    catch (e) { console.log(JSON.stringify({ ready: false, message: e.message, next: 'See docs/INSTALL.md. The app will not be restarted.' }, null, 2)); process.exitCode = 2; }
    return;
  }
  if (!process.argv.includes('--foreground')) {
    const { ensureManager } = await import('./service.mjs');
    const service = await ensureManager();
    console.log(`GPT娘 · 月白云庭: ${service.url}\nIndependent manager started. Installation alone does not apply the skin.`);
    return;
  }
  const app = await createController();
  console.log(`GPT娘 · 月白云庭: ${app.url}\nPreview only until you click Apply. No host restart or app-file modification is performed.`);
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { await app.close(); process.exit(0); });
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch(e => { console.error(e.message); process.exitCode = 1; });
