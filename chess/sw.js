// Lets the Cool Kids Chess Club work offline once it has been opened.
const CACHE = 'ckcc-v1';
const CORE = ['./', 'index.html', 'app.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-180.png', 'audio/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
    // save every finished voice clip in the background
    try {
      const m = await (await fetch('audio/manifest.json', { cache: 'no-store' })).json();
      const files = [...new Set(m.clips.flatMap(c => c.parts.flatMap(p => p.files)))];
      const c = await caches.open(CACHE);
      for (const f of files) { if (!(await c.match(f))) { try { await c.add(f); } catch (err) {} } }
    } catch (err) {}
  })());
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.endsWith('.mp3') || url.pathname.endsWith('.png')) {
    // voices and icons: use the saved copy first
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    })));
  } else {
    // the game page and voice list: get the newest when online, saved copy when offline
    e.respondWith(fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
  }
});
