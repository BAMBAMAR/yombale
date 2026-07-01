import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const key = new TextEncoder().encode(process.env.SESSION_SECRET)
const COOKIE_NAME = 'nopalou_session'

// Routes qui nécessitent une session valide
// Matches exactes — pas de startsWith pour éviter de bloquer /boutiques (public) avec /boutique
const PROTECTED_ROUTES = ['/compte', '/mes-annonces', '/mes-annonces-immo', '/deposer-immo', '/deposer-annonce']
const PROTECTED_EXACT = ['/boutique']
// Routes accessibles uniquement si NON connecté
const AUTH_ROUTES = ['/connexion', '/inscription']

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] })
    return payload
  } catch {
    return null
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isDev = process.env.NODE_ENV === 'development'

  // ── 1. Vérification session ──────────────────────────────────
  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = token ? await verifyToken(token) : null

  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r)) ||
                     PROTECTED_EXACT.some(r => pathname === r)
  const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r))

  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/connexion', req.nextUrl))
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/compte', req.nextUrl))
  }

  // ── 2. CSP avec nonce (sans unsafe-inline) ───────────────────
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://www.googletagmanager.com${isDev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' 'unsafe-inline'`,
    "img-src 'self' blob: data: https:",
    "font-src 'self'",
    `connect-src 'self' ${process.env.BACKEND_URL ?? 'http://localhost:3000'} ${process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3000'} https://www.googletagmanager.com https://www.google-analytics.com https://region1.google-analytics.com`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ')

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', csp)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
