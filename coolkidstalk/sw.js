// Talk It Out offline shell. Chats need the internet; the app screens load offline.
// The voice model is saved separately by the voice engine after its first download.
const CACHE = 'cool-kids-talk-v1';
const SHELL = ['./','./index.html','./app.js','./voice-worker.js','./manifest.webmanifest',
  './icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png','./buddies/logo.png',
  './buddies/chloe.jpg','./buddies/carter.jpg','./buddies/malik.jpg','./buddies/nyla.jpg','./buddies/mia.jpg','./buddies/albert.jpg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if(e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});
