import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataRoot = process.env.MOON_GARDEN_DATA_DIR || path.join(process.env.LOCALAPPDATA || process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'GPTMoonGarden');
const runtime = path.join(dataRoot, 'app');
const contents = ['vendor','models','scripts','manager','renderer','theme','assets','preview','skills','docs','package.json','plugin.json','.codex-plugin','README.md','ASSETS.md','LICENSE','Start.cmd','Enable.cmd'];

async function main() {
  if (Number(process.versions.node.split('.')[0]) < 22) throw new Error('Node.js 22+ is required');
  if (process.platform !== 'win32') throw new Error('This setup routine currently supports Windows. Use npm start on other systems.');
  await fs.mkdir(runtime, { recursive: true });
  if (source !== runtime) for (const name of contents) await fs.cp(path.join(source,name),path.join(runtime,name),{recursive:true,force:true});
  let modelsReady=false;
  if(!process.argv.includes('--skip-models')){const download=spawnSync(process.execPath,[path.join(runtime,'scripts/install-models.mjs')],{stdio:'inherit',windowsHide:true});modelsReady=download.status===0;if(!modelsReady)console.error('3D models could not be installed; 2D remains available. Retry install-models.mjs.');}
  const setup=spawnSync('powershell.exe',['-NoProfile','-File',path.join(runtime,'scripts/register-manager-task.ps1'),'-RuntimeRoot',runtime,'-NodePath',process.execPath],{encoding:'utf8',windowsHide:true});
  if(setup.status!==0)throw new Error((setup.stderr||setup.stdout||'Windows could not register the manager task. No privileges or protection settings were changed.').trim());
  await fs.writeFile(path.join(dataRoot,'service.json'),JSON.stringify({transport:'task-scheduler',taskName:'GPTMoonGarden.Manager',runtime,nodePath:process.execPath},null,2)+'\n');
  const {health,managerOrigin}=await import('./service.mjs');
  const expectedVersion=JSON.parse(await fs.readFile(path.join(runtime,'package.json'),'utf8')).version;
  let status;
  for(let i=0;i<45;i++){status=await health();if(status?.version===expectedVersion)break;await new Promise(resolve=>setTimeout(resolve,200));}
  if(status?.version!==expectedVersion)throw new Error(`The updated manager is not ready. See ${path.join(dataRoot,'controller-error.log')}`);
  const shortcut=spawnSync('powershell.exe',['-NoProfile','-File',path.join(runtime,'scripts/create-shortcut.ps1'),'-RuntimeRoot',runtime],{encoding:'utf8',windowsHide:true});
  console.log(JSON.stringify({configured:true,modelsReady,version:status.version,runtime,manager:managerOrigin(),shortcut:shortcut.status===0?shortcut.stdout.trim():'Shortcut creation failed; use Launch-installed.cmd.',hostConnected:status.status.connected,applied:status.status.applied,next:status.status.applied?'Theme is active.':'After closing Codex normally, use the GPT Moon Garden desktop shortcut.'},null,2));
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
