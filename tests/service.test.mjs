import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

test('manager survives launcher exit and a second start reuses it',async t=>{
  const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'moon-service-test-'));
  let pid;
  t.after(async()=>{if(pid){try{process.kill(pid,'SIGTERM');}catch{}await new Promise(resolve=>setTimeout(resolve,250));}await fs.rm(temporary,{recursive:true,force:true});});
  const reservation=http.createServer();await new Promise(resolve=>reservation.listen(0,'127.0.0.1',resolve));const port=reservation.address().port;await new Promise(resolve=>reservation.close(resolve));
  const root=path.resolve(import.meta.dirname,'..');
  const pkg=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
  const options={cwd:root,encoding:'utf8',timeout:12000,env:{...process.env,MOON_GARDEN_PORT:String(port),MOON_GARDEN_DATA_DIR:temporary,MOON_GARDEN_CDP:'http://127.0.0.1:1'}};
  const first=spawnSync(process.execPath,['scripts/service.mjs'],options);
  assert.equal(first.status,0,first.stderr||first.stdout);const started=JSON.parse(first.stdout.trim());pid=started.pid;assert.ok(pid);assert.equal(started.alreadyRunning,false);
  await new Promise(resolve=>setTimeout(resolve,300));
  const status=await fetch(started.url+'/api/status').then(response=>response.json());assert.equal(status.version,pkg.version);assert.equal(status.config.enabled,false);
  const second=spawnSync(process.execPath,['scripts/service.mjs'],options);assert.equal(second.status,0,second.stderr);assert.equal(JSON.parse(second.stdout.trim()).alreadyRunning,true);
  const stillRunning=await fetch(started.url+'/api/status');assert.equal(stillRunning.status,200);
});
