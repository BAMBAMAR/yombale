import 'server-only'
import { SignJWT } from 'jose'
import { getOptionalSession } from './dal'

const API = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? 'http://127.0.0.1:3000'

export interface ActionState {
  error?: string
  success?: boolean
}

export async function backendFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const session = await getOptionalSession()
  const headers = new Headers(options.headers)

  if (session?.userId) {
    const key = new TextEncoder().encode(process.env.JWT_SECRET)
    const token = await new SignJWT({ userId: session.userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1m')
      .sign(key)
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const primaryUrl = `${API}${path}`
  try {
    return await fetch(primaryUrl, { ...options, headers, signal: options.signal ?? AbortSignal.timeout(6000) })
  } catch {
    const fallbackUrl = primaryUrl.includes('127.0.0.1')
      ? primaryUrl.replace('127.0.0.1', 'localhost')
      : primaryUrl.replace('localhost', '127.0.0.1')
    return await fetch(fallbackUrl, { ...options, headers, signal: options.signal ?? AbortSignal.timeout(6000) })
  }
}
