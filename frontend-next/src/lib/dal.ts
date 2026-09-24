import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getSession, type SessionPayload } from './session'

// Vérifie la session et redirige vers /connexion si invalide.
// Préserve l'URL de redirection pour que l'utilisateur revienne sur la page demandée après connexion.
// cache() évite les appels dupliqués dans le même render React.
export const verifySession = cache(async (customRedirectPath?: string): Promise<SessionPayload> => {
  const session = await getSession()
  if (!session?.userId) {
    let target = customRedirectPath || ''
    if (!target) {
      try {
        const h = await headers()
        target = h.get('x-invoke-path') || h.get('x-pathname') || ''
      } catch (e) {
        console.warn('[DAL:verifySession] Headers request inaccessibles:', (e as Error)?.message)
      }
    }
    const safeTarget = target.startsWith('/') && !target.startsWith('//') ? target : ''
    const redirectUrl = safeTarget ? `/connexion?redirect=${encodeURIComponent(safeTarget)}` : '/connexion'
    redirect(redirectUrl)
  }
  return session
})

// Retourne la session sans rediriger — pour les composants qui affichent
// du contenu différent selon l'état de connexion (navbar, etc.)
export const getOptionalSession = cache(async (): Promise<SessionPayload | null> => {
  return getSession()
})
