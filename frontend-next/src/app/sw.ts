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
  navigationPreload: true,
  runtimeCaching: [
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline.html",
        matcher({ request }: any) {
          if (!request || request.destination !== "document") return false;
          const href = request.url || "";
          const pathname = new URL(href, self.location.href).pathname;
          // Ne jamais intercepter les pages de compte, de boutique, de caisse POS, d'admin ou d'API avec l'écran hors-ligne
          if (
            pathname.startsWith("/compte") ||
            pathname.startsWith("/boutique") ||
            pathname.startsWith("/admin") ||
            pathname.startsWith("/deposer") ||
            pathname.startsWith("/mes-") ||
            pathname.startsWith("/api")
          ) {
            return false;
          }
          return true;
        },
      },
    ],
  },
});

serwist.addEventListeners();
