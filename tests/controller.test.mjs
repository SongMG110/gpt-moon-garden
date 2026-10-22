import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createController, buildPayload } from '../scripts/controller.mjs';
import { DEFAULTS } from '../scripts/lib/config.mjs';

test('local manager rejects cross-origin mutations and cannot apply without a host',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'moon-manager-test-'));const fake=http.createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.end('[]');});await new Promise(r=>fake.listen(0,'127.0.0.1',r));
 const app=await createController({port:0,dataDir:dir,interval:60000,endpoint:`http://127.0.0.1:${fake.address().port}`});
 t.after(async()=>{await app.close();await new Promise(r=>fake.close(r));await fs.rm(dir,{recursive:true,force:true});});
 const initial=await fetch(app.url+'/api/status').then(r=>r.json());assert.equal(initial.config.enabled,false);
 const html=await fetch(app.url).then(r=>r.text());const token=html.match(/const token='([a-f0-9]+)'/)[1];
 const post=(route,body={},extra={})=>fetch(app.url+route,{method:'POST',headers:{'Content-Type':'application/json',Origin:app.url,'X-Moon-Token':token,...extra},body:JSON.stringify(body)});
 assert.equal((await post('/api/config',{mood:'night'},{Origin:'https://evil.example'})).status,403);
 assert.equal((await post('/api/config',{mood:'night'},{'X-Moon-Token':'wrong'})).status,403);
 assert.equal((await post('/api/config',{mood:'night',character:'chibi'})).status,200);
 assert.equal((await post('/api/config',{enabled:true})).status,400);
 assert.equal((await post('/api/apply')).status,400);
 let next=await fetch(app.url+'/api/status').then(r=>r.json());assert.equal(next.config.enabled,false);assert.equal(next.config.character,'chibi');
 assert.equal((await post('/api/restore')).status,200);
 assert.equal((await fetch(app.url+'/assets/../../package.json')).status,404);
 const invalidHost=await new Promise((resolve,reject)=>{const request=http.get(app.url+'/api/status',{headers:{Host:'evil.example'}},res=>{res.resume();resolve(res.statusCode);});request.on('error',reject);});
 assert.equal(invalidHost,403);
});
test('changed artwork/renderer is detected by revision and generates self-contained payload',async t=>{
 const payload=await buildPayload(DEFAULTS);assert.match(payload.revision,/^[a-f0-9]{16}$/);assert.ok(!payload.expression.includes('__PAYLOAD__'));assert.match(payload.expression,/data:image\/webp;base64,/);assert.ok(payload.expression.length<1000000);
 const changed=await buildPayload({...DEFAULTS,character:'chibi'});assert.equal(changed.revision,payload.revision);assert.notEqual(changed.expression,payload.expression);
 const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'moon-revision-test-'));t.after(()=>fs.rm(temporary,{recursive:true,force:true}));
 const root=path.resolve(import.meta.dirname,'..');await fs.cp(path.join(root,'assets'),path.join(temporary,'assets'),{recursive:true});await fs.mkdir(path.join(temporary,'renderer'));const source=await fs.readFile(path.join(root,'renderer','skin.js'),'utf8');await fs.writeFile(path.join(temporary,'renderer','skin.js'),source+'\n/* revised local renderer */\n');
 const reloaded=await buildPayload(DEFAULTS,temporary);assert.notEqual(reloaded.revision,payload.revision);assert.match(reloaded.expression,/revised local renderer/);
});
