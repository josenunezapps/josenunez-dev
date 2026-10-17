/* DistraGuard Web 1.0 — sin dependencias ni rastreadores propios. */
(() => {
  'use strict';
  const STORAGE_KEY = 'distraguard-web-v1';
  const MAX_LIBRARY = 500;
  const $ = (id) => document.getElementById(id);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const icon = (name) => `<svg class="ico" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const defaults = () => ({
    prefs: { protectionOn: true, blockShorts: true, focus: false },
    words: [], channels: [], blockedVideos: [], library: [],
    recent: [], stats: { blocked: 0, viewerSeconds: 0, days: {} },
    security: null, focusEnd: 0, focusMinutes: 25
  });
  const normalized = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
  const cleanText = (v, limit = 160) => String(v == null ? '' : v).trim().slice(0, limit);
  const isValidId = (id) => /^[a-zA-Z0-9_-]{11}$/.test(id);
  const escapeHtml = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const storage = (() => {
    try { const k = '__dg_probe'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return true; }
    catch { return false; }
  })();
  function getVideoInfo(input) {
    const raw = String(input || '').trim();
    if (isValidId(raw)) return { id: raw, isShort: false };
    try {
      const u = new URL(raw);
      const host = u.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
      if (host === 'youtu.be') {
        const id = u.pathname.split('/').filter(Boolean)[0];
        return isValidId(id) ? { id, isShort: false } : null;
      }
      if (['youtube.com', 'youtube-nocookie.com', 'music.youtube.com'].includes(host)) {
        const seg = u.pathname.split('/').filter(Boolean);
        const short = seg[0] === 'shorts';
        let id = null;
        if (u.pathname === '/watch') id = u.searchParams.get('v');
        else if (['shorts', 'embed', 'live', 'v'].includes(seg[0])) id = seg[1];
        return isValidId(id) ? { id, isShort: short } : null;
      }
    } catch { /* URL inválida */ }
    return null;
  }
  function sanitizeVideo(v) {
    if (!v || typeof v !== 'object' || !isValidId(v.id)) return null;
    return { id: v.id, title: cleanText(v.title, 160), channel: cleanText(v.channel, 100), isShort: !!v.isShort, addedAt: Number(v.addedAt) || Date.now() };
  }
  function uniqueStrings(items, maxLength, cap = 300) {
    if (!Array.isArray(items)) return [];
    const values = [];
    const seen = new Set();
    for (const raw of items.slice(0, 2000)) {
      const t = cleanText(raw, maxLength);
      const n = normalized(t);
      if (!n || seen.has(n)) continue;
      seen.add(n); values.push(t);
      if (values.length >= cap) break;
    }
    return values;
  }
  function restore(raw) {
    const d = defaults();
    if (!raw || typeof raw !== 'object') return d;
    d.prefs = { protectionOn: raw.prefs?.protectionOn !== false, blockShorts: raw.prefs?.blockShorts !== false, focus: raw.prefs?.focus === true };
    d.words = uniqueStrings(raw.words, 70);
    d.channels = uniqueStrings(raw.channels, 100);
    d.blockedVideos = Array.isArray(raw.blockedVideos) ? Array.from(new Set(raw.blockedVideos.filter(isValidId))).slice(0, 300) : [];
    d.library = Array.isArray(raw.library) ? Array.from(new Map(raw.library.map(sanitizeVideo).filter(Boolean).slice(0, MAX_LIBRARY).map(v => [v.id, v])).values()) : [];
    d.recent = Array.isArray(raw.recent) ? Array.from(new Set(raw.recent.filter(isValidId))).slice(0, 8) : [];
    d.stats = { blocked: Math.min(1e8, Math.max(0, Number(raw.stats?.blocked) || 0)), viewerSeconds: Math.min(1e9, Math.max(0, Number(raw.stats?.viewerSeconds) || 0)), days: {} };
    if (raw.stats?.days && typeof raw.stats.days === 'object') {
      for (const [key, value] of Object.entries(raw.stats.days).slice(-100)) {
        if (/^\d{4}-\d\d-\d\d$/.test(key)) d.stats.days[key] = Math.min(1e7, Math.max(0, Number(value) || 0));
      }
    }
    if (raw.security && typeof raw.security.salt === 'string' && /^[a-f0-9]{32}$/.test(raw.security.salt) && /^[a-f0-9]{64}$/.test(raw.security.verifier || '')) {
      d.security = { salt: raw.security.salt, verifier: raw.security.verifier };
    }
    d.focusEnd = Number(raw.focusEnd) > Date.now() ? Number(raw.focusEnd) : 0;
    d.focusMinutes = [15, 25, 45, 60].includes(raw.focusMinutes) ? raw.focusMinutes : 25;
    return d;
  }
  let state;
  try { state = restore(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')); }
  catch { state = defaults(); }
  let unlocked = !state.security;
  let activeView = 'inicio';
  let libraryFilter = 'todos';
  let currentVideo = null;
  let currentStartTime = null;
  let passMode = 'unlock';
  let passAfter = null;
  let confirmAfter = null;
  let timerFinishedNotified = false;
  const isProtected = () => !!state.security && !unlocked;
  const isFiltering = () => state.prefs.protectionOn;
  const persist = () => {
    if (!storage) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch { toast('No hay espacio para guardar los cambios en este navegador.', true); }
  };
  function toast(message, error = false) {
    const el = document.createElement('div');
    el.className = 'toast' + (error ? ' error' : '');
    el.textContent = message;
    $('toast-region').append(el);
    setTimeout(() => el.remove(), 4300);
  }
  function show(dialogId) { const d = $(dialogId); if (!d.open) d.showModal(); }
  function close(dialogId) { const d = $(dialogId); if (d.open) d.close(); }
  function go(view) {
    if (!$("view-" + view)) return;
    activeView = view;
    $$('.view').forEach(el => el.classList.toggle('active', el.id === 'view-' + view));
    $$('[data-nav]').forEach(el => { el.classList.toggle('active', el.dataset.nav === view); if (el.dataset.nav === view) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current'); });
    const names = { inicio: 'Inicio', biblioteca: 'Mi biblioteca', bloqueos: 'Bloqueos', enfoque: 'Modo enfoque', estadisticas: 'Estadísticas', ajustes: 'Configuración' };
    $('breadcrumb-current').textContent = names[view];
    if (location.hash !== '#' + view) history.replaceState(null, '', '#' + view);
    if (view === 'biblioteca') renderLibrary();
    if (view === 'estadisticas') renderStats();
    window.scrollTo({top: 0, behavior: 'instant'});
  }
  function ruleCount() { return state.words.length + state.channels.length + state.blockedVideos.length + (state.prefs.blockShorts ? 1 : 0); }
  function filterReason(v) {
    if (!isFiltering()) return null;
    if (state.prefs.blockShorts && v.isShort) return 'Es un enlace de Shorts';
    if (state.blockedVideos.includes(v.id)) return 'Video bloqueado individualmente';
    if (v.title && state.words.some(w => normalized(v.title).includes(normalized(w)))) return 'El título contiene una palabra bloqueada';
    if (v.channel && state.channels.some(c => normalized(v.channel) === normalized(c))) return 'Canal bloqueado';
    return null;
  }
  function logBlocked(reason) {
    state.stats.blocked += 1;
    const key = new Date().toLocaleDateString('en-CA');
    state.stats.days[key] = (state.stats.days[key] || 0) + 1;
    persist(); renderIndicators();
    toast('Reproducción bloqueada: ' + reason, true);
  }
  function restricted(action) {
    if (isProtected()) { passwordDialog('unlock', action); return; }
    action();
  }
  function renderIndicators() {
    const active = isFiltering();
    $('side-dot').classList.toggle('off', !active);
    $('side-status-title').textContent = active ? 'Protección activa' : 'Protección pausada';
    $('side-status-desc').textContent = active ? 'Tus filtros están funcionando' : 'Los filtros no se aplican';
    const p = $('status-pill');
    p.innerHTML = `<span class="pulse-dot ${active ? '' : 'off'}"></span>${active ? 'Protección activa' : 'Protección pausada'}`;
    p.style.color = active ? '#77dfbf' : '#f0bf80';
    $('home-rules').textContent = ruleCount();
    $('home-blocks').textContent = state.stats.blocked;
    $('home-watch').textContent = formatTime(state.stats.viewerSeconds);
    $('library-count').textContent = state.library.length;
    $('protection-toggle').checked = active;
    $('shorts-toggle').checked = state.prefs.blockShorts;
    const tag = $('lock-tag');
    tag.innerHTML = isProtected() ? `${icon('lock')} <span>Bloqueado</span>` : `${icon('unlock')} <span>Editable</span>`;
    $('words-count').textContent = state.words.length;
    $('channels-count').textContent = state.channels.length;
    $('videos-count').textContent = state.blockedVideos.length;
    $('password-description').textContent = !state.security ? 'Agregá una contraseña para restringir cambios en las reglas.' : isProtected() ? 'Los cambios están protegidos. Desbloqueá para editar.' : 'Los cambios están habilitados durante esta sesión.';
    $('password-action').textContent = !state.security ? 'Configurar' : isProtected() ? 'Desbloquear' : 'Bloquear ajustes';
    document.body.classList.toggle('focus-on', state.prefs.focus);
    $('focus-stage-title').textContent = state.prefs.focus ? 'Estás en modo enfoque.' : 'Dale lugar a tu atención.';
    $('focus-stage-desc').textContent = state.prefs.focus ? 'Las recomendaciones propias de DistraGuard están ocultas. Buscá y abrí sólo lo que decidiste mirar.' : 'Activá el modo enfoque para esconder accesos a contenido sugerido y mantener un entorno más simple.';
    $('focus-toggle').innerHTML = state.prefs.focus ? `${icon('pause')} <span>Desactivar modo enfoque</span>` : `${icon('target')} <span>Activar modo enfoque</span>`;
    $('focus-meter-dot').classList.toggle('on', state.prefs.focus);
    $('focus-meter-label').textContent = state.prefs.focus ? 'El enfoque está activado' : 'El enfoque está desactivado';
    $$('[data-minutes]').forEach(btn => btn.classList.toggle('selected', Number(btn.dataset.minutes) === state.focusMinutes));
    renderTimer();
  }
  function renderChipList(id, items, key) {
    const el = $(id); el.replaceChildren();
    if (!items.length) { const txt = document.createElement('span'); txt.className='chip-empty'; txt.textContent='Todavía no agregaste ningún bloqueo.'; el.append(txt); return; }
    for (const item of items) {
      const chip = document.createElement('span'); chip.className = 'chip';
      const text = document.createElement('span'); text.textContent = item;
      const btn = document.createElement('button'); btn.type='button'; btn.title='Eliminar bloqueo'; btn.setAttribute('aria-label', 'Eliminar ' + item);
      btn.innerHTML=icon('close'); btn.addEventListener('click', () => restricted(() => { state[key] = state[key].filter(v => v !== item); persist(); renderAll(); toast('Bloqueo eliminado.'); }));
      chip.append(text, btn); el.append(chip);
    }
  }
  function renderRules() {
    renderChipList('words-list', state.words, 'words');
    renderChipList('channels-list', state.channels, 'channels');
    renderChipList('videos-list', state.blockedVideos, 'blockedVideos');
  }
  function makeVideoCard(v, remote = false) {
    const reason = filterReason(v);
    const card = document.createElement('article'); card.className='video-card';
    const thumb = document.createElement('button'); thumb.className='video-thumb'+(reason ? ' blocked' : ''); thumb.type='button'; thumb.title='Abrir video';
    const img = document.createElement('img'); img.src = `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`; img.alt='Miniatura del video'; img.loading='lazy'; img.referrerPolicy='no-referrer';
    thumb.append(img);
    const play = document.createElement('span'); play.className='thumb-play'; play.innerHTML=icon(reason ? 'ban' : 'play'); thumb.append(play);
    if (reason) { const badge=document.createElement('span'); badge.className='thumb-badge'; badge.textContent='BLOQUEADO'; thumb.append(badge); }
    thumb.addEventListener('click', () => openVideo(v));
    const content=document.createElement('div');content.className='video-body';
    const title=document.createElement('h3');title.className='video-title';title.textContent=v.title || 'Video sin título registrado';
    const channel=document.createElement('p');channel.className='video-channel';channel.textContent=v.channel || 'Canal no registrado';
    const controls=document.createElement('div');controls.className='video-details';
    const open=document.createElement('button');open.type='button';open.textContent='Abrir video';open.addEventListener('click',()=>openVideo(v));
    const action=document.createElement('button');action.type='button';action.className='icon-action';
    const isSaved=state.library.some(x=>x.id===v.id);
    action.innerHTML=icon(remote && !isSaved ? 'plus':'trash');
    action.title=remote && !isSaved ? 'Guardar en biblioteca' : 'Quitar de biblioteca';
    action.setAttribute('aria-label', action.title);
    action.addEventListener('click',()=>{
      if(remote && !isSaved) { addToLibrary(v); return; }
      askConfirm('Quitar video', 'El video desaparecerá de tu biblioteca. No se eliminará de YouTube.', 'Quitar video', ()=>{
        state.library=state.library.filter(x=>x.id!==v.id);state.recent=state.recent.filter(x=>x!==v.id);persist();renderAll();toast('Video quitado de la biblioteca.');
      });
    });
    controls.append(open,action); content.append(title,channel,controls);
    if(reason){const reasonEl=document.createElement('p');reasonEl.className='video-reason';reasonEl.textContent=reason;content.append(reasonEl);}
    card.append(thumb,content);return card;
  }
  function renderLibrary() {
    const term=normalized($('library-search').value);
    const items=state.library.filter(v=>{
      const reason=filterReason(v);
      if(libraryFilter==='bloqueados'&&!reason)return false;
      if(libraryFilter==='permitidos'&&reason)return false;
      return !term || normalized(v.title + ' ' + v.channel + ' ' + v.id).includes(term);
    }).sort((a,b)=>b.addedAt-a.addedAt);
    const grid=$('library-grid');grid.replaceChildren();
    if(items.length===0){
      const empty=document.createElement('div');empty.className='empty-state';
      empty.innerHTML=`<div class="empty-icon">${icon('video')}</div><h3>${state.library.length ? 'No hay videos que coincidan' : 'Tu biblioteca empieza acá'}</h3><p>${state.library.length ? 'Probá otra búsqueda o cambiá el filtro.' : 'Guardá el enlace de un video de YouTube para volver a verlo desde un lugar sin feed infinito.'}</p>`;
      if(!state.library.length){const btn=document.createElement('button');btn.type='button';btn.className='btn btn-primary';btn.innerHTML=`${icon('plus')} Agregar mi primer video`;btn.addEventListener('click',openAdd);empty.append(btn);}
      grid.append(empty);
    }else items.forEach(v=>grid.append(makeVideoCard(v)));
  }
  function renderRecent() {
    const el=$('recent-list');el.replaceChildren();
    if(state.prefs.focus){ const e=document.createElement('div');e.className='mini-empty';e.textContent='El modo enfoque oculta los accesos a videos recientes.';el.append(e);return; }
    const recent=state.recent.map(id=>state.library.find(v=>v.id===id)).filter(Boolean).slice(0,4);
    if(!recent.length){const e=document.createElement('div');e.className='mini-empty';e.textContent='Acá aparecerán los videos que abras desde tu biblioteca.';el.append(e);return;}
    recent.forEach(v=>{const button=document.createElement('button');button.type='button';button.className='mini-video';
      const img=document.createElement('img');img.src=`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`;img.alt='';img.loading='lazy';
      const text=document.createElement('div');const title=document.createElement('b');title.textContent=v.title||'Video sin título';const channel=document.createElement('small');channel.textContent=v.channel||'YouTube';text.append(title,channel);button.append(img,text);button.addEventListener('click',()=>openVideo(v));el.append(button);
    });
  }
  function renderStats() {
    $('stats-blocks').textContent=state.stats.blocked;
    $('stats-time').textContent=formatTime(state.stats.viewerSeconds);
    $('stats-saved').textContent=state.library.length;
    const keys=[];
    for(let n=6;n>=0;n--){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-n);keys.push({key:d.toLocaleDateString('en-CA'),label:new Intl.DateTimeFormat('es-AR',{weekday:'short'}).format(d)});}
    const max=Math.max(1,...keys.map(x=>state.stats.days[x.key]||0));
    const chart=$('bar-chart');chart.replaceChildren();
    keys.forEach(x=>{const value=state.stats.days[x.key]||0;const col=document.createElement('div');col.className='bar-col';
      const label=document.createElement('span');label.className='bar-value';label.textContent=value;
      const bar=document.createElement('div');bar.className='bar'+(value===0?' bar-zero':'');bar.style.height=(Math.max(3,value/max*175))+'px';bar.setAttribute('role','img');bar.setAttribute('aria-label',`${value} bloqueos el ${x.key}`);
      const day=document.createElement('span');day.className='bar-label';day.textContent=x.label;
      col.append(label,bar,day);chart.append(col);
    });
  }
  function renderAll() {renderIndicators();renderRules();renderLibrary();renderRecent();renderStats();}
  function formatTime(seconds) {const m=Math.floor(seconds/60);return m<60 ? m+' min' : Math.floor(m/60)+' h '+(m%60)+' min';}
  function addToLibrary(v) {
    const safe=sanitizeVideo(v);if(!safe)return;
    if(!state.library.some(x=>x.id===safe.id)&&state.library.length>=MAX_LIBRARY){toast('Tu biblioteca llegó al límite de 500 videos.',true);return;}
    state.library=state.library.filter(x=>x.id!==safe.id);
    state.library.unshift({...safe,addedAt:Date.now()});persist();renderAll();toast('Video guardado en tu biblioteca.');
  }
  function openVideo(v) {
    const reason=filterReason(v);
    if(reason){logBlocked(reason);return;}
    currentVideo=v;
    $('player-title').textContent=v.title||'Video de YouTube';
    $('player-channel').textContent=v.channel||'Canal sin registrar';
    const iframe=document.createElement('iframe');
    iframe.title='Reproductor de YouTube';
    iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen=true;
    iframe.referrerPolicy='strict-origin-when-cross-origin';
    iframe.src=`https://www.youtube-nocookie.com/embed/${v.id}?playsinline=1&rel=0`;
    $('player-frame-container').replaceChildren(iframe);
    show('player-dialog');
    currentStartTime=Date.now();
    if(state.library.some(x=>x.id===v.id)){
      state.recent=[v.id,...state.recent.filter(id=>id!==v.id)].slice(0,8);persist();renderRecent();
    }
  }
  function closePlayer() {
    $('player-frame-container').replaceChildren();
    currentVideo=null;currentStartTime=null;
  }
  async function openAdd() {
    $('add-form').reset();$('add-save').checked=true;$('metadata-alert').classList.add('hidden');show('add-dialog');$('add-url').focus();
  }
  async function autofillMetadata(url) {
    const parsed=getVideoInfo(url);
    const alert=$('metadata-alert');
    alert.classList.add('hidden');
    if(!parsed) return;
    const existing=state.library.find(x=>x.id===parsed.id);
    if(existing) { $('add-title').value=existing.title;$('add-channel').value=existing.channel;return; }
    try {
      const resp=await fetch('/dg-lab-7q4m/api/video?id='+encodeURIComponent(parsed.id),{signal:AbortSignal.timeout(3800)});
      if(!resp.ok)return;
      const data=await resp.json();
      if(getVideoInfo($('add-url').value)?.id!==parsed.id)return;
      if(data.title&&!$('add-title').value)$('add-title').value=cleanText(data.title,160);
      if(data.channel&&!$('add-channel').value)$('add-channel').value=cleanText(data.channel,100);
    }catch{/* No se configuró integración: modo local sigue funcionando */}
  }
  function passwordDialog(mode, after=null) {
    passMode=mode;passAfter=after;
    $('password-form').reset();$('password-error').textContent='';
    $('password-confirm-wrap').classList.toggle('hidden',mode!=='set');
    $('password-confirm').required=mode==='set';
    $('password-dialog-title').textContent=mode==='set'?'Crear contraseña':'Desbloquear ajustes';
    $('password-instructions').textContent=mode==='set'?'Usá al menos 6 caracteres. La contraseña sólo protege los cambios dentro de esta web.':'Ingresá la contraseña que configuraste para poder editar las reglas.';
    $('password-submit').textContent=mode==='set'?'Crear y bloquear':'Desbloquear';
    show('password-dialog');$('password-input').focus();
  }
  function bufferHex(buffer) {return Array.from(new Uint8Array(buffer),b=>b.toString(16).padStart(2,'0')).join('');}
  function hexToBytes(hex) {return Uint8Array.from(hex.match(/.{2}/g), h=>parseInt(h,16));}
  async function calculateVerifier(password,salt) {
    const imported=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
    const data=await crypto.subtle.deriveBits({name:'PBKDF2',salt:hexToBytes(salt),iterations:175000,hash:'SHA-256'},imported,256);
    return bufferHex(data);
  }
  function askConfirm(title,description,button,callback){
    $('confirm-title').textContent=title;$('confirm-description').textContent=description;$('confirm-submit').textContent=button;
    confirmAfter=callback;show('confirm-dialog');
  }
  function renderTimer() {
    const diff=state.focusEnd ? Math.max(0,Math.ceil((state.focusEnd-Date.now())/1000)) : state.focusMinutes*60;
    if(state.focusEnd && diff===0){state.focusEnd=0;persist();if(!timerFinishedNotified){timerFinishedNotified=true;toast('¡Sesión de enfoque completada!');}}
    $('timer-display').textContent=String(Math.floor(diff/60)).padStart(2,'0')+':'+String(diff%60).padStart(2,'0');
    $('timer-toggle').textContent=state.focusEnd?'Finalizar sesión':'Iniciar sesión';
    $$('[data-minutes]').forEach(b=>b.disabled=!!state.focusEnd);
  }
  function backupData() {
    const {prefs,words,channels,blockedVideos,library,recent,stats}=state;
    return {type:'distraguard-web-backup',version:1,exportedAt:new Date().toISOString(),prefs,words,channels,blockedVideos,library,recent,stats};
  }
  function handleBackupFile(file) {
    if(!file)return;
    if(file.size>1024*1024){toast('El archivo es demasiado grande (máximo 1 MB).',true);return;}
    restricted(async ()=>{
      try{
        const parsed=JSON.parse(await file.text());
        if(parsed.type!=='distraguard-web-backup'||parsed.version!==1)throw Error('Formato no compatible');
        const restored=restore(parsed);
        const originalSecurity=state.security;
        askConfirm('Importar datos','Se reemplazarán tus reglas, biblioteca y estadísticas actuales. La contraseña local permanecerá como está.','Importar',()=>{
          state={...restored,security:originalSecurity,focusEnd:0};persist();renderAll();toast('Copia restaurada.');
        });
      }catch{toast('El archivo no es una copia válida de DistraGuard Web.',true);}
    });
  }
  async function remoteSearch(query) {
    if(!query)return;
    if(isFiltering()&&(state.words.some(w=>normalized(query).includes(normalized(w)))||state.channels.some(c=>normalized(query)===normalized(c)))){
      logBlocked('La búsqueda contiene un término bloqueado');return;
    }
    const results=$('remote-results');results.replaceChildren();
    $('remote-hint').textContent='Buscando videos...';
    try{
      const res=await fetch('/dg-lab-7q4m/api/search?q='+encodeURIComponent(query),{signal:AbortSignal.timeout(15000)});
      const json=await res.json();
      if(!res.ok){ $('remote-hint').textContent=json.error||'La búsqueda pública no está configurada.';return; }
      const videos=Array.isArray(json.items)?json.items.map(sanitizeVideo).filter(Boolean):[];
      $('remote-hint').textContent=videos.length ? 'Resultados de YouTube. Los filtros se aplican antes de abrir cada video.' : 'No encontramos videos para esa búsqueda.';
      videos.filter(v=>!filterReason(v)).forEach(v=>results.append(makeVideoCard(v,true)));
      if(videos.length && results.children.length===0)$('remote-hint').textContent='Todos los videos encontrados coinciden con tus bloqueos.';
    }catch{$('remote-hint').textContent='No se pudo conectar con el buscador. Podés seguir agregando videos por enlace.';}
  }
  function registerEvents() {
    $$('[data-nav]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.nav)));
    $$('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
    ['hero-add','top-add','library-add'].forEach(id=>$(id).addEventListener('click',openAdd));
    $$('[data-close]').forEach(b=>b.addEventListener('click',()=>close(b.dataset.close)));
    $$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close();}));
    $('player-dialog').addEventListener('close',closePlayer);
    $('add-url').addEventListener('blur',()=>autofillMetadata($('add-url').value));
    $('add-form').addEventListener('submit',e=>{
      e.preventDefault();const info=getVideoInfo($('add-url').value);
      if(!info){toast('Ingresá un enlace válido a un video de YouTube.',true);return;}
      const v={...info,title:cleanText($('add-title').value),channel:cleanText($('add-channel').value),addedAt:Date.now()};
      const reason=filterReason(v);
      if(reason){close('add-dialog');logBlocked(reason);return;}
      if($('add-save').checked)addToLibrary(v);
      close('add-dialog');openVideo(v);
      if((state.words.length&&!v.title)||(state.channels.length&&!v.channel))toast('Sin título o canal, algunos filtros no pueden verificar este video.');
    });
    $('player-block').addEventListener('click',()=>{
      if(!currentVideo)return;
      const id=currentVideo.id;
      restricted(()=>{if(!state.blockedVideos.includes(id))state.blockedVideos.push(id);persist();close('player-dialog');renderAll();toast('Video bloqueado.');});
    });
    $('library-search').addEventListener('input',renderLibrary);
    $$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{libraryFilter=b.dataset.filter;$$('[data-filter]').forEach(x=>x.classList.toggle('selected',x===b));renderLibrary();}));
    $('open-search').addEventListener('click',()=>{$('remote-search-panel').classList.toggle('hidden');$('open-search').textContent=$('remote-search-panel').classList.contains('hidden')?'Buscar videos':'Ocultar búsqueda';});
    $('remote-search-form').addEventListener('submit',e=>{e.preventDefault();remoteSearch($('remote-query').value.trim());});
    $('protection-toggle').addEventListener('change',e=>{const next=e.target.checked;e.target.checked=state.prefs.protectionOn;restricted(()=>{state.prefs.protectionOn=next;persist();renderAll();toast(next?'Protecciones activadas.':'Protecciones pausadas.');});});
    $('shorts-toggle').addEventListener('change',e=>{const next=e.target.checked;e.target.checked=state.prefs.blockShorts;restricted(()=>{state.prefs.blockShorts=next;persist();renderAll();toast(next?'Enlaces de Shorts bloqueados.':'Bloqueo de Shorts desactivado.');});});
    for(const [type,form,input] of [['words','word-form','word-input'],['channels','channel-form','channel-input']]){
      $(form).addEventListener('submit',e=>{e.preventDefault();const text=cleanText($(input).value,type==='words'?70:100);if(!text)return;
        restricted(()=>{if(state[type].some(w=>normalized(w)===normalized(text))){toast('Ese bloqueo ya existe.',true);return;}state[type].push(text);$(input).value='';persist();renderAll();toast('Bloqueo agregado.');});
      });
    }
    $('video-block-form').addEventListener('submit',e=>{e.preventDefault();const v=getVideoInfo($('video-block-input').value);
      if(!v){toast('Pegá un enlace de YouTube válido o un ID de 11 caracteres.',true);return;}
      restricted(()=>{if(state.blockedVideos.includes(v.id)){toast('Ese video ya está bloqueado.',true);return;}state.blockedVideos.push(v.id);$('video-block-input').value='';persist();renderAll();toast('Video bloqueado.');});
    });
    $('focus-toggle').addEventListener('click',()=>{
      const next=!state.prefs.focus;
      const action=()=>{state.prefs.focus=next;persist();renderAll();toast(next?'Modo enfoque activado.':'Modo enfoque desactivado.');};
      next?action():restricted(action);
    });
    $$('[data-minutes]').forEach(b=>b.addEventListener('click',()=>{if(state.focusEnd)return;state.focusMinutes=Number(b.dataset.minutes);persist();renderIndicators();}));
    $('timer-toggle').addEventListener('click',()=>{if(state.focusEnd){state.focusEnd=0;toast('Sesión finalizada.');}else{state.focusEnd=Date.now()+state.focusMinutes*60*1000;timerFinishedNotified=false;toast('¡Tu sesión de enfoque comenzó!');}persist();renderTimer();});
    $('password-action').addEventListener('click',()=>{
      if(!state.security)passwordDialog('set');
      else if(isProtected())passwordDialog('unlock');
      else{unlocked=false;renderAll();toast('Ajustes bloqueados.');}
    });
    $('password-form').addEventListener('submit',async e=>{
      e.preventDefault();const password=$('password-input').value;const submit=$('password-submit');submit.disabled=true;$('password-error').textContent='';
      try{
        if(passMode==='set'){
          if(password.length<6)throw Error('La contraseña debe tener al menos 6 caracteres.');
          if(password!==$('password-confirm').value)throw Error('Las contraseñas no coinciden.');
          const salt=bufferHex(crypto.getRandomValues(new Uint8Array(16)));
          const verifier=await calculateVerifier(password,salt);
          state.security={salt,verifier};unlocked=false;persist();close('password-dialog');renderAll();toast('Contraseña creada. Los ajustes están bloqueados.');
        }else{
          if(!state.security)throw Error('No hay contraseña configurada.');
          const hashed=await calculateVerifier(password,state.security.salt);
          if(hashed!==state.security.verifier)throw Error('Contraseña incorrecta.');
          unlocked=true;close('password-dialog');renderAll();toast('Ajustes desbloqueados durante esta sesión.');
          const after=passAfter;passAfter=null;if(typeof after==='function')after();
        }
      }catch(err){$('password-error').textContent=err.message||'No se pudo verificar la contraseña.';}
      finally{submit.disabled=false;}
    });
    $('confirm-form').addEventListener('submit',e=>{e.preventDefault();close('confirm-dialog');const cb=confirmAfter;confirmAfter=null;if(typeof cb==='function')cb();});
    $('export-data').addEventListener('click',()=>{
      const blob=new Blob([JSON.stringify(backupData(),null,2)],{type:'application/json'});
      const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='DistraGuard-Web-copia-'+new Date().toISOString().slice(0,10)+'.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);toast('Copia exportada. No incluye tu contraseña.');
    });
    $('import-data').addEventListener('click',()=>restricted(()=>$('import-file').click()));
    $('import-file').addEventListener('change',e=>{handleBackupFile(e.target.files?.[0]);e.target.value='';});
    $('reset-data').addEventListener('click',()=>restricted(()=>askConfirm('Eliminar todos los datos','Esta acción elimina tu biblioteca, tus bloqueos, las estadísticas y la contraseña. No se puede deshacer.','Eliminar todo',()=>{state=defaults();unlocked=true;persist();renderAll();go('inicio');toast('Datos locales eliminados.');})));
    window.addEventListener('hashchange',()=>{const view=location.hash.replace('#','');if(view!==activeView && $('view-'+view))go(view);});
    window.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('player-dialog').open)$('player-dialog').close();});
  }
  let secondsSinceSave=0;
  function onTick(){
    renderTimer();
    if($('player-dialog').open&&document.visibilityState==='visible'){
      state.stats.viewerSeconds+=1;
      secondsSinceSave++;
      if(secondsSinceSave>=10){persist();secondsSinceSave=0;renderIndicators();if(activeView==='estadisticas')renderStats();}
    }
  }
  function bootstrap() {
    if(!storage)toast('El navegador no permite guardar datos locales. Los cambios pueden perderse.',true);
    registerEvents();renderAll();
    const first=location.hash.replace('#','');go($('view-'+first)?first:'inicio');
    setInterval(onTick,1000);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')persist();});
    window.addEventListener('pagehide',persist);
    if('serviceWorker' in navigator && location.protocol==='https:')navigator.serviceWorker.register('/dg-lab-7q4m/sw.js',{scope:'/dg-lab-7q4m/'}).catch(()=>{});
  }
  bootstrap();
})();
