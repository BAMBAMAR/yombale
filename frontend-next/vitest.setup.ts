import { vi, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// @testing-library/react ne nettoie pas automatiquement le DOM entre les
// tests quand le framework n'utilise pas son API de test globale (`globals:
// true` n'est pas activé ici, cf. commentaire ci-dessous sur `cache`) — sans
// cet append explicite, les rendus de tests précédents s'accumulaient dans
// `document.body` et faisaient échouer `getByText` avec "multiple elements
// found" dès le 2e test d'un même fichier.
afterEach(() => {
  cleanup()
})

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
