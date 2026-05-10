const CACHE  = 'yombale-v2';
const ASSETS = ['/', '/index.html', '/style.css', '/app.js'];

// ── Installation : mise en cache des assets statiques ─────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activation : suppression des anciens caches ───────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch : stratégie Network-First ──────────────────────────
// Les appels API passent toujours par le réseau (jamais mis en cache).
// Les assets statiques utilisent Network-First : on demande au réseau
// en priorité et on ne tombe sur le cache qu'en cas d'échec réseau.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // ── Requêtes API : réseau uniquement, jamais de cache ────────
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: 'Hors ligne — vérifiez votre connexion.' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // ── Assets statiques : Network-First ─────────────────────────
  // 1. On tente le réseau.
  // 2. Si ça marche, on met la réponse en cache puis on la retourne.
  // 3. Si le réseau échoue (offline), on sert depuis le cache.
  // 4. Si ni réseau ni cache, on retourne index.html (SPA fallback).
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Mettre à jour le cache avec la version fraîche
        const clone = networkResponse.clone();
        caches.open(CACHE).then(c => c.put(event.request, clone));
        return networkResponse;
      })
      .catch(() =>
        caches.match(event.request)
          .then(cached => cached || caches.match('/index.html'))
      )
  );
});

// ── Notifications Push ────────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  const d = event.data.json();
  event.waitUntil(
    self.registration.showNotification(d.title || 'Yombale', {
      body: d.body,
      icon: '/icons/icon-192.png',
      data: { url: d.url || '/' }
    })
  );
});
