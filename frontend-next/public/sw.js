const CACHE_NAME = 'nopalou-shell-v4';
const APP_SHELL = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/icon-512.svg',
  '/icons/logo-mark.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => 
        caches.match('/offline.html', { ignoreSearch: true, ignoreVary: true })
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Secours ultime si offline.html a disparu du cache (empêche ERR_FAILED)
            return new Response(
              "<!DOCTYPE html><html lang='fr'><head><meta charset='utf-8'><title>Hors ligne</title><meta name='viewport' content='width=device-width, initial-scale=1'><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#F8F5F0;color:#333;text-align:center}</style></head><body><div><h1>Vous êtes hors ligne</h1><p>Impossible de joindre Nopalou pour le moment.</p><button onclick='location.reload()' style='padding:10px 20px;background:#C75B00;color:white;border:none;border-radius:8px;'>Réessayer</button></div></body></html>",
              { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
            );
          })
      )
    );
    return;
  }

  if (url.pathname.startsWith('/icons/') || url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached ||
        fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
      )
    );
  }
});
