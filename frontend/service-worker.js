const CACHE  = 'prixmalin-v1';
const ASSETS = ['/', '/index.html', '/style.css', '/app.js'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (new URL(event.request.url).pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: 'Hors ligne' }), { headers: { 'Content-Type': 'application/json' } })
      )
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request)
        .then(r => { caches.open(CACHE).then(c => c.put(event.request, r.clone())); return r; })
        .catch(() => caches.match('/index.html'))
    )
  );
});

self.addEventListener('push', event => {
  if (!event.data) return;
  const d = event.data.json();
  event.waitUntil(
    self.registration.showNotification(d.title || 'PrixMalin', {
      body: d.body, icon: '/icons/icon-192.png', data: { url: d.url || '/' }
    })
  );
});