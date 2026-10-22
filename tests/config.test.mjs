import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import { DEFAULTS, validateConfig, readConfig, writeConfig } from '../scripts/lib/config.mjs';
import { validateEndpoint, isHostTarget, listTargets } from '../scripts/lib/cdp.mjs';

test('configuration rejects arbitrary code/URLs, bad enums and invalid bounds',()=>{
 for(const input of [{character:'evil'},{mood:'system'},{size:NaN},{size:0},{size:1000},{artwork:101},{artwork:-1},{enabled:'yes'},{css:'body{}'},{assetUrl:'https://example.com/x'},{version:2},null,[]]) assert.throws(()=>validateConfig(input));
 assert.deepEqual(validateConfig({character:'chibi',size:75},{partial:true}),{character:'chibi',size:75});
});
test('settings persist independently of application or installation files',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'moon-garden-test-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));const file=path.join(dir,'settings.json');
 assert.deepEqual(await readConfig(file),DEFAULTS);await writeConfig(file,{...DEFAULTS,mood:'night',character:'chibi'});assert.equal((await readConfig(file)).mood,'night');
 await writeConfig(file,{...DEFAULTS,size:90});assert.equal((await readConfig(file)).size,90);
});
test('CDP accepts loopback origins only, rejects credentials/path/redirects and arbitrary pages',async()=>{
 for(const value of ['https://127.0.0.1:9335','http://example.com:9335','http://0.0.0.0:9335','http://127.0.0.1:9335/foo','http://user:pass@localhost:9335','http://127.0.0.1:9335/?x=y'])assert.throws(()=>validateEndpoint(value));
 assert.equal(validateEndpoint('http://127.0.0.1:9335'),'http://127.0.0.1:9335');
 assert.equal(isHostTarget({type:'page',url:'app://codex/index.html'}),true);
 for(const target of [{type:'page',url:'https://github.com'},{type:'service_worker',url:'app://x'},{type:'page',url:'devtools://devtools'}])assert.equal(isHostTarget(target),false);
});
