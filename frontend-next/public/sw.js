// Service Worker PWA Nopalou — Version 10
// Auto-purging stale cache, SkipWaiting & ClientsClaim immédiat

const CACHE_VERSION = 'v10';
const CURRENT_CACHES = {
  html: `nopalou-html-cache-${CACHE_VERSION}`,
  rsc: `nopalou-rsc-cache-${CACHE_VERSION}`,
  api: `nopalou-api-cache-${CACHE_VERSION}`,
  scripts: `nopalou-scripts-cache-${CACHE_VERSION}`,
  assets: `nopalou-assets-cache-${CACHE_VERSION}`,
  meta: `nopalou-meta-cache-${CACHE_VERSION}`,
  offline: `nopalou-offline-fallback-${CACHE_VERSION}`
};

const FALLBACK_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Hors-Ligne — Nopalou Sénégal</title>
<style>
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f172a; font-family: system-ui, -apple-system, sans-serif; color: #f8fafc; text-align: center; padding: 24px; box-sizing: border-box; }
  .box { max-width: 440px; background: #1e293b; border-radius: 24px; padding: 36px 28px; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
  .badge { display: inline-block; background: rgba(199, 91, 0, 0.2); color: #fed7aa; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(199, 91, 0, 0.3); margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.05em; }
  h1 { font-size: 22px; font-weight: 900; margin: 0 0 10px; color: #ffffff; }
  p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 24px; }
  .btn-group { display: flex; flex-direction: column; gap: 12px; }
  button, a.btn { background: #C75B00; color: #ffffff; border: none; border-radius: 12px; padding: 12px 20px; font-size: 14px; font-weight: 800; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 14px rgba(199,91,0,0.3); }
  a.btn-sec { background: #334155; color: #e2e8f0; box-shadow: none; }
</style>
</head>
<body>
  <div class="box">
    <div class="badge">📡 NOPALOU PWA OFFLINE</div>
    <div style="font-size: 48px; margin-bottom: 12px;">⚡</div>
    <h1>Vous êtes actuellement Hors-Ligne</h1>
    <p>Votre connexion Internet mobile est momentanément interrompue. Les données précédemment consultées restent disponibles en cache local.</p>
    <div class="btn-group">
      <button onclick="location.reload()">🔄 Réessayer la connexion</button>
      <button onclick="window.history.back()" class="btn btn-sec">🔙 Revenir à la page précédente</button>
      <a href="/boutique/caisse" class="btn btn-sec">🛒 Retourner à la Caisse POS</a>
      <a href="/compte" class="btn btn-sec">👤 Retourner à mon compte</a>
      <a href="/" class="btn btn-sec">🏠 Consulter l'Accueil (Cache)</a>
    </div>
  </div>
  <script>
    window.addEventListener('online', function() { location.reload(); });
    if (window.history.length <= 1) {
      const backBtn = document.querySelector('button[onclick="window.history.back()"]');
      if (backBtn) backBtn.style.display = 'none';
    }
  </script>
</body>
</html>`;

const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#1e293b" rx="16"/><path d="M70 120 L100 80 L130 120 Z" fill="#475569"/><circle cx="130" cy="70" r="12" fill="#475569"/><text x="100" y="155" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="sans-serif" font-weight="bold">Image Hors-Ligne</text></svg>`;

// ── INSTALLATION ──
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CURRENT_CACHES.offline).then((cache) => {
      return cache.put(
        '/offline.html',
        new Response(FALLBACK_HTML, {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        })
      );
    }).catch(() => {})
  );
});

// ── ACTIVATION & PURGE INTÉGRALE DES ANCIENS CACHES (v8, v7, serwist-precache, etc.) ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const activeCacheValues = Object.values(CURRENT_CACHES);
      const keys = await caches.keys();
      const staleKeys = keys.filter((key) => !activeCacheValues.includes(key));
      
      if (staleKeys.length > 0) {
        console.log(`[SW ${CACHE_VERSION}] Purge automatique de ${staleKeys.length} ancien(s) cache(s):`, staleKeys);
        await Promise.all(staleKeys.map((k) => caches.delete(k)));
      }
      await self.clients.claim();
    })()
  );
});

// ── SKIP_WAITING MESSAGE LISTENER ──
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── GESTION DES REQUÊTES (FETCH EVENT) ──
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (!request || request.method !== 'GET') return;

  const url = new URL(request.url);

  // Ignorer les requêtes non-http(s) et les trackers externes
  if (!url.protocol.startsWith('http')) return;
  if (
    url.hostname.includes('google-analytics') ||
    url.hostname.includes('googletagmanager') ||
    url.hostname.includes('facebook') ||
    url.hostname.includes('doubleclick')
  ) {
    return;
  }

  // 1. /api/ping — Toujours NetworkOnly strict
  if (url.pathname === '/api/ping') {
    return;
  }

  // 2. Documents HTML / Navigation — NetworkFirst (timeout 2.5s) avec fallback cache & offline.html
  if (
    request.mode === 'navigate' ||
    (request.headers.get('accept') && request.headers.get('accept').includes('text/html'))
  ) {
    event.respondWith(
      (async () => {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Network timeout')), 2500)
          );
          const networkResponse = await Promise.race([
            fetch(request),
            timeoutPromise
          ]);
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CURRENT_CACHES.html);
            cache.put(request, networkResponse.clone()).catch(() => {});
            return networkResponse;
          }
          return networkResponse;
        } catch (err) {
          const cached = await caches.match(request, { ignoreSearch: true });
          if (cached) return cached;
          const offlineFallback = await caches.match('/offline.html', { ignoreSearch: true });
          if (offlineFallback) return offlineFallback;
          return new Response(FALLBACK_HTML, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        }
      })()
    );
    return;
  }

  // 3. Scripts JS (_next/static/chunks/...) — NetworkFirst strict pour TOUJOURS exécuter le JS à jour
  if (
    request.destination === 'script' ||
    url.pathname.startsWith('/_next/static/chunks/') ||
    url.pathname.endsWith('.js')
  ) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CURRENT_CACHES.scripts);
            cache.put(request, networkResponse.clone()).catch(() => {});
            return networkResponse;
          }
          return networkResponse;
        } catch (err) {
          const cached = await caches.match(request);
          if (cached) return cached;
          throw err;
        }
      })()
    );
    return;
  }

  // 4. Requêtes RSC (_rsc=...) — NetworkFirst
  if (url.searchParams.has('_rsc')) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CURRENT_CACHES.rsc);
            cache.put(request, networkResponse.clone()).catch(() => {});
            return networkResponse;
          }
          return networkResponse;
        } catch (err) {
          const cached = await caches.match(request, { ignoreSearch: true });
          if (cached) return cached;
          return new Response(JSON.stringify({ error: 'offline', offline: true }), {
            status: 504,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      })()
    );
    return;
  }

  // 5. API interne (/api/...) — NetworkFirst
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CURRENT_CACHES.api);
            cache.put(request, networkResponse.clone()).catch(() => {});
            return networkResponse;
          }
          return networkResponse;
        } catch (err) {
          const cached = await caches.match(request, { ignoreSearch: true });
          if (cached) return cached;
          return new Response(
            JSON.stringify({ error: 'Réseau indisponible (Mode Hors-Ligne PWA)', offline: true }),
            { status: 504, headers: { 'Content-Type': 'application/json' } }
          );
        }
      })()
    );
    return;
  }

  // 6. Assets statiques (CSS, images, fonts) — StaleWhileRevalidate
  if (
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.hostname.includes('cloudinary.com') ||
    url.hostname.includes('wsrv.nl') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|css|woff2?)$/i) !== null
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CURRENT_CACHES.assets);
        const cached = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone()).catch(() => {});
            }
            return networkResponse;
          })
          .catch(() => {
            if (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif)$/i)) {
              return new Response(PLACEHOLDER_SVG, {
                status: 200,
                headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' }
              });
            }
            return null;
          });

        return cached || fetchPromise;
      })()
    );
  }
});