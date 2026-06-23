import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getSession, type SessionPayload } from './session'

// Vérifie la session et redirige vers /connexion si invalide.
// cache() évite les appels dupliqués dans le même render React.
export const verifySession = cache(async (): Promise<SessionPayload> => {
  const session = await getSession()
  if (!session?.userId) redirect('/connexion')
  return session
})

// Retourne la session sans rediriger — pour les composants qui affichent
// du contenu différent selon l'état de connexion (navbar, etc.)
export const getOptionalSession = cache(async (): Promise<SessionPayload | null> => {
  return getSession()
})
