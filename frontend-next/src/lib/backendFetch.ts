import { SignJWT } from 'jose'
import { getOptionalSession } from './dal'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const SSR_SECRET = process.env.SSR_SECRET || ''

export async function backendAuthFetch(path: string, init?: RequestInit) {
  const session = await getOptionalSession()
  if (!session) throw new Error('Non authentifié')

  const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
  const token = await new SignJWT({ userId: session.userId, email: session.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('2m')
    .sign(secret)

  return fetch(`${BACKEND}/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(SSR_SECRET ? { 'X-SSR-Token': SSR_SECRET } : {}),
      ...(init?.headers ?? {}),
    },
  })
}
