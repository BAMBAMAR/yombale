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
          // Si ce n'est pas une navigation complète de page HTML, on ne sert pas l'écran hors-ligne
          if (!request || request.destination !== "document") return false;
          
          return true;
        },
      },
    ],
  },
});

serwist.addEventListeners();
