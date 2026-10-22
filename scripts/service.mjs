import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function managerOrigin() {
  const port = Number(process.env.MOON_GARDEN_PORT || 46321);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid manager port');
  return `http://127.0.0.1:${port}`;
}
export async function health(origin = managerOrigin()) {
  try {
    const response = await fetch(origin + '/api/status', { signal: AbortSignal.timeout(1000), redirect: 'error' });
    if (!response.ok) return null;
    const data = await response.json();
    return data.version && data.config && data.status ? data : null;
  } catch { return null; }
}
export async function ensureManager() {
  const url = managerOrigin();
  if (await health(url)) return { url, alreadyRunning: true };
  const dataDir = process.env.MOON_GARDEN_DATA_DIR || path.join(process.env.LOCALAPPDATA || process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'GPTMoonGarden');
  fs.mkdirSync(dataDir, { recursive: true });
  let service;
  try { service = JSON.parse(fs.readFileSync(path.join(dataDir, 'service.json'), 'utf8')); } catch {}
  if (process.platform === 'win32' && service?.transport === 'task-scheduler' && service.taskName === 'GPTMoonGarden.Manager') {
    const result = spawnSync('powershell.exe', ['-NoProfile', '-Command', "Start-ScheduledTask -TaskName 'GPTMoonGarden.Manager' -ErrorAction Stop"], { encoding: 'utf8', windowsHide: true });
    if (result.status !== 0) throw new Error((result.stderr || 'Could not start the configured Windows manager task. Run Setup.cmd again.').trim());
    for (let attempt = 0; attempt < 45; attempt++) {
      if (await health(url)) return { url, scheduler: true, alreadyRunning: false };
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    throw new Error(`The manager task did not become ready. See ${path.join(dataDir, 'controller-error.log')}`);
  }
  const stdout = fs.openSync(path.join(dataDir, 'controller.log'), 'a');
  const stderr = fs.openSync(path.join(dataDir, 'controller-error.log'), 'a');
  let child;
  try {
    child = spawn(process.execPath, [path.join(ROOT, 'scripts/controller.mjs'), '--foreground'], {
      cwd: ROOT, detached: true, windowsHide: true, stdio: ['ignore', stdout, stderr], env: { ...process.env },
    });
    await new Promise((resolve, reject) => { child.once('spawn', resolve); child.once('error', reject); });
    child.unref();
  } finally { fs.closeSync(stdout); fs.closeSync(stderr); }
  for (let attempt = 0; attempt < 32; attempt++) {
    if (await health(url)) return { url, pid: child.pid, alreadyRunning: false };
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error(`Manager did not start. See ${path.join(dataDir, 'controller-error.log')}`);
}
export async function managerAction(route, body = {}, origin = managerOrigin()) {
  if (!['/api/apply', '/api/restore', '/api/check', '/api/config'].includes(route)) throw new Error('Unknown manager action');
  const html = await fetch(origin, { signal: AbortSignal.timeout(2000), redirect: 'error' }).then(response => response.text());
  const token = html.match(/const token='([a-f0-9]+)'/)?.[1];
  if (!token) throw new Error('Manager request token unavailable');
  const response = await fetch(origin + route, {
    method: 'POST', headers: { Origin: origin, 'X-Moon-Token': token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(15000), redirect: 'error',
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Manager action failed');
  return result;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  ensureManager().then(result => console.log(JSON.stringify(result))).catch(error => { console.error(error.message); process.exitCode = 1; });
}
