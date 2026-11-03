// Norte Aberturas · service worker de la demo.
// La versión llega en la URL de registro (sw.js?v=rNN), definida una sola vez en js/tienda.js (NORTE_VERSION).
// Nunca sirve HTML viejo: solo guarda el manifiesto y el ícono para poder instalar la app.
const VERSION=new URL(self.location.href).searchParams.get('v')||'dev';
const CACHE='norte-pwa-demo-'+VERSION;
const ASSETS=['./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
 self.skipWaiting();
});
self.addEventListener('activate',event=>{
 event.waitUntil(Promise.all([
  caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('norte-pwa-demo-')&&key!==CACHE).map(key=>caches.delete(key)))),
  self.clients.claim()
 ]));
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 const url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith('/norte-aberturas-app-6p2d/'))return;
 // Siempre buscar el HTML nuevo. El catálogo y el carrito siguen guardados
 // localmente, pero el código de la aplicación no queda congelado en la caché.
 if(request.mode==='navigate')event.respondWith(fetch(request,{cache:'no-store'}));
});
