import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const key = new TextEncoder().encode(process.env.SESSION_SECRET)

const COOKIE_NAME = 'nopalou_session'
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 jours

export interface SessionPayload {
  userId: string
  nom?: string
  email?: string
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
    return null
  }
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
  const token = await encrypt(payload)
  const store = await cookies()
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  })
}

export async function updateSession(): Promise<void> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token) return
  const payload = await decrypt(token)
  if (!payload) return
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
  const newToken = await encrypt(payload)
  store.set(COOKIE_NAME, newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  })
}

export async function deleteSession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token) return null
  return decrypt(token)
}
