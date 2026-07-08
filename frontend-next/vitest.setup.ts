import { vi } from 'vitest'

// React 18.3 (paquet public, hors runtime Next.js) n'exporte pas `cache()`
// — c'est une API React Server Components normalement fournie par le
// bundler Next.js. `src/lib/dal.ts` (importé transitivement par
// BoutiqueClient.tsx via actions.ts et app/actions/paiement.ts) l'utilise
// pour mémoïser `verifySession`/`getOptionalSession` au sein d'un même
// render. Ce polyfill se contente de retourner la fonction telle quelle
// (pas de mémoïsation) : suffisant pour que le module se charge sous
// Vitest, sans jamais être réellement appelé dans un test de fonction pure
// comme `nomParDefautPourCategorie`.
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    cache: <T extends (...args: never[]) => unknown>(fn: T): T => fn,
  }
})
