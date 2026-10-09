// frontend-next/public/surga/sw.js
// Service worker de Surga. Portée : « /surga » sur le domaine principal, « / » sur le sous-domaine surga.*
// Peu de données : rien n'est téléchargé d'avance en dehors de la page et de ses icônes ; le reste entre en cache
// au fil de l'usage. Hors ligne : la page, son JavaScript et ses styles sont relus depuis le cache.

const SURGA_CACHE_NAME = 'surga-pwa-v4';
const isSubdomain = self.location.hostname.startsWith('surga.');
const PAGE = isSubdomain ? '/' : '/surga';

// Sur le domaine principal, « / » est la page d'accueil de Nopalou : elle n'a rien à faire dans ce cache.
const STATIC_ASSETS = [PAGE, '/surga/manifest.json', '/surga/icons/icon-192.png', '/surga/icons/icon-512.png', '/surga/surga-symbol.png'];

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

const garder = (request, response) => {
  if (response && response.status === 200 && response.type === 'basic') {
    const copie = response.clone();
    caches.open(SURGA_CACHE_NAME).then((cache) => cache.put(request, copie));
  }
  return response;
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Ce worker ne contrôle que des pages de Surga : toute demande vient d'elles. Seules les ressources du site sont
  // gérées ; l'API garde le réseau (l'application tient elle-même la copie de ses données).
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Fichiers du build : leur nom change à chaque version, le cache d'abord.
  // SRG-A3-012 : ils n'étaient pas gardés sur le domaine principal ; hors ligne, la page se rechargeait sans son code.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((enCache) => enCache || fetch(request).then((reponse) => garder(request, reponse)))
    );
    return;
  }

  // Le reste : réseau d'abord, cache en secours.
  event.respondWith(
    fetch(request)
      .then((reponse) => garder(request, reponse))
      .catch(async () => {
        const enCache = await caches.match(request);
        if (enCache) return enCache;
        // Navigation hors ligne vers une adresse non gardée (« /surga?tab=notes ») : la page de Surga, qui lit l'onglet.
        if (request.mode === 'navigate') {
          const page = await caches.match(PAGE);
          if (page) return page;
        }
        return new Response('Contenu indisponible hors-ligne', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })
  );
});

// ── Notifications ────────────────────────────────────────────────────────────

// SRG-A1-029 : l'adresse « /surga/agenda » n'existe pas (404). L'agenda s'ouvre par « ?tab=agenda ».
const AGENDA = `${PAGE}?tab=agenda`;
// Une adresse reçue du serveur est toujours écrite pour le domaine principal ; sur le sous-domaine, « /surga » tombe.
const adresseLocale = (adresse) => {
  if (!adresse) return AGENDA;
  if (!isSubdomain) return adresse;
  const sans = adresse.replace(/^\/surga(?=$|[/?#])/, '');
  return sans.startsWith('/') ? sans : `/${sans}`;
};

self.addEventListener('push', (event) => {
  let data = {
    title: 'Surga — Rappel',
    body: 'Vous avez un rappel programmé.',
    icon: '/surga/icon-192.png',
    badge: '/surga/icon-192.png',
    url: AGENDA,
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
      ...data.data,
      url: adresseLocale(data.url),
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = adresseLocale(event.notification.data && event.notification.data.url);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Une fenêtre de Surga est déjà ouverte : elle est amenée sur l'écran visé, puis mise au premier plan.
      const ouverte = clientList.find((client) => new URL(client.url).pathname.startsWith(PAGE));
      if (ouverte && 'navigate' in ouverte) {
        return ouverte.navigate(targetUrl).then((client) => (client && 'focus' in client ? client.focus() : undefined));
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
