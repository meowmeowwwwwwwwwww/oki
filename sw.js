// Oki offline: always try the network first (fresh app), fall back to the last saved copy.
const CACHE = 'oki-v4';
const SHELL = ['./', 'index.html', 'app.css', 'app.js', 'motion.js', 'store.js', 'sync.js', 'sample.js', 'icon.svg', 'icon-180.png', 'manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || r.url.includes('api.github.com')) return;
  const same = new URL(r.url).origin === location.origin;
  e.respondWith(fetch(r, same ? { cache: 'no-cache' } : {}).then(res => {
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); }
    return res;
  }).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('index.html'))));
});
