// [SUPPRIMÉ] import { defaultCache } — En dev, c'est un catch-all NetworkOnly(/.*/i) qui cassait l'offline
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkFirst, NetworkOnly, StaleWhileRevalidate, ExpirationPlugin, CacheFirst } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope & typeof globalThis;

// ── Version du cache — incrémenter à chaque déploiement pour forcer purge ──
const CACHE_VERSION = 'v4';
const CACHE_NAMES = [
  `nopalou-html-cache-${CACHE_VERSION}`,
  `nopalou-rsc-cache-${CACHE_VERSION}`,
  `nopalou-api-cache-${CACHE_VERSION}`,
  `nopalou-pwa-meta-cache-${CACHE_VERSION}`,
  `nopalou-assets-cache-${CACHE_VERSION}`,
  'nopalou-offline-fallback-v1',
  'serwist-precache',
];

const FALLBACK_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Hors-Ligne — Nopalou Sénégal</title>
<style>
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f172a; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #f8fafc; text-align: center; padding: 24px; box-sizing: border-box; }
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

// ── Helpers pour exclure les URLs externes du routing SW ─────────────────
function isExternalUrl(url: URL): boolean {
  return (
    url.hostname.includes('google') ||
    url.hostname.includes('googletagmanager') ||
    url.hostname.includes('google-analytics') ||
    url.hostname.includes('doubleclick') ||
    url.hostname.includes('facebook') ||
    url.hostname.includes('analytics')
  );
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: [
    // 0. Exclure les URLs externes (analytics, trackers) — ne jamais cacher ni router
    {
      matcher: ({ url }) => isExternalUrl(url),
      handler: new NetworkOnly(),
    },
    // 1. /api/ping — NetworkOnly STRICT en premier (ne jamais cacher)
    //    Cette règle doit être avant le matcher /api/* pour garantir qu'elle s'applique en premier.
    {
      matcher: ({ url }) => url.pathname === '/api/ping',
      handler: new NetworkOnly(),
    },
    // 2. Navigation HTML (pages visitées) — NetworkFirst avec cache 7j, timeout réduit à 2s
    {
      matcher: ({ request }) =>
        request.mode === "navigate" ||
        (request.method === "GET" && request.headers.get("accept")?.includes("text/html") === true),
      handler: new NetworkFirst({
        cacheName: `nopalou-html-cache-${CACHE_VERSION}`,
        networkTimeoutSeconds: 2,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60 * 7,
          }),
        ],
      }),
    },
    // 3. Requêtes RSC (Next.js client navigation _rsc=...) — NetworkFirst
    {
      matcher: ({ url }) => url.searchParams.has("_rsc"),
      handler: new NetworkFirst({
        cacheName: `nopalou-rsc-cache-${CACHE_VERSION}`,
        networkTimeoutSeconds: 2,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 80,
            maxAgeSeconds: 24 * 60 * 60 * 3,
          }),
        ],
      }),
    },
    // 4. Routes API internes (/api/) — NetworkFirst pour données offline (sauf /api/ping déjà géré)
    {
      matcher: ({ url }) =>
        url.pathname.startsWith("/api/") && url.pathname !== "/api/ping",
      handler: new NetworkFirst({
        cacheName: `nopalou-api-cache-${CACHE_VERSION}`,
        networkTimeoutSeconds: 2,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 24 * 60 * 60 * 1,
          }),
        ],
      }),
    },
    // 5. manifest.json et icons — CacheFirst (rarement modifiés)
    {
      matcher: ({ url }) =>
        url.pathname === '/manifest.json' || url.pathname.startsWith('/icons/'),
      handler: new CacheFirst({
        cacheName: `nopalou-pwa-meta-cache-${CACHE_VERSION}`,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 20,
            maxAgeSeconds: 24 * 60 * 60 * 30,
          }),
        ],
      }),
    },
    // 6. Assets statiques (CSS, JS, images) — StaleWhileRevalidate
    {
      matcher: ({ request, url }) =>
        request.destination === "style" ||
        request.destination === "script" ||
        request.destination === "image" ||
        url.pathname.startsWith("/_next/static/") ||
        url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|css|js)$/i) !== null,
      handler: new StaleWhileRevalidate({
        cacheName: `nopalou-assets-cache-${CACHE_VERSION}`,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 200,
            maxAgeSeconds: 24 * 60 * 60 * 30,
          }),
        ],
      }),
    },
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline.html",
        matcher({ request }: any) {
          if (!request || request.destination !== "document") return false;
          try {
            const url = new URL(request.url);
            if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) {
              return false;
            }
          } catch {}
          return true;
        },
      },
    ],
  },
});

// ── Installation : pré-cacher /offline.html ───────────────────────────────
self.addEventListener("install", (event: any) => {
  event.waitUntil(
    caches.open("nopalou-offline-fallback-v1").then((cache) => {
      return cache.put(
        "/offline.html",
        new Response(FALLBACK_HTML, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        })
      );
    }).catch(() => {})
  );
});

// ── Activation : purger tous les caches de versions précédentes ───────────
self.addEventListener("activate", (event: any) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      const toDelete = keys.filter((key) => {
        // Conserver uniquement les caches de la version actuelle
        const isCurrentVersion = CACHE_NAMES.some((name) => key === name);
        const isPrecache = key.startsWith('serwist-precache');
        return !isCurrentVersion && !isPrecache;
      });

      if (toDelete.length > 0) {
        console.log(`[SW ${CACHE_VERSION}] Purge de ${toDelete.length} cache(s) obsolète(s):`, toDelete);
        await Promise.all(toDelete.map((key) => caches.delete(key)));
      }
    })
  );
});

serwist.setCatchHandler(async ({ request }: any) => {
  // Handle HTML document navigations offline
  if (
    request.destination === "document" ||
    request.mode === "navigate" ||
    request.headers?.get("accept")?.includes("text/html")
  ) {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;
    const fallback = await caches.match("/offline.html", { ignoreSearch: true });
    if (fallback) return fallback;
    return new Response(FALLBACK_HTML, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Handle Next.js RSC data requests (_rsc=...) offline
  if (request.url && request.url.includes("_rsc=")) {
    const cachedRsc = await caches.match(request, { ignoreSearch: true });
    if (cachedRsc) return cachedRsc;
    return Response.error();
  }

  // Handle static assets (JS, CSS, images, _next/static) offline
  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image" ||
    (request.url &&
      (request.url.includes("/_next/static/") ||
        request.url.match(/\.(png|jpg|jpeg|svg|webp|gif|css|js)$/i) !== null))
  ) {
    const cachedAsset = await caches.match(request, { ignoreSearch: true });
    if (cachedAsset) return cachedAsset;
  }

  // API et autres → erreur réseau propre (pas de faux HTTP 200)
  return Response.error();
});

serwist.addEventListeners();
