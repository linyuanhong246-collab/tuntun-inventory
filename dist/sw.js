// Keep project-site caches isolated from other repositories on the same origin.
const CACHE_PREFIX='tuntun-pages:'+new URL(self.registration.scope).pathname+':';
const CACHE=CACHE_PREFIX+'v0132-20261019-restore1';
const ASSETS=['./','./index.html','./style.css?v=0.10.0','./data.js?v=0.13.1','./simple-data.js?v=0.13.1','./product-art.js?v=0.13.1','./manage-ui.js?v=0.13.1','./simple-app.js?v=0.13.2','./simple.css?v=0.13.1','./theme.css?v=0.10.0','./seed.json','./manifest.webmanifest?v=0.10.0','./icon-hamster-32.png','./icon-hamster-180.png','./icon-hamster-192.png','./icon-hamster-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const url=new URL(e.request.url);if(e.request.method!=='GET'||url.origin!==self.location.origin)return;if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.match(new URL('./index.html',self.registration.scope).href)));return;}if(ASSETS.some(p=>new URL(p,self.registration.scope).pathname===url.pathname))e.respondWith(caches.open(CACHE).then(async c=>(await c.match(e.request))||fetch(e.request)));});
