// Nopalou Service Worker — VERSION 12
// Changer CACHE_VERSION force le rechargement de tous les assets
const CACHE_VERSION = 'nopalou-v12';
const STATIC_ASSETS = ['/style.css', '/manifest.json', '/icons/icon-192.png'];

// Installation — précache uniquement les assets statiques (pas app.js)
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activation — supprimer TOUS les anciens caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(key) { return key !== CACHE_VERSION; })
          .map(function(key) {
            console.log('[SW] Suppression ancien cache:', key);
            return caches.delete(key);
          })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch — app.js et les API toujours depuis le réseau (network-first)
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Ne pas intercepter les ressources externes (Google Fonts, CDN...)
  if (url.origin !== location.origin) return;

  // API et app.js : toujours réseau, jamais cache
  if (url.pathname.startsWith('/api/') || url.pathname === '/app.js' || url.pathname === '/') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Autres assets statiques : cache-first
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      return cached || fetch(event.request).then(function(response) {
        if (response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_VERSION).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    })
  );
});
