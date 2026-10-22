import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let fragment = await fs.readFile(path.join(root, 'src', 'preview.html'), 'utf8');
for (const key of ['background', 'portrait', 'chibi']) {
  const bytes = await fs.readFile(path.join(root, 'assets', key + '.webp'));
  fragment = fragment.replaceAll('__' + key.toUpperCase() + '__', 'data:image/webp;base64,' + bytes.toString('base64'));
}
// The standalone preview needs no network, host-only widget APIs, or icon library.
const icons = {'messages-square':'◇','square-pen':'＋','folder':'▱','sparkles':'✧','moon-star':'☾','lightbulb':'♧','code-2':'‹›','arrow-up':'↑'};
fragment = fragment.replace(/<i data-lucide="([^"]+)" aria-hidden="true"><\/i>/g,(_,name)=>`<span aria-hidden="true">${icons[name]||'·'}</span>`);
const bridge = `window.addEventListener('message',event=>{if(event.origin!==location.origin||event.data?.type!=='moon-garden-config')return;const c=event.data.config||{};if(['portrait','chibi'].includes(c.character))state.style=c.character;if(['day','night'].includes(c.mood))state.mood=c.mood;if(typeof c.size==='number')state.size=Math.min(130,Math.max(55,c.size));if(typeof c.artwork==='number')state.artwork=Math.min(100,Math.max(0,c.artwork));if(typeof c.petVisible==='boolean')state.visible=c.petVisible;render();});\n`;
fragment = fragment.replace('render();\nif(globalThis.Tweak)',bridge+'render();\nif(globalThis.Tweak)');
await fs.mkdir(path.join(root, 'preview'), {recursive:true});
await fs.writeFile(path.join(root, 'preview', 'index.html'), `<!doctype html>\n<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GPT娘 · 月白云庭预览</title><style>body{margin:0;padding:16px;background:#f0edf7}button{cursor:pointer}#gpt-moon-garden{max-width:1200px;margin:0 auto}.cursor-interaction{cursor:pointer!important}</style></head><body>\n${fragment}\n</body></html>\n`);
const iconImage=(await fs.readFile(path.join(root,'assets','chibi.webp'))).toString('base64');
await fs.writeFile(path.join(root,'assets','icon.svg'),`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" rx="52" fill="#ece5f5"/><circle cx="128" cy="132" r="100" fill="#f8f5fc"/><image href="data:image/webp;base64,${iconImage}" x="42" y="10" width="172" height="238"/></svg>`);
console.log('Built preview/index.html');
