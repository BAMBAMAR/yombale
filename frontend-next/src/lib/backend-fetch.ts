import 'server-only'
import { SignJWT } from 'jose'
import { getOptionalSession } from './dal'

const API = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? 'http://127.0.0.1:3000'
const SSR_SECRET = process.env.SSR_SECRET || ''

export interface ActionState {
  error?: string
  success?: boolean
}

/**
 * Client HTTP serveur unifié pour communiquer avec le backend Nopalou.
 * Gère l'authentification automatique par session JWT, les fallbacks DNS localhost/127.0.0.1, et les timeouts.
 */
export async function backendFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const session = await getOptionalSession()
  const headers = new Headers(options.headers)

  if (session?.userId) {
    const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET
    if (secret) {
      const key = new TextEncoder().encode(secret)
      const token = await new SignJWT({ userId: session.userId, email: session.email })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('2m')
        .sign(key)
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  if (SSR_SECRET) {
    headers.set('X-SSR-Token', SSR_SECRET)
  }

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const primaryUrl = `${API}${normalizedPath}`

  try {
    return await fetch(primaryUrl, { ...options, headers, signal: options.signal ?? AbortSignal.timeout(6000) })
  } catch {
    const fallbackUrl = primaryUrl.includes('127.0.0.1')
      ? primaryUrl.replace('127.0.0.1', 'localhost')
      : primaryUrl.replace('localhost', '127.0.0.1')
    return await fetch(fallbackUrl, { ...options, headers, signal: options.signal ?? AbortSignal.timeout(6000) })
  }
}

/**
 * Version authentifiée stricte : lève une erreur si l'utilisateur n'est pas connecté.
 * Assure le préfixe '/api' sur la route si manquant.
 */
export async function backendAuthFetch(path: string, init?: RequestInit): Promise<Response> {
  const session = await getOptionalSession()
  if (!session) throw new Error('Non authentifié')

  const apiPath = path.startsWith('/api') ? path : `/api${path.startsWith('/') ? path : `/${path}`}`
  return backendFetch(apiPath, init)
}
