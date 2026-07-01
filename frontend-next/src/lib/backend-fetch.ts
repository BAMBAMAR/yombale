import 'server-only'
import { SignJWT } from 'jose'
import { verifySession } from './dal'

const API = process.env.BACKEND_URL ?? 'http://localhost:3000'
const SSR_SECRET = process.env.SSR_SECRET || ''

export interface ActionState {
  error?: string
  success?: boolean
}

export async function backendFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const session = await verifySession()
  const key = new TextEncoder().encode(process.env.JWT_SECRET)
  const token = await new SignJWT({ userId: session.userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1m')
    .sign(key)

  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${token}`)
  if (SSR_SECRET) headers.set('X-SSR-Token', SSR_SECRET)
  // Ne pas forcer Content-Type si body est FormData (le browser gère le boundary)
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(`${API}${path}`, { ...options, headers })
}
