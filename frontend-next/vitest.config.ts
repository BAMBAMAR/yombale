import { defineConfig } from 'vitest/config'
import path from 'node:path'

// Le tsconfig.json du projet a `jsx: "preserve"` (requis par Next.js), ce qui
// fait échouer la transformation par défaut de Vitest ("invalid JS syntax"
// sur du JSX). On force ici la transformation JSX pour les tests uniquement,
// sans toucher au tsconfig.json partagé avec le build Next.js.
export default defineConfig({
  oxc: {
    jsx: 'automatic',
  },
  resolve: {
    alias: [
      // `server-only` lève une erreur inconditionnelle en dehors du build
      // webpack/turbopack de Next.js (qui le remplace normalement par un
      // no-op côté client bundle). Plusieurs modules serveur importés
      // transitivement par BoutiqueClient.tsx (actions.ts, app/actions/*)
      // l'utilisent ; neutralisé ici pour permettre l'exécution sous
      // Vitest, sans changer le comportement du build Next.js réel.
      { find: 'server-only', replacement: path.resolve(__dirname, './vitest.server-only-stub.js') },
      // Alias `@/*` (défini dans tsconfig.json pour Next.js), répliqué ici
      // car Vitest ne lit pas les `paths` de tsconfig.json.
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
})
