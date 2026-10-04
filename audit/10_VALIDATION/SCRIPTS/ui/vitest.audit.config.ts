import path from 'node:path'
const fe = path.resolve(__dirname, '../../../../frontend-next')
// Config Agent 8 : identique a frontend-next/vitest.config.ts, limitee au test d'audit (le projet n'est pas modifie).
// defineConfig est l'identite : on exporte l'objet directement (le dossier audit/ n'a pas de node_modules).
export default {
  root: fe,
  oxc: { jsx: { runtime: 'automatic' } },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: [
      { find: /^react$/, replacement: path.resolve(fe, 'node_modules/react/index.js') },
      { find: /^react-dom$/, replacement: path.resolve(fe, 'node_modules/react-dom/index.js') },
      { find: /^@testing-library\/react$/, replacement: path.resolve(fe, 'node_modules/@testing-library/react') },
      { find: 'server-only', replacement: path.resolve(fe, './vitest.server-only-stub.js') },
      { find: '@', replacement: path.resolve(fe, './src') },
    ],
  },
  server: { fs: { strict: false } },
  test: {
    pool: 'forks', isolate: false, fileParallelism: false, environment: 'jsdom',
    setupFiles: [path.resolve(fe, './vitest.setup.ts')], testTimeout: 10000,
    dir: path.resolve(__dirname),
    include: ['**/*.test.tsx'],
  },
}
