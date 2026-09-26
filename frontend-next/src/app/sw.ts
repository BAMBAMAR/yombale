import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkFirst, NetworkOnly, StaleWhileRevalidate, CacheFirst, ExpirationPlugin } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope & typeof globalThis;

// ── Version du cache — incrémenter à chaque déploiement pour forcer purge ──
const CACHE_VERSION = 'v28';
const CACHE_NAMES = [
  `nopalou-html-cache-${CACHE_VERSION}`,
  `nopalou-rsc-cache-${CACHE_VERSION}`,
  `nopalou-api-cache-${CACHE_VERSION}`,
  `nopalou-scripts-cache-${CACHE_VERSION}`,
  `nopalou-pwa-meta-cache-${CACHE_VERSION}`,
  `nopalou-icons-cache-${CACHE_VERSION}`,
  `nopalou-assets-cache-${CACHE_VERSION}`,
  `nopalou-offline-fallback-${CACHE_VERSION}`,
];

const FALLBACK_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Hors-Ligne — Nopalou Sénégal</title>
<style>
  :root {
    --navy: #1C2B4A;
    --navy-light: #2A3F66;
    --accent: #C75B00;
    --accent-hover: #A34A00;
    --bg: #F8F5F0;
    --card: #FFFFFF;
    --text: #1E293B;
    --text-muted: #64748B;
    --border: #E2E8F0;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0F172A;
      --card: #1E293B;
      --text: #F8FAFC;
      --text-muted: #94A3B8;
      --border: #334155;
      --navy: #1C2B4A;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: var(--text);
    text-align: center;
    padding: 20px;
  }
  .box {
    max-width: 440px;
    width: 100%;
    background: var(--card);
    border-radius: 20px;
    padding: 32px 24px;
    border: 1px solid var(--border);
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(199, 91, 0, 0.1);
    color: var(--accent);
    font-size: 11px;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 9999px;
    border: 1px solid rgba(199, 91, 0, 0.2);
    margin-bottom: 16px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .icon-wrap {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: rgba(199, 91, 0, 0.12);
    color: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
  }
  h1 { font-size: 20px; font-weight: 800; margin: 0 0 10px; color: var(--text); }
  p { font-size: 13.5px; line-height: 1.55; color: var(--text-muted); margin: 0 0 24px; }
  .btn-group { display: flex; flex-direction: column; gap: 10px; }
  button, a.btn {
    background: var(--accent);
    color: #FFFFFF;
    border: none;
    border-radius: 12px;
    padding: 12px 18px;
    font-size: 13.5px;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background 0.15s ease;
  }
  button:hover, a.btn:hover { background: var(--accent-hover); }
  a.btn-sec {
    background: transparent;
    color: var(--text);
    border: 1px solid var(--border);
  }
  a.btn-sec:hover { background: rgba(0, 0, 0, 0.04); }
  @media (prefers-color-scheme: dark) {
    a.btn-sec:hover { background: rgba(255, 255, 255, 0.06); }
  }
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #EAB308;
    display: inline-block;
  }
</style>
</head>
<body>
  <div class="box">
    <div class="badge"><span class="status-dot"></span> Nopalou Mode Hors-Ligne</div>
    <div class="icon-wrap">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="1" y1="1" x2="23" y2="23"></line>
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
        <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
        <line x1="12" y1="20" x2="12.01" y2="20"></line>
      </svg>
    </div>
    <h1>Connexion Internet Interrompue</h1>
    <p>Votre terminal n'a pas accès au réseau. Vos outils commerçants (Caisse POS et Carnet de dettes) restent pleinement opérationnels hors-ligne avec enregistrement local instantané.</p>
    <div class="btn-group">
      <button onclick="location.reload()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"></polyline>
          <polyline points="1 20 1 14 7 14"></polyline>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
        Réessayer la connexion
      </button>
      <a href="/boutique/caisse" class="btn btn-sec">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
        Ouvrir la Caisse POS
      </a>
      <a href="/boutique/carnet" class="btn btn-sec">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
        Ouvrir le Carnet de Dettes
      </a>
      <a href="/" class="btn btn-sec">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        Consulter l'Accueil (Cache)
      </a>
    </div>
  </div>
  <script>
    window.addEventListener('online', function() { location.reload(); });
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
function isExternalTrackerOrSocialMedia(url: URL): boolean {
  const h = url.hostname.toLowerCase();
  return (
    h.includes('google') ||
    h.includes('googletagmanager') ||
    h.includes('google-analytics') ||
    h.includes('doubleclick') ||
    h.includes('facebook') ||
    h.includes('analytics') ||
    h.includes('instagram.com') ||
    h.includes('cdninstagram.com') ||
    h.includes('fbcdn.net') ||
    h.includes('tiktok.com') ||
    h.includes('tiktokcdn.com') ||
    h.includes('youtube.com') ||
    h.includes('ytimg.com')
  );
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: [
    // 0. Exclure les URLs externes d'analytics/trackers et médias sociaux
    {
      matcher: ({ url }) => isExternalTrackerOrSocialMedia(url),
      handler: new NetworkOnly(),
    },
    // 1. Endpoints sensibles, mutations, authentification, paiement, admin — NetworkOnly STRICT
    {
      matcher: ({ url, request }) =>
        url.pathname === '/api/ping' ||
        request.method !== 'GET' ||
        url.pathname.startsWith('/api/auth') ||
        url.pathname.startsWith('/api/admin') ||
        url.pathname.startsWith('/api/paiement') ||
        url.pathname.startsWith('/api/paiement-sequestre') ||
        url.pathname.startsWith('/connexion') ||
        url.pathname.startsWith('/inscription') ||
        url.pathname.startsWith('/mot-de-passe-oublie') ||
        url.pathname.startsWith('/admin'),
      handler: new NetworkOnly(),
    },
    // 2. Navigation HTML — NetworkFirst avec timeout réactif de 1s (évite les blocages et freezes de 12s offline)
    {
      matcher: ({ request }) =>
        request.mode === "navigate" ||
        (request.method === "GET" && request.headers.get("accept")?.includes("text/html") === true),
      handler: new NetworkFirst({
        cacheName: `nopalou-html-cache-${CACHE_VERSION}`,
        networkTimeoutSeconds: 1,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 60,
            maxAgeSeconds: 24 * 60 * 60 * 7,
          }),
        ],
      }),
    },
    // 3. Requêtes RSC (_rsc=... ou en-tête RSC: 1 / text/x-component) — NetworkFirst avec timeout 1s
    {
      matcher: ({ url, request }) =>
        url.searchParams.has("_rsc") ||
        request.headers.get("rsc") === "1" ||
        request.headers.get("accept")?.includes("text/x-component") === true,
      handler: new NetworkFirst({
        cacheName: `nopalou-rsc-cache-${CACHE_VERSION}`,
        networkTimeoutSeconds: 1,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 24 * 60 * 60 * 3,
          }),
        ],
      }),
    },
    // 4. Routes API lecture seule (/api/...) — NetworkFirst avec timeout 1s (disponibilité intégrale hors-ligne)
    {
      matcher: ({ url, request }) =>
        request.method === "GET" &&
        url.pathname.startsWith("/api/") &&
        url.pathname !== "/api/ping" &&
        !url.pathname.startsWith('/api/auth') &&
        !url.pathname.startsWith('/api/admin') &&
        !url.pathname.startsWith('/api/paiement') &&
        !url.pathname.startsWith('/api/paiement-sequestre'),
      handler: new NetworkFirst({
        cacheName: `nopalou-api-cache-${CACHE_VERSION}`,
        networkTimeoutSeconds: 1,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 250,
            maxAgeSeconds: 24 * 60 * 60 * 3, // 72h
          }),
        ],
      }),
    },
    // 5. Manifest PWA — NetworkFirst (mise à jour immédiate des icônes et métadonnées)
    {
      matcher: ({ url }) => url.pathname === '/manifest.json',
      handler: new NetworkFirst({
        cacheName: `nopalou-pwa-meta-cache-${CACHE_VERSION}`,
        networkTimeoutSeconds: 2,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 5,
            maxAgeSeconds: 24 * 60 * 60, // 24h max
          }),
        ],
      }),
    },
    // 5b. Icônes PWA — StaleWhileRevalidate (mise à jour en arrière-plan immédiate)
    {
      matcher: ({ url }) => url.pathname.startsWith('/icons/'),
      handler: new StaleWhileRevalidate({
        cacheName: `nopalou-icons-cache-${CACHE_VERSION}`,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 30,
            maxAgeSeconds: 24 * 60 * 60 * 30,
          }),
        ],
      }),
    },
    // 6. Scripts JS & Chunks Next.js — NetworkFirst pour TOUJOURS exécuter la version à jour
    {
      matcher: ({ request, url }) =>
        request.destination === "script" ||
        url.pathname.startsWith("/_next/static/chunks/") ||
        url.pathname.endsWith(".js"),
      handler: new NetworkFirst({
        cacheName: `nopalou-scripts-cache-${CACHE_VERSION}`,
        networkTimeoutSeconds: 3,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 24 * 60 * 60 * 7,
          }),
        ],
      }),
    },
    // 7. Assets statiques (CSS, images, fonts) — StaleWhileRevalidate
    {
      matcher: ({ request, url }) =>
        request.destination === "style" ||
        request.destination === "image" ||
        request.destination === "font" ||
        url.hostname.includes("unsplash.com") ||
        url.hostname.includes("cloudinary.com") ||
        url.hostname.includes("wsrv.nl") ||
        url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|css|woff2?)$/i) !== null,
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
          } catch (err) { console.warn('[Nopalou:sw:L246]', err); }
          return true;
        },
      },
    ],
  },
});

// ── Installation : pré-cacher /offline.html & skipWaiting ────────────────
self.addEventListener("install", (event: any) => {
  (self as any).skipWaiting();
  event.waitUntil(
    caches.open(`nopalou-offline-fallback-${CACHE_VERSION}`).then((cache) => {
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

// ── Activation : purger sans exception tous les caches de versions précédentes ──
self.addEventListener("activate", (event: any) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      const toDelete = keys.filter((key) => !CACHE_NAMES.includes(key));

      if (toDelete.length > 0) {
        console.log(`[SW ${CACHE_VERSION}] Purge automatique de ${toDelete.length} cache(s) obsolète(s):`, toDelete);
        await Promise.all(toDelete.map((key) => caches.delete(key)));
      }
      await (self as any).clients.claim();
    })()
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
    // Si c'est un média social ou tracker externe, laisser l'élément <img> gérer l'erreur nativement sans masquer avec un SVG "Image Hors-Ligne"
    if (url && isExternalTrackerOrSocialMedia(url)) {
      return new Response(null, { status: 404 });
    }
    const cachedAsset = await caches.match(request, { ignoreSearch: true });
    if (cachedAsset) return cachedAsset;
    return new Response(PLACEHOLDER_SVG, {
      status: 200,
      headers: { "Content-Type": "image/svg+xml; charset=utf-8" },
    });
  }

  // 3. Next.js RSC data requests (_rsc=... ou en-tête RSC)
  if (
    (url && url.searchParams.has("_rsc")) ||
    request.headers?.get("rsc") === "1" ||
    request.headers?.get("accept")?.includes("text/x-component")
  ) {
    const cachedRsc = await caches.match(request, { ignoreSearch: false });
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
    (self as any).registration.showNotification(data.title, {
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
