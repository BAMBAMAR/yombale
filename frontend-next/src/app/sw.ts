import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkFirst, StaleWhileRevalidate, ExpirationPlugin } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope & typeof globalThis;

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
    // Masquer le bouton de retour si on ne peut pas revenir en arrière
    if (window.history.length <= 1) {
      const backBtn = document.querySelector('button[onclick="window.history.back()"]');
      if (backBtn) backBtn.style.display = 'none';
    }
  </script>
</body>
</html>`;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: [
    // 1. Navigation HTML (pages visitées) — NetworkFirst avec cache 7j
    {
      matcher: ({ request }) => request.mode === "navigate" || (request.method === "GET" && request.headers.get("accept")?.includes("text/html")),
      handler: new NetworkFirst({
        cacheName: "nopalou-html-cache",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60 * 7, // 1 week
          }),
        ],
      }),
    },
    // 2. Requêtes RSC (Next.js client navigation _rsc=...) — NetworkFirst pour cache offline
    {
      matcher: ({ url }) => {
        return url.searchParams.has("_rsc");
      },
      handler: new NetworkFirst({
        cacheName: "nopalou-rsc-cache",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 80,
            maxAgeSeconds: 24 * 60 * 60 * 3, // 3 days
          }),
        ],
      }),
    },
    // 3. Routes API internes (/api/) — NetworkFirst pour données offline
    {
      matcher: ({ url }) => {
        return url.pathname.startsWith("/api/");
      },
      handler: new NetworkFirst({
        cacheName: "nopalou-api-cache",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 24 * 60 * 60 * 1, // 1 day
          }),
        ],
      }),
    },
    // 4. Assets statiques (CSS, JS, images) — StaleWhileRevalidate
    {
      matcher: ({ request, url }) => {
        return request.destination === "style" || 
               request.destination === "script" || 
               request.destination === "image" ||
               url.pathname.startsWith("/_next/static/") ||
               url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|css|js)$/i);
      },
      handler: new StaleWhileRevalidate({
        cacheName: "nopalou-assets-cache",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 200,
            maxAgeSeconds: 24 * 60 * 60 * 30, // 30 days
          }),
        ],
      }),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline.html",
        matcher({ request }: any) {
          if (!request || request.destination !== "document") return false;
          if (typeof self !== "undefined" && self.navigator && self.navigator.onLine === true) {
            return false;
          }
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



// Pré-cacher explicitement /offline.html lors de l'installation
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

// [SUPPRIMÉ] L'ancien fetch listener manuel a été supprimé car il court-circuitait
// les règles runtimeCaching de Serwist (NetworkFirst pour API, RSC, HTML).
// Le fallbacks.entries + setCatchHandler gèrent tout correctement.

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
  // Retourner le cache si disponible, sinon laisser React gérer l'erreur proprement
  // (ne PAS retourner "{}" car c'est un payload RSC invalide qui crashe React)
  if (request.url && request.url.includes("_rsc=")) {
    const cachedRsc = await caches.match(request, { ignoreSearch: true });
    if (cachedRsc) return cachedRsc;
    return Response.error();
  }

  // Intercepter les appels API en mode Hors-Ligne pour éviter les erreurs rouges dans la console
  if (request.url && request.url.includes("/api/")) {
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return Response.error();
});

serwist.addEventListeners();
