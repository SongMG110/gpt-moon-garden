import fs from 'node:fs/promises';
import path from 'node:path';
export const DEFAULTS=Object.freeze({version:1,enabled:false,character:'portrait',displayMode:'2d',material:'pbr',mood:'day',size:100,artwork:70,petVisible:true,motion:true,side:'right'});
export function validateConfig(value,{partial=false}={}){
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Configuration must be an object');
  const out=partial?{}:{...DEFAULTS};
  const enums={character:['portrait','chibi'],displayMode:['2d','3d'],material:['pbr','texture'],mood:['day','night'],side:['left','right']};
  for(const [key,v]of Object.entries(value)){
    if(!(key in DEFAULTS))throw new Error(`Unknown setting: ${key}`);
    if(key==='version'){if(v!==1)throw new Error('Unsupported configuration version');out.version=1;}
    else if(key in enums){if(!enums[key].includes(v))throw new Error(`Invalid ${key}`);out[key]=v;}
    else if(['enabled','petVisible','motion'].includes(key)){if(typeof v!=='boolean')throw new Error(`Invalid ${key}`);out[key]=v;}
    else{const limits=key==='size'?[55,130]:[0,100];if(typeof v!=='number'||!Number.isFinite(v)||v<limits[0]||v>limits[1])throw new Error(`Invalid ${key}`);out[key]=v;}
  }
  return out;
}
export async function readConfig(file){try{return validateConfig(JSON.parse(await fs.readFile(file,'utf8')));}catch(e){if(e.code==='ENOENT')return {...DEFAULTS};throw e;}}
export async function writeConfig(file,config){const valid=validateConfig(config);await fs.mkdir(path.dirname(file),{recursive:true});const temp=file+'.tmp';await fs.writeFile(temp,JSON.stringify(valid,null,2)+'\n',{mode:0o600});await fs.rename(temp,file);return valid;}
