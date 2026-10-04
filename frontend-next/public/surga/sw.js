// frontend-next/public/surga/sw.js
// Service Worker dédié à l'application Surga (scope: /surga/)
// Cache Low-Data & Support Hors-Ligne

const SURGA_CACHE_NAME = 'surga-pwa-v1';
const STATIC_ASSETS = [
  '/surga',
  '/surga/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SURGA_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SURGA SW] Échec mise en cache initiale:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key.startsWith('surga-') && key !== SURGA_CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ne gérer que les requêtes dans le scope /surga
  if (!url.pathname.startsWith('/surga')) {
    return;
  }

  // Ne pas intercepter les requêtes API (laisser le réseau avec repli client)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Stratégie Network-first avec fallback Cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(SURGA_CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        // Si document HTML, fallback sur la page racine de surga
        if (event.request.mode === 'navigate') {
          return caches.match('/surga');
        }
        return new Response('Contenu indisponible hors-ligne', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })
  );
});
