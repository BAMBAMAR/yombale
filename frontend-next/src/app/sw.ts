import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkFirst, NetworkOnly, StaleWhileRevalidate, CacheFirst, ExpirationPlugin } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope & typeof globalThis;

// ── Version du cache — incrémenter à chaque déploiement pour forcer purge ──
const CACHE_VERSION = 'v6';
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

const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#1e293b" rx="16"/>
  <path d="M70 120 L100 80 L130 120 Z" fill="#475569"/>
  <circle cx="130" cy="70" r="12" fill="#475569"/>
  <text x="100" y="155" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="sans-serif" font-weight="bold">Image Hors-Ligne</text>
</svg>`;

// ── Helpers pour exclure les URLs externes du routing SW ─────────────────
function isExternalTracker(url: URL): boolean {
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
    // 0. Exclure les URLs externes d'analytics/trackers
    {
      matcher: ({ url }) => isExternalTracker(url),
      handler: new NetworkOnly(),
    },
    // 1. /api/ping — NetworkOnly STRICT en premier (ne jamais cacher)
    {
      matcher: ({ url }) => url.pathname === '/api/ping',
      handler: new NetworkOnly(),
    },
    // 2. Navigation HTML — NetworkFirst avec timeout 2s
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
    // 3. Requêtes RSC (_rsc=...) — NetworkFirst
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
    // 4. Routes API internes (/api/) — NetworkFirst (sauf /api/ping)
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
    // 5. Manifest & PWA Meta — CacheFirst
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
    // 6. Assets statiques (CSS, JS, images locales et distantes) — StaleWhileRevalidate
    {
      matcher: ({ request, url }) =>
        request.destination === "style" ||
        request.destination === "script" ||
        request.destination === "image" ||
        url.pathname.startsWith("/_next/static/") ||
        url.hostname.includes("unsplash.com") ||
        url.hostname.includes("cloudinary.com") ||
        url.hostname.includes("wsrv.nl") ||
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

// ── Gestionnaire de secours d'urgence (Offline Catch Handler) ────────────
serwist.setCatchHandler(async ({ request }: any) => {
  const url = request.url ? new URL(request.url) : null;

  // 1. Document HTML / Navigation
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

  // 2. Images (locales ou distantes) non disponibles en cache → SVG Fallback propre
  if (
    request.destination === "image" ||
    (url && url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif)$/i) !== null)
  ) {
    const cachedAsset = await caches.match(request, { ignoreSearch: true });
    if (cachedAsset) return cachedAsset;
    return new Response(PLACEHOLDER_SVG, {
      status: 200,
      headers: { "Content-Type": "image/svg+xml; charset=utf-8" },
    });
  }

  // 3. Next.js RSC data requests (_rsc=...)
  if (url && url.searchParams.has("_rsc")) {
    const cachedRsc = await caches.match(request, { ignoreSearch: true });
    if (cachedRsc) return cachedRsc;
  }

  // 4. Assets statiques (JS, CSS, fonts)
  if (
    request.destination === "style" ||
    request.destination === "script" ||
    (url && (url.pathname.includes("/_next/static/") || url.pathname.match(/\.(css|js)$/i) !== null))
  ) {
    const cachedAsset = await caches.match(request, { ignoreSearch: true });
    if (cachedAsset) return cachedAsset;
  }

  // 5. API / ping / fallback général → Réponse HTTP 504 propre (au lieu de Response.error() qui crashe les FetchEvent)
  return new Response(
    JSON.stringify({ error: "Réseau indisponible (Mode Hors-Ligne PWA)", offline: true }),
    {
      status: 504,
      headers: { "Content-Type": "application/json" },
    }
  );
});

// ── Gestion de la mise à jour immédiate (Skip Waiting) ─────────────────────
self.addEventListener("message", (event: any) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    (self as any).skipWaiting();
  }
});

// ── Synchronisation en Arrière-Plan (Background Sync) ─────────────────────
self.addEventListener("sync", (event: any) => {
  if (event.tag === "nopalou-sync-offline-sales" || event.tag === "nopalou-sync-orders") {
    event.waitUntil(
      caches.open(`nopalou-api-cache-${CACHE_VERSION}`).then(async () => {
        console.log(`[SW Sync] Synchronisation des opérations hors-ligne (${event.tag})...`);
      }).catch(() => {})
    );
  }
});

// ── Synchronisation Périodique en Arrière-Plan (Periodic Background Sync) ──
self.addEventListener("periodicsync", (event: any) => {
  if (event.tag === "nopalou-price-alerts-sync" || event.tag === "nopalou-daily-catalog-sync") {
    event.waitUntil(
      caches.open(`nopalou-api-cache-${CACHE_VERSION}`).then(async () => {
        console.log(`[SW PeriodicSync] Mise à jour périodique des alertes prix (${event.tag})...`);
      }).catch(() => {})
    );
  }
});

// ── Notifications Push & Alertes de Baisse de Prix (Push Notifications) ──
self.addEventListener("push", (event: any) => {
  let data = {
    title: "Nopalou Sénégal",
    body: "Baisse de prix détectée sur vos articles suivis !",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    url: "/",
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      data: { url: data.url },
      vibrate: [100, 50, 100],
      tag: "nopalou-notification",
    })
  );
});

self.addEventListener("notificationclick", (event: any) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    (self as any).clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList: any[]) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.navigate(targetUrl).then((c: any) => c.focus());
        }
      }
      if ((self as any).clients.openWindow) {
        return (self as any).clients.openWindow(targetUrl);
      }
    })
  );
});

serwist.addEventListeners();
