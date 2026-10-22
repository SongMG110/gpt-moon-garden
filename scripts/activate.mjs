import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { ensureManager, health, managerAction, ROOT } from './service.mjs';
import { listTargets, validateEndpoint } from './lib/cdp.mjs';

async function ready(endpoint) { try { return (await listTargets(endpoint)).length > 0; } catch { return false; } }
async function main() {
  const manager = await ensureManager();
  console.log(`Manager is running: ${manager.url}`);
  const endpoint = validateEndpoint(process.env.MOON_GARDEN_CDP || 'http://127.0.0.1:9335');
  if (!await ready(endpoint)) {
    if (process.platform !== 'win32') throw new Error('Enable a loopback CDP endpoint before applying on this platform. See docs/INSTALL.md.');
    const args = ['-NoProfile', '-File', path.join(ROOT, 'scripts/launch-codex.ps1'), '-Port', new URL(endpoint).port || '80'];
    const appIndex = process.argv.indexOf('--app-path');
    if (appIndex >= 0 && process.argv[appIndex + 1]) args.push('-AppPath', process.argv[appIndex + 1]);
    const launch = spawnSync('powershell.exe', args, { encoding: 'utf8', windowsHide: true });
    if (launch.stdout) console.log(launch.stdout.trim());
    if (launch.status !== 0) {
      if (launch.stderr) console.error(launch.stderr.trim());
      console.error('No app was stopped. Use File > Quit to close Codex normally, then run Enable.cmd again.');
      process.exitCode = launch.status || 1; return;
    }
    console.log('Waiting for the Codex workspace (up to 90 seconds)...');
    let connected = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      if (await ready(endpoint)) { connected = true; break; }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    if (!connected) throw new Error('Codex did not expose a supported app:// workspace. No theme was applied. Check the manager diagnostics.');
  }
  const result = await managerAction('/api/apply');
  if (!result.status?.applied) throw new Error(result.status?.message || 'No workspace was updated');
  console.log(`Theme applied to ${result.status.applied} workspace(s).`);
  console.log(`You can close this console. The independent manager remains at ${manager.url}`);
  const current = await health(manager.url); if (!current?.config.enabled) throw new Error('Activation could not be verified');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
