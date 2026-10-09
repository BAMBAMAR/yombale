import { NextRequest, NextResponse } from 'next/server'
import { isI18nScopedRoute } from './i18n/config'
import { verifierJetonSession } from './lib/session-verify'
import { adresseDepuisSousDomaineSurga, renvoiOrigineSurga, domaineCommun, ORIGINE_SURGA, ORIGINE_NOPALOU, CHEMIN_REPRISE, COOKIE_PASSAGE_SESSION } from './lib/surga-adresse'

const COOKIE_NAME = 'nopalou_session'

// Routes qui nécessitent une session valide
// Matches exactes — pas de startsWith pour éviter de bloquer /boutiques (public) avec /boutique
const PROTECTED_ROUTES = ['/compte', '/mes-annonces', '/mes-annonces-immo', '/deposer-immo', '/deposer-annonce']
const PROTECTED_EXACT = ['/boutique']
// Routes accessibles uniquement si NON connecté
const AUTH_ROUTES = ['/connexion', '/inscription']

const verifyToken = verifierJetonSession

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isDev = process.env.NODE_ENV === 'development'

  const hote = req.headers.get('host') || req.nextUrl.host || ''
  if (ORIGINE_SURGA) {
    // D83 : Surga vit à sa propre origine ; « nopalou.com/surga » y renvoie, et l'origine de Surga rend à Nopalou ses pages.
    const versAutreOrigine = renvoiOrigineSurga(hote, pathname, req.nextUrl.search)
    if (versAutreOrigine) {
      const renvoi = NextResponse.redirect(versAutreOrigine, 307)
      // La session suit le visiteur : un cookie de passage de deux minutes, lisible par les deux origines, converti
      // en cookie de session à l'arrivée. Sans lui, un compte connecté sur Nopalou arriverait déconnecté.
      const jeton = req.cookies.get(COOKIE_NAME)?.value
      const domaine = domaineCommun()
      if (pathname === '/surga' && jeton && domaine) {
        renvoi.cookies.set(COOKIE_PASSAGE_SESSION, jeton, { domain: domaine, httpOnly: true, secure: !isDev, sameSite: 'lax', path: '/', maxAge: 120 })
      }
      return renvoi
    }
  } else {
    // D77 : « surga.nopalou.com » renvoie vers « nopalou.com/surga », seule adresse où l'application est servie.
    // Renvoi temporaire (307) : un renvoi permanent resterait dans les navigateurs si l'adresse principale changeait.
    const versDomainePrincipal = adresseDepuisSousDomaineSurga(
      hote,
      pathname,
      req.nextUrl.search,
      req.headers.get('x-forwarded-proto')?.split(',')[0].trim() || req.nextUrl.protocol,
    )
    if (versDomainePrincipal) return NextResponse.redirect(versDomainePrincipal, 307)
  }

  // ── 1. Vérification session & Langue ─────────────────────────
  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = token ? await verifyToken(token) : null

  // D83 : arrivée à l'origine de Surga avec le cookie de passage. Il devient le cookie de session de cette origine
  // (s'il est valide et qu'aucune session n'y existe), puis il est retiré dans tous les cas.
  const passage = ORIGINE_SURGA ? req.cookies.get(COOKIE_PASSAGE_SESSION)?.value : undefined
  const retirerPassage = (reponse: NextResponse) => {
    reponse.cookies.set(COOKIE_PASSAGE_SESSION, '', { domain: domaineCommun() || undefined, path: '/', maxAge: 0 })
    return reponse
  }
  if (passage && !session && (pathname === '/surga' || pathname.startsWith('/surga/')) && (await verifyToken(passage))) {
    const suite = NextResponse.redirect(new URL(pathname + req.nextUrl.search, ORIGINE_SURGA), 307)
    suite.cookies.set(COOKIE_NAME, passage, { httpOnly: true, secure: !isDev, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 })
    return retirerPassage(suite)
  }

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
    if (!session) {
      const loginUrl = new URL('/connexion', req.nextUrl)
      loginUrl.searchParams.set('redirect', `/compte?tab=${legacyToSpa[pathname]}`)
      return NextResponse.redirect(loginUrl)
    }
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

  // Si un visiteur non connecté arrive sur /boutique avec un code apporteur/parrain, l'envoyer directement sur la création de boutique
  if (pathname === '/boutique' && !session) {
    const apporteur = req.nextUrl.searchParams.get('apporteur') || req.nextUrl.searchParams.get('ref')
    if (apporteur) {
      const url = new URL('/creer-boutique', req.nextUrl)
      url.searchParams.set('apporteur', apporteur)
      return NextResponse.redirect(url)
    }
  }

  const hasCaisseToken = pathname === '/boutique/caisse' && !!req.nextUrl.searchParams.get('token')
  const isBoutiqueProtected = (pathname === '/boutique' || pathname.startsWith('/boutique/')) && !hasCaisseToken

  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r)) ||
                     PROTECTED_EXACT.some(r => pathname === r) ||
                     isBoutiqueProtected
  const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r))

  if (isProtected && !session) {
    const loginUrl = new URL('/connexion', req.nextUrl)
    const fullPath = req.nextUrl.pathname + req.nextUrl.search
    loginUrl.searchParams.set('redirect', fullPath)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/compte', req.nextUrl))
  }

  // ── 2. CSP compatible Next.js App Router ─────────────────────
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  // D83 : la page de reprise est la seule à pouvoir être affichée dans un cadre, et seulement par l'origine de Surga.
  const cadreAdmis = ORIGINE_SURGA && pathname === CHEMIN_REPRISE ? ORIGINE_SURGA : null
  const ancetres = `frame-ancestors ${cadreAdmis || "'none'"}`

  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://static.cloudflareinsights.com https://www.instagram.com https://instagram.com https://*.cdninstagram.com https://www.tiktok.com https://*.tiktok.com https://*.tiktokcdn.com https://*.ttwstatic.com https://connect.facebook.net`,
    `style-src 'self' 'unsafe-inline'`,
    "img-src 'self' blob: data: https:",
    "media-src 'self' blob: data: https: https://res.cloudinary.com",
    "font-src 'self' data:",
    `connect-src 'self' blob: data: https: wss: https://www.instagram.com https://*.instagram.com https://*.fbcdn.net https://www.tiktok.com https://*.tiktok.com https://*.tiktokcdn.com https://*.ttwstatic.com ${process.env.BACKEND_URL ?? ''} ${process.env.NEXT_PUBLIC_BACKEND_URL ?? ''}`,
    `frame-src 'self' ${ORIGINE_SURGA ? ORIGINE_NOPALOU : ''} https://www.instagram.com https://instagram.com https://www.tiktok.com https://*.tiktok.com https://www.facebook.com https://web.facebook.com https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://my.matterport.com https://*.matterport.com`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ancetres,
  ]

  if (!isDev) {
    cspDirectives.push("upgrade-insecure-requests")
  }

  const csp = cspDirectives.join('; ')

  const isScoped = isI18nScopedRoute(pathname)
  const effectiveLocale = isScoped ? locale : 'fr'

  const isSurga = pathname === '/surga' || pathname.startsWith('/surga/')

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('x-pathname', pathname)
  requestHeaders.set('x-locale', effectiveLocale)
  requestHeaders.set('Content-Security-Policy', csp)
  if (isSurga) {
    requestHeaders.set('x-is-surga', 'true')
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', csp)
  // AUD-149 : politique stricte (nonce + strict-dynamic, sans unsafe-inline ni unsafe-eval) évaluée en RAPPORT SEUL.
  // Elle ne bloque rien ; les violations arrivent sur /api/csp-report. Passage en application réelle quand le flux est propre.
  // En dev (isDev) ou sur les routes /admin (outils et widgets d'administration), on omet le Report-Only pour ne pas inonder la console opérateur.
  const isAdminRoute = pathname.startsWith('/admin')
  if (!isDev && !isAdminRoute) {
    const cspStricte = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https:`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      "frame-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      ancetres,
      'report-uri /api/csp-report',
    ].join('; ')
    response.headers.set('Content-Security-Policy-Report-Only', cspStricte)
  }
  response.headers.set('X-Content-Type-Options', 'nosniff')
  if (!cadreAdmis) response.headers.set('X-Frame-Options', 'DENY')
  if (passage) retirerPassage(response)
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  if (!isDev) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }
  response.headers.set('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(self)')

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
