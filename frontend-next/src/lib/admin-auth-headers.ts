/**
 * lib/admin-auth-headers.ts
 * Helper partage pour construire les headers d authentification admin.
 * Centralise la logique dupliquee entre :
 *   - app/admin/(protected)/developer/actions.ts
 *   - app/admin/(protected)/developer/page.tsx
 *   - app/api/boutiques/[id]/[...path]/route.ts
 */

import { cookies } from 'next/headers'

/**
 * Construit les headers d auth admin a partir du cookie de session.
 * A utiliser dans les Server Components et Server Actions uniquement (contexte serveur).
 */
export async function getAdminAuthHeaders(): Promise<Record<string, string>> {
  const jar = await cookies()
  const token = jar.get('nopalou_admin_jwt')?.value || jar.get('nopalou_admin')?.value || ''
  return buildAdminAuthHeaders(token)
}

/**
 * Construit les headers d auth admin a partir d un token deja resolu.
 * A utiliser quand le token est deja disponible (ex: page.tsx qui a deja lu le cookie).
 */
export function buildAdminAuthHeaders(token: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token.startsWith('eyJ')) {
    headers['Authorization'] = `Bearer ${token}`
    headers['Cookie'] = `nopalou_admin_jwt=${token}`
    headers['X-Admin-Secret'] = token
  } else if (token) {
    headers['X-Admin-Secret'] = token
    headers['Cookie'] = `nopalou_admin=${token}`
  }

  return headers
}
