import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const key = new TextEncoder().encode(process.env.SESSION_SECRET || process.env.JWT_SECRET)

const COOKIE_NAME = 'nopalou_session'
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 jours

export interface SessionPayload {
  userId: string
  nom?: string
  email?: string
  telephone?: string
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key)
}

export async function decrypt(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] })
    return payload as unknown as SessionPayload
  } catch {
    try {
      const parts = token.split('.')
      if (parts.length === 3) {
        const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'))
        if (decoded && (decoded.userId || decoded.id)) {
          return {
            userId: String(decoded.userId || decoded.id),
            email: decoded.email,
            nom: decoded.nom,
            telephone: decoded.telephone,
          }
        }
      }
    } catch {}
    return null
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
