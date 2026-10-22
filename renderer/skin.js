/* Executed only after the user presses Apply. All images are local data URLs. */
(function mountMoonGarden(payload) {
  const KEY = '__gptMoonGarden';
  const ID = 'gpt-moon-garden-live';
  const old = globalThis[KEY];
  const main = document.querySelector('main, [role="main"]');
  const composer = document.querySelector('[contenteditable="true"], textarea');
  if (!main && !composer) return { applied: false, reason: 'No supported workspace surface found' };
  const settings = { ...payload.config };
  old?.cleanup?.();
  document.getElementById(ID)?.remove();
  document.getElementById(ID + '-native')?.remove();

  const host = document.createElement('div');
  host.id = ID;
  Object.assign(host.style, { position: 'fixed', inset: '0', zIndex: '2147480000', pointerEvents: 'none' });
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = `
    :host{--ink:#413a52;--muted:#726883;--panel:#f9f7ff;--line:#ddd5ec;--accent:#8c78ae;font:13px/1.5 'Segoe UI','Microsoft YaHei',sans-serif;color:var(--ink)}
    :host([data-mood=night]){--ink:#f0eafd;--muted:#c5b8da;--panel:#30283f;--line:#5c4d70;--accent:#b9a2df}
    *{box-sizing:border-box}button{font:inherit;color:inherit;cursor:pointer}button:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
    .stage{position:absolute;right:24px;bottom:72px;width:220px;pointer-events:none;display:flex;align-items:center;flex-direction:column;transform-origin:bottom center}
    .pet{padding:0;border:0;background:transparent;pointer-events:auto;touch-action:none;cursor:grab;height:340px;width:100%;display:flex;align-items:flex-end;justify-content:center}
    .pet:active{cursor:grabbing}.pet img{width:100%;height:100%;object-fit:contain;object-position:center bottom;filter:drop-shadow(0 7px 14px #6c4f8b38);user-select:none;-webkit-user-drag:none}
    .pet img.chibi{height:72%}.caption{font-size:12px;letter-spacing:.15em;margin-top:5px;text-shadow:0 1px 8px var(--panel)}
    .bubble{padding:8px 12px;border:1px solid var(--line);background:var(--panel);border-radius:12px 12px 2px 12px;max-width:220px;margin-bottom:8px;box-shadow:0 5px 20px #30203f12;font-size:12px}
    .dock{position:absolute;right:24px;bottom:20px;pointer-events:auto;display:flex;gap:4px;padding:5px;border:1px solid var(--line);border-radius:12px;background:var(--panel);box-shadow:0 5px 24px #30203f15}
    .dock button{border:0;background:transparent;border-radius:7px;padding:6px 9px;font-size:12px;min-height:30px}
    .dock button.active{background:var(--line)}[hidden]{display:none!important}
    .greet{animation:moon-greet .65s ease-in-out}@keyframes moon-greet{35%{translate:0 -10px;rotate:-2deg}65%{translate:0 -3px;rotate:2deg}}
    @media(max-width:680px){.stage{width:115px;right:12px;bottom:100px}.pet{height:185px}.dock{right:10px;bottom:12px;max-width:calc(100vw - 20px);flex-wrap:wrap}.dock button{padding:5px 7px}.bubble{font-size:11px}}
    @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
  `;
  shadow.append(style);
  const stage = document.createElement('div');
  stage.className = 'stage';
  const bubble = document.createElement('div');
  bubble.className = 'bubble'; bubble.hidden = true; bubble.setAttribute('aria-live', 'polite');
  const pet = document.createElement('button');
  pet.type = 'button'; pet.className = 'pet'; pet.setAttribute('aria-label', '拖动或点击 GPT娘');
  const image = document.createElement('img'); image.alt = 'GPT娘'; image.draggable = false;
  pet.append(image);
  const caption = document.createElement('div'); caption.className = 'caption'; caption.textContent = 'GPT娘 · 月白云庭';
  stage.append(bubble, pet, caption);
  const dock = document.createElement('div'); dock.className = 'dock'; dock.setAttribute('role', 'group'); dock.setAttribute('aria-label', '月白云庭外观控制');
  const makeButton = (text, label, action) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = text; b.setAttribute('aria-label', label); b.addEventListener('click', action); dock.append(b); return b; };
  const portrait = makeButton('原画', '切换原画立绘', () => { settings.character = 'portrait'; render(); });
  const chibi = makeButton('Q版', '切换Q版人物', () => { settings.character = 'chibi'; render(); });
  const mood = makeButton('暮紫', '切换背景氛围', () => { settings.mood = settings.mood === 'day' ? 'night' : 'day'; render(); });
  const visibility = makeButton('收起', '收起或显示人物', () => { settings.petVisible = !settings.petVisible; render(); });
  makeButton('恢复', '恢复默认界面', () => { settings.enabled = false; cleanup(); });
  shadow.append(stage, dock);
  const native = document.createElement('style'); native.id = ID + '-native';
  document.documentElement.append(native);
  document.documentElement.append(host);
  let bubbleTimer, greetTimer, pointer = null, busy = false, observerTimer;
  const abort = new AbortController();
  let offset = { x: 0, y: 0 };
  try { const p = JSON.parse(localStorage.getItem('gpt-moon-garden-position') || 'null'); if (Number.isFinite(p?.x) && Number.isFinite(p?.y)) offset = p; } catch {}
  const clampPosition = () => {
    offset.x = Math.min(0, Math.max(-Math.max(0, innerWidth - 260), offset.x));
    offset.y = Math.min(0, Math.max(-Math.max(0, innerHeight - 440), offset.y));
    stage.style.translate = `${offset.x}px ${offset.y}px`;
  };
  function say(text) { clearTimeout(bubbleTimer); bubble.textContent = text; bubble.hidden = false; bubbleTimer = setTimeout(() => bubble.hidden = true, 3600); }
  function greet() { if (!settings.motion) return; clearTimeout(greetTimer); pet.classList.remove('greet'); void pet.offsetWidth; pet.classList.add('greet'); greetTimer = setTimeout(() => pet.classList.remove('greet'), 700); }
  function render() {
    host.dataset.mood = settings.mood;
    image.src = payload.images[settings.character]; image.className = settings.character;
    stage.hidden = !settings.petVisible;
    stage.style.transform = `scale(${settings.size / 100})`;
    portrait.classList.toggle('active', settings.character === 'portrait');
    chibi.classList.toggle('active', settings.character === 'chibi');
    portrait.setAttribute('aria-pressed', String(settings.character === 'portrait'));
    chibi.setAttribute('aria-pressed', String(settings.character === 'chibi'));
    mood.textContent = settings.mood === 'day' ? '暮紫' : '月白';
    visibility.textContent = settings.petVisible ? '收起' : '显示';
    const dark = settings.mood === 'night';
    const ink = dark ? '#eee8fa' : '#40394e';
    const bg = dark ? '#252034' : '#f5f2fa';
    const panel = dark ? '#30283f' : '#faf8ff';
    const sidebar = dark ? '#292338ed' : '#efebf5ed';
    const veil = dark ? .83 : .76;
    const art = settings.artwork / 100;
    document.documentElement.setAttribute('data-gpt-moon-garden', '');
    native.textContent = `
      html[data-gpt-moon-garden]{
        --background:${bg};--foreground:${ink};--card:${panel};--popover:${panel};--border:${dark ? '#51465f' : '#ddd5e9'};
        --color-token-bg-primary:${panel};--color-token-bg-secondary:${sidebar};--color-token-bg-tertiary:${dark ? '#352c46' : '#f4effa'};
        --color-token-text-primary:${ink};
        --color-token-text-secondary:${dark ? '#c5b8da' : '#6b5f7e'};
        --color-token-text-tertiary:${dark ? '#9a8db0' : '#a49ab3'};
        --color-token-main-surface-primary:transparent;--color-token-sidebar-surface-primary:${sidebar};
        --color-token-border:${dark ? '#51465f' : '#ddd5e9'};--color-token-border-light:${dark ? '#51465f' : '#ddd5e9'};
        background:${bg}!important;
      }
      html[data-gpt-moon-garden] body{
        color:${ink};background:linear-gradient(90deg,${dark ? `rgba(37,32,52,${veil})` : `rgba(245,242,250,${veil})`},${dark ? `rgba(37,32,52,${Math.max(.25,1-art)})` : `rgba(245,242,250,${Math.max(.12,1-art)})`}),url('${payload.images.background}') center/cover fixed!important;
      }
      html[data-gpt-moon-garden] :is(#root, main, [role="main"]){background-color:${dark ? 'rgba(31,26,44,0.42)' : 'rgba(255,255,255,0.10)'}!important}
      html[data-gpt-moon-garden] :is(aside,[role="navigation"]){background-color:${sidebar}!important}
      html[data-gpt-moon-garden] :is(input, textarea, [contenteditable="true"]){caret-color:${ink}!important}
      html[data-gpt-moon-garden] :is(input, textarea)::placeholder, html[data-gpt-moon-garden] [contenteditable="true"]:empty:before{color:${dark ? '#9a8db0' : '#a49ab3'}!important}
      html[data-gpt-moon-garden] :is(button,[role="button"]):hover{background-color:${dark ? '#3a3149' : '#efeaf6'}!important}
      html[data-gpt-moon-garden] :is(button,[role="button"]):disabled{color:${dark ? '#8a7d9e' : '#b9b0c6'}!important}

    `;
    clampPosition();
  }
  pet.addEventListener('pointerdown', e => { if (e.button !== 0) return; pointer = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y, moved: false }; pet.setPointerCapture(e.pointerId); });
  pet.addEventListener('pointermove', e => { if (!pointer) return; const dx = e.clientX-pointer.x, dy=e.clientY-pointer.y; if (Math.abs(dx)+Math.abs(dy)>6) pointer.moved=true; offset={x:pointer.ox+dx,y:pointer.oy+dy};clampPosition(); });
  pet.addEventListener('pointerup', () => { if (!pointer) return; if (!pointer.moved) { say(settings.character === 'chibi' ? '今天的灵感，由我守护。' : '我在，一起把它做好吧。'); greet(); } pointer=null; try{localStorage.setItem('gpt-moon-garden-position',JSON.stringify(offset));}catch{} });
  pet.addEventListener('pointercancel', () => pointer=null);
  pet.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();say('我在，一起把它做好吧。');greet();}});
  addEventListener('resize',clampPosition,{signal:abort.signal});
  function checkActivity(){
    // Only the existence of a stop control is observed; conversation text is never read.
    const next=Boolean(document.querySelector('button[aria-label="Stop generating"],button[aria-label="停止生成"],button[data-testid="stop-button"]'));
    if(next!==busy){if(next)say('正在努力，把灵感变成现实。');else if(busy){say('完成啦，下一步也一起吧。');greet();}busy=next;}
  }
  const observer=new MutationObserver(()=>{if(observerTimer)return;observerTimer=setTimeout(()=>{observerTimer=null;checkActivity();},250);});
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-label']});
  function cleanup(){clearTimeout(bubbleTimer);clearTimeout(greetTimer);clearTimeout(observerTimer);observer.disconnect();abort.abort();host.remove();native.remove();document.documentElement.removeAttribute('data-gpt-moon-garden');}
  render();
  globalThis[KEY]={settings,cleanup,revision:payload.revision,version:'0.1.2'};
  return {applied:true,version:'0.1.2',surface:main?'main':'composer',revision:payload.revision};
})(__PAYLOAD__)
