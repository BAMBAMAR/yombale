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
      { find: 'server-only', replacement: path.resolve(__dirname, './vitest.server-only-stub.js') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
  },
  test: {
    pool: 'forks',
    isolate: false,
    fileParallelism: false,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    testTimeout: 10000,
  },
})
