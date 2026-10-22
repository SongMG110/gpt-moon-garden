import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const pkg=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
const dist=path.join(root,'dist');await fs.mkdir(dist,{recursive:true});
const artifact=path.join(dist,`gpt-moon-garden-v${pkg.version}.zip`);
// Package only maintained, public distribution files. Never include .git or local state.
const names=['package.json','plugin.json','.codex-plugin','.agents','skills','assets','theme','renderer','manager','scripts','src','preview','docs','tests','Start.cmd','Enable.cmd','Setup.cmd','Launch-installed.cmd','README.md','LICENSE','ASSETS.md','CHANGELOG.md'];
const child=spawnSync(process.execPath,['--input-type=module','-e',"import('./scripts/build.mjs')"],{cwd:root,stdio:'inherit'});if(child.status!==0)process.exit(child.status||1);
if(process.platform==='win32'){
 const quote=s=>"'"+s.replaceAll("'","''")+"'";
 const command=`$ErrorActionPreference='Stop'; Compress-Archive -LiteralPath @(${names.map(n=>quote(path.join(root,n))).join(',')}) -DestinationPath ${quote(artifact)} -Force`;
 const result=spawnSync('powershell.exe',['-NoProfile','-Command',command],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);
}else{
 const result=spawnSync('zip',['-r',artifact,...names],{cwd:root,stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);
}
console.log(artifact);
