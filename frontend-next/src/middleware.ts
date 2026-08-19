import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { isI18nScopedRoute } from './i18n/config'

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

  // ── 1. Vérification session & Langue ─────────────────────────
  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = token ? await verifyToken(token) : null

  const rawLocale = req.cookies.get('nopalou_locale')?.value
  const locale = (rawLocale === 'en' || rawLocale === 'ar') ? rawLocale : 'fr'

  // Redirections pour la refonte SPA Espace Compte
  const legacyToSpa: Record<string, string> = {
    '/mes-annonces': 'mes-annonces',
    '/mes-annonces-immo': 'mes-annonces-immo',
    '/compte/profil': 'profil',
    '/compte/apporteur': 'apporteur',
    '/compte/fonctionnalites': 'fonctionnalites',
    // On peut aussi rediriger les favoris pour les connectés
  }
  
  if (legacyToSpa[pathname]) {
    const url = new URL('/compte', req.nextUrl)
    url.searchParams.set('tab', legacyToSpa[pathname])
    return NextResponse.redirect(url)
  }
  
  // Pour /favoris, si connecté on redirige vers le SPA, sinon on laisse tel quel
  if (pathname === '/favoris' && session) {
    const url = new URL('/compte', req.nextUrl)
    url.searchParams.set('tab', 'favoris')
    return NextResponse.redirect(url)
  }

  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r)) ||
                     PROTECTED_EXACT.some(r => pathname === r)
  const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r))

  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/connexion', req.nextUrl))
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/compte', req.nextUrl))
  }

  // ── 2. CSP compatible Next.js App Router ─────────────────────
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://static.cloudflareinsights.com`,
    `style-src 'self' 'unsafe-inline'`,
    "img-src 'self' blob: data: https:",
    "font-src 'self' data:",
    `connect-src 'self' blob: data: https: wss: ${process.env.BACKEND_URL ?? ''} ${process.env.NEXT_PUBLIC_BACKEND_URL ?? ''}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ]

  if (!isDev) {
    cspDirectives.push("upgrade-insecure-requests")
  }

  const csp = cspDirectives.join('; ')

  const isScoped = isI18nScopedRoute(pathname)
  const effectiveLocale = isScoped ? locale : 'fr'

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('x-pathname', pathname)
  requestHeaders.set('x-locale', effectiveLocale)
  requestHeaders.set('Content-Security-Policy', csp)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  if (!isDev) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }
  response.headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()')

  // ── 3. Edge CDN Caching pour routes de catalogue publiques ────
  if (
    pathname.startsWith('/immo') ||
    pathname.startsWith('/annonces') ||
    pathname.startsWith('/categorie') ||
    pathname.startsWith('/telecom')
  ) {
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
  }

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
