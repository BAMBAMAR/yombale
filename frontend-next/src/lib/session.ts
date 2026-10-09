import 'server-only'
import { SignJWT, decodeJwt } from 'jose'
import { cookies } from 'next/headers'
import { verifierJetonSession } from './session-verify'

// Le cookie est relu tel quel par le backend (appels du navigateur vers /api/*), qui ne vérifie qu'avec JWT_SECRET.
// Signé avec un SESSION_SECRET distinct, il était refusé en 401 : la connexion « passait » puis le compte restait
// déconnecté. La vérification (session-verify.ts) accepte les deux clés, donc les cookies déjà émis restent lus.
const key = new TextEncoder().encode(process.env.JWT_SECRET || process.env.SESSION_SECRET)

const COOKIE_NAME = 'nopalou_session'
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 jours

export interface SessionPayload {
  userId: string
  nom?: string
  email?: string
  telephone?: string
  // Version de session du compte (utilisateurs.jwt_version). Le backend la compare à chaque appel : une
  // déconnexion ou un changement de mot de passe l'incrémente et révoque les cookies qui portent l'ancienne.
  jwtVersion?: number
}

/**
 * Version de session portée par le jeton que le backend vient d'émettre (connexion, inscription, lien magique).
 * SRG-A1-005 : le cookie signé ici ne la reprenait pas ; il restait accepté sept jours après une déconnexion.
 * Le jeton vient de la réponse du backend, reçue de serveur à serveur : il est lu, pas vérifié une seconde fois.
 */
export function versionDuJeton(token: unknown): number | undefined {
  if (typeof token !== 'string') return undefined
  try {
    const v = decodeJwt(token).jwtVersion
    return typeof v === 'number' ? v : undefined
  } catch {
    return undefined
  }
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key)
}

export async function decrypt(token: string): Promise<SessionPayload | null> {
  // Signature obligatoire (SESSION_SECRET ou JWT_SECRET backend) : un jeton non vérifié n'est jamais une session
  const payload = await verifierJetonSession(token)
  if (!payload) return null
  return {
    userId: String(payload.userId || payload.id),
    email: payload.email as string | undefined,
    nom: payload.nom as string | undefined,
    telephone: payload.telephone as string | undefined,
    jwtVersion: typeof payload.jwtVersion === 'number' ? payload.jwtVersion : undefined,
  }
}

const isSecureCookie =
  process.env.NODE_ENV === 'production' &&
  !process.env.NEXT_PUBLIC_SITE_URL?.startsWith('http://localhost') &&
  !process.env.NEXT_PUBLIC_SITE_URL?.startsWith('http://127.0.0.1')

export async function createSession(payload: SessionPayload): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
  const token = await encrypt(payload)
  const store = await cookies()
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  })
}

export async function updateSession(): Promise<void> {
  const store = await cookies()
  const token =
    store.get(COOKIE_NAME)?.value ||
    store.get('token')?.value ||
    store.get('auth_token')?.value ||
    store.get('nopalou_token')?.value ||
    store.get('session')?.value
  if (!token) return
  const payload = await decrypt(token)
  if (!payload) return
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
  const newToken = await encrypt(payload)
  store.set(COOKIE_NAME, newToken, {
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  })
}

export async function deleteSession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
  store.delete('token')
  store.delete('auth_token')
  store.delete('nopalou_token')
  store.delete('nopalou_locale')
  store.set('nopalou_locale', 'fr', {
    path: '/',
    maxAge: 31536000,
    sameSite: 'lax',
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  let token: string | undefined
  try {
    const store = await cookies()
    token =
      store.get(COOKIE_NAME)?.value ||
      store.get('token')?.value ||
      store.get('auth_token')?.value ||
      store.get('nopalou_token')?.value ||
      store.get('session')?.value
  } catch {}

  if (!token) {
    try {
      const { headers: getHeaders } = await import('next/headers')
      const h = await getHeaders()
      const auth = h.get('authorization')
      if (auth && auth.startsWith('Bearer ')) {
        token = auth.slice(7)
      }
    } catch {}
  }

  if (!token) return null
  return decrypt(token)
}
