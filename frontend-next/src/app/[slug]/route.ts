import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const RESERVED_ROUTES = new Set([
  'admin', 'agence', 'agences', 'aide', 'alternative-shopify-senegal', 'annonces', 'api',
  'assistant-whatsapp', 'b', 'boutique', 'boutiques', 'categorie', 'cgu', 'checkout-express',
  'comparaison', 'comparer', 'components', 'confidentialite', 'connexion', 'creer-boutique',
  'creer-boutique-en-ligne', 'demo', 'error', 'gestion-stock-carnet-dettes', 'guide-achat',
  'guide-creer-boutique', 'guide-emploi', 'guide-forfait', 'guide-immo', 'guide-prix',
  'guide-sourcing-revente', 'guide-utilisation', 'hero', 'immo', 'inscription',
  'logiciel-caisse-senegal', 'logiciel-gestion-locative-senegal', 'marchands',
  'mentions-legales', 'migration', 'mot-de-passe-oublie', 'not-found', 'paiement',
  'paiement-en-ligne-senegal', 'partenaires', 'payer-annonce', 'payer-boost', 'payer-loyer',
  'payer-sponsoring-boutique', 'payer-sponsoring-immo', 'payer-sponsoring-produit', 'pos',
  'pourquoi-nopalou', 'produit', 'promo', 'recherche', 'retour-paiement', 'robots.txt',
  'sitemap.xml', 'showcase', 'suivi-commande', 'surga', 'tarifs-boutique', 'telecom',
  'vendre-sur-whatsapp', 'whatsapp'
])

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function respond404(request: NextRequest) {
  const accept = request.headers.get('accept') || ''
  if (accept.includes('application/json')) {
    return NextResponse.json(
      { success: false, error: 'Page introuvable', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const notFoundHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>404 — Page introuvable | Nopalou</title>
<style>
  :root { --navy: #1C2B4A; --accent: #C75B00; --bg: #F8F5F0; --card: #FFFFFF; --text: #1E293B; --muted: #64748B; --border: #E2E8F0; }
  @media (prefers-color-scheme: dark) { :root { --bg: #0F172A; --card: #1E293B; --text: #F8FAFC; --muted: #94A3B8; --border: #334155; } }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); font-family: system-ui, -apple-system, sans-serif; color: var(--text); text-align: center; padding: 20px; }
  .box { max-width: 440px; width: 100%; background: var(--card); border-radius: 20px; padding: 36px 24px; border: 1px solid var(--border); box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08); }
  .code { font-size: 64px; font-weight: 900; color: var(--accent); margin: 0 0 8px; line-height: 1; }
  h1 { font-size: 20px; font-weight: 800; margin: 0 0 10px; color: var(--text); }
  p { font-size: 14px; color: var(--muted); margin: 0 0 24px; line-height: 1.5; }
  a.btn { background: var(--accent); color: #fff; border-radius: 12px; padding: 12px 24px; font-size: 14px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
</style>
</head>
<body>
  <div class="box">
    <div class="code">404</div>
    <h1>Page introuvable</h1>
    <p>Cette page n'existe pas ou a été déplacée.</p>
    <a href="/" class="btn">Retour à l'accueil</a>
  </div>
</body>
</html>`

  return new NextResponse(notFoundHtml, {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  if (!slug) {
    return respond404(request)
  }

  const proto = request.headers.get('x-forwarded-proto') || 'https'
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'nopalou.com'
  const baseUrl = `${proto}://${host}`
  const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:3000'

  // 1. Décodage et assainissement des résidus Meta WhatsApp (ex: {{1}}, %7B%7B1%7D%7D, {1})
  let decodedSlug = slug
  try {
    decodedSlug = decodeURIComponent(decodedSlug)
  } catch {}

  const cleanSlug = decodedSlug
    .replace(/(\{\{\d+\}\}|%7B%7B\d+%7D%7D|\{\d+\}|%7B\d+%7D)/gi, '')
    .replace(/^\/+/, '')
    .trim()

  const hadMetaPlaceholder = cleanSlug !== slug && cleanSlug !== decodedSlug
  const url = new URL(request.url)
  const queryString = url.search

  // Si le slug nettoyé commence par une route connue avec slash (ex: annonces/..., immo/..., boutiques/...)
  if (/^(annonces|immo|produit|boutiques?|agences?|telecom|compte)\//i.test(cleanSlug)) {
    return NextResponse.redirect(new URL(`/${cleanSlug}${queryString}`, baseUrl), 301)
  }

  // Si le slug correspond à une route racine réservée
  if (RESERVED_ROUTES.has(cleanSlug.toLowerCase())) {
    if (hadMetaPlaceholder) {
      return NextResponse.redirect(new URL(`/${cleanSlug}${queryString}`, baseUrl), 301)
    }
    return respond404(request)
  }

  // Ignorer les fichiers statiques
  if (cleanSlug.includes('.')) {
    return respond404(request)
  }

  const isUuid = UUID_RE.test(cleanSlug)

  // 2. Si c'est un UUID ou si le lien provient d'un bouton Meta WhatsApp : résolution universelle prioritaire
  if (isUuid || hadMetaPlaceholder) {
    try {
      const resResolve = await fetch(`${backendUrl}/api/entites/resoudre/${encodeURIComponent(cleanSlug)}`, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      })
      if (resResolve.ok) {
        const resolved = await resResolve.json()
        if (resolved?.found && resolved?.url) {
          const destUrl = resolved.url.includes('?') && queryString
            ? `${resolved.url}&${queryString.slice(1)}`
            : `${resolved.url}${queryString}`
          return NextResponse.redirect(new URL(destUrl, baseUrl), 301)
        }
      }
    } catch (err) {
      console.error('[ROUTE_SLUG_RESOLVE_ERR]', err)
    }
  }

  // 3. Vérifier si le slug correspond à une boutique existante
  try {
    const res = await fetch(`${backendUrl}/api/boutiques/${encodeURIComponent(cleanSlug)}`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 60 }
    })

    if (res.ok) {
      const data = await res.json()
      if (data && data.id) {
        const destinationSlug = data.slug || data.id || cleanSlug
        return NextResponse.redirect(new URL(`/boutiques/${destinationSlug}${queryString}`, baseUrl), 307)
      }
    }
  } catch {
    // Si erreur réseau temporaire vers le backend pour un slug non-UUID
    if (!isUuid && !hadMetaPlaceholder) {
      return NextResponse.redirect(new URL(`/boutiques/${cleanSlug}${queryString}`, baseUrl), 307)
    }
  }

  // 4. Seconde passe de résolution universelle (commandes, alias, etc.)
  if (!isUuid && !hadMetaPlaceholder) {
    try {
      const resResolve = await fetch(`${backendUrl}/api/entites/resoudre/${encodeURIComponent(cleanSlug)}`, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      })
      if (resResolve.ok) {
        const resolved = await resResolve.json()
        if (resolved?.found && resolved?.url) {
          const destUrl = resolved.url.includes('?') && queryString
            ? `${resolved.url}&${queryString.slice(1)}`
            : `${resolved.url}${queryString}`
          return NextResponse.redirect(new URL(destUrl, baseUrl), 301)
        }
      }
    } catch {}
  }

  return respond404(request)
}
