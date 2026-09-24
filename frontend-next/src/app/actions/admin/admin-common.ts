/**
 * Utilitaires, constantes et types partagés pour les Server Actions Admin
 * (Sans directive 'use server' pour permettre l'export de fonctions synchrones et constantes)
 */

export const BACKEND = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://yombale.onrender.com'
).replace(/\/$/, '')
export const COOKIE_SECRET = 'nopalou_admin'
export const COOKIE_JWT    = 'nopalou_admin_jwt'
export const COOKIE        = COOKIE_SECRET

export function extractAdminToken(jar: { get: (name: string) => { value: string } | undefined }): string | undefined {
  return jar.get(COOKIE_JWT)?.value || jar.get(COOKIE_SECRET)?.value
}

export interface AdminUserSession {
  id: string
  nom: string
  email: string
  role: 'super_admin' | 'admin_operationnel' | 'support_client' | 'moderateur' | 'finance'
  permissions: string[]
}

export function adminHeaders(secretOrJwt?: string): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const masterSecret = process.env.ADMIN_SECRET

  if (secretOrJwt) {
    if (secretOrJwt.startsWith('eyJ')) {
      headers['Authorization'] = `Bearer ${secretOrJwt}`
      headers['Cookie'] = `${COOKIE_JWT}=${secretOrJwt}`
    } else {
      headers['X-Admin-Secret'] = secretOrJwt
    }
  }

  // Si ADMIN_SECRET est présent dans l'environnement serveur, l'injecter en fallback
  if (masterSecret && !headers['X-Admin-Secret']) {
    headers['X-Admin-Secret'] = masterSecret
  }

  return headers
}
