// frontend-next/public/surga/sw.js
// Service Worker dédié à l'application Surga (compatible scope / ou /surga/)
// Cache Low-Data & Support Hors-Ligne

const SURGA_CACHE_NAME = 'surga-pwa-v2';
const STATIC_ASSETS = [
  '/',
  '/surga',
  '/surga/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

const isSubdomain = self.location.hostname.startsWith('surga.');

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

  // Gérer si sous-domaine surga.* OU chemin /surga
  const isSurgaScope = isSubdomain || url.pathname.startsWith('/surga');
  if (!isSurgaScope) {
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
        // Si document HTML, fallback sur la page racine de surga ou racine sous-domaine
        if (event.request.mode === 'navigate') {
          const fallbackUrl = isSubdomain ? '/' : '/surga';
          const matchFallback = await caches.match(fallbackUrl);
          if (matchFallback) return matchFallback;
          return caches.match('/surga');
        }
        return new Response('Contenu indisponible hors-ligne', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })
  );
});

// ── Gestion Web Push & Notifications d'arrière-plan ──────────────────────────

self.addEventListener('push', (event) => {
  let data = {
    title: 'Surga — Rappel',
    body: 'Vous avez un rappel programmé.',
    icon: '/surga/icon-192.png',
    badge: '/surga/icon-192.png',
    url: isSubdomain ? '/agenda' : '/surga/agenda',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/surga/icon-192.png',
    badge: data.badge || '/surga/icon-192.png',
    tag: data.tag || 'surga-notif',
    renotify: true,
    data: {
      url: data.url || (isSubdomain ? '/agenda' : '/surga/agenda'),
      ...data.data,
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : (isSubdomain ? '/' : '/surga');

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si une fenêtre est déjà ouverte, la focaliser et naviguer
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

