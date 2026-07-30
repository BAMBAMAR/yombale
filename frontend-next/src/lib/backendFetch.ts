import { SignJWT } from 'jose'
import { getOptionalSession } from './dal'

const BACKEND = process.env.BACKEND_URL || 'http://127.0.0.1:3000'
const SSR_SECRET = process.env.SSR_SECRET || ''

export async function backendAuthFetch(path: string, init?: RequestInit) {
  const session = await getOptionalSession()
  if (!session) throw new Error('Non authentifié')

  const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
  const token = await new SignJWT({ userId: session.userId, email: session.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('2m')
    .sign(secret)

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...(SSR_SECRET ? { 'X-SSR-Token': SSR_SECRET } : {}),
    ...(init?.headers ?? {}),
  }

  const primaryUrl = `${BACKEND}/api${path}`
  try {
    return await fetch(primaryUrl, { ...init, headers, signal: init?.signal ?? AbortSignal.timeout(6000) })
  } catch {
    const fallbackUrl = primaryUrl.includes('127.0.0.1')
      ? primaryUrl.replace('127.0.0.1', 'localhost')
      : primaryUrl.replace('localhost', '127.0.0.1')
    return await fetch(fallbackUrl, { ...init, headers, signal: init?.signal ?? AbortSignal.timeout(6000) })
  }
}
