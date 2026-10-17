const CACHE_NAME = 'distraguard-web-hidden-v1';
const BASE = new URL(self.registration.scope).pathname;
const APP_SHELL = ['','index.html','styles.css','app.js','manifest.webmanifest','assets/icon.svg','assets/icon-192.png','assets/icon-512.png'].map(item=>BASE+item);
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(name=>name.startsWith('distraguard-web-hidden-')&&name!==CACHE_NAME).map(name=>caches.delete(name)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const u = new URL(event.request.url);
  if(event.request.method!=='GET'||u.origin!==location.origin||!u.pathname.startsWith(BASE)||u.pathname.startsWith(BASE+'api/'))return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).catch(()=>caches.match(BASE+'index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(hit=>hit || fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));}
    return response;
  })));
});
