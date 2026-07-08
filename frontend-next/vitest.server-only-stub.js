// Stubs utilisés uniquement par vitest.config.ts pour permettre l'exécution
// sous Vitest de modules qui dépendent du runtime Next.js RSC (voir le
// commentaire dans vitest.config.ts). Ne touche pas au comportement du build
// Next.js réel : ces alias ne s'appliquent qu'à la config Vitest.

// `server-only` lève une erreur inconditionnelle en dehors du build
// webpack/turbopack de Next.js (qui le remplace normalement par un no-op
// côté client bundle).
export {}
