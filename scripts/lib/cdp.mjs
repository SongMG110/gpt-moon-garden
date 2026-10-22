export function validateEndpoint(value){
  const url=new URL(value);
  if(url.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(url.hostname)||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw new Error('CDP endpoint must be a plain loopback HTTP origin');
  return url.origin;
}
export function isHostTarget(t){return t.type==='page'&&typeof t.url==='string'&&t.url.startsWith('app://')&&!/devtools/i.test(t.url);}
export async function listTargets(endpoint){
 const origin=validateEndpoint(endpoint);const res=await fetch(origin+'/json/list',{signal:AbortSignal.timeout(2000),redirect:'error'});
 if(!res.ok)throw new Error(`CDP HTTP ${res.status}`);const targets=await res.json();if(!Array.isArray(targets))throw new Error('Invalid CDP target list');
 return targets.filter(isHostTarget).map(t=>{const ws=new URL(t.webSocketDebuggerUrl);if(ws.protocol!=='ws:'||!['127.0.0.1','localhost','[::1]'].includes(ws.hostname)||ws.port!==new URL(origin).port)throw new Error('CDP target is not on the expected loopback port');return {id:t.id,title:t.title,url:t.url,webSocketDebuggerUrl:ws.href};});
}
export class CdpSession{
 constructor(url){this.url=url;this.sequence=0;this.pending=new Map();this.closed=false;}
 async connect(){
  this.socket=new WebSocket(this.url);
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('CDP connection timeout')),2500);this.socket.addEventListener('open',()=>{clearTimeout(timer);resolve();},{once:true});this.socket.addEventListener('error',()=>{clearTimeout(timer);reject(new Error('CDP connection failed'));},{once:true});});
  this.socket.addEventListener('message',e=>{try{const msg=JSON.parse(String(e.data));const pending=this.pending.get(msg.id);if(!pending)return;this.pending.delete(msg.id);clearTimeout(pending.timer);msg.error?pending.reject(new Error(msg.error.message)):pending.resolve(msg.result);}catch{}});
  this.socket.addEventListener('close',()=>{this.closed=true;for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(new Error('CDP disconnected'));}this.pending.clear();});return this;
 }
 async call(method,params={}){if(this.closed||this.socket.readyState!==WebSocket.OPEN)throw new Error('CDP session closed');const id=++this.sequence;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{this.pending.delete(id);reject(new Error('CDP command timeout'));},4000);this.pending.set(id,{resolve,reject,timer});this.socket.send(JSON.stringify({id,method,params}));});}
 async evaluate(expression){const result=await this.call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.text||'Renderer error');return result.result?.value;}
 close(){this.closed=true;this.socket?.close();for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(new Error('CDP session closed'));}this.pending.clear();}
}
