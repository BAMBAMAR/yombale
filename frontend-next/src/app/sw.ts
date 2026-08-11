import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope & typeof globalThis;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/offline.html",
        matcher({ request }: any) {
          // Ne pas intercepter si ce n'est pas une navigation HTML
          if (!request || request.destination !== "document") return false;

          // Si l'appareil est connecté à Internet, ne JAMAIS afficher l'écran offline.html
          if (typeof self !== "undefined" && self.navigator && self.navigator.onLine === true) {
            return false;
          }

          // Exclure les requêtes d'API et d'assets Next.js
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

serwist.addEventListeners();
