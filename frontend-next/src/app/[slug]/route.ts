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
  'sitemap.xml', 'showcase', 'suivi-commande', 'tarifs-boutique', 'telecom',
  'vendre-sur-whatsapp', 'whatsapp'
])

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  if (!slug || RESERVED_ROUTES.has(slug.toLowerCase()) || slug.includes('.')) {
    return new NextResponse(null, { status: 404 })
  }

  const proto = request.headers.get('x-forwarded-proto') || 'https'
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'nopalou.com'
  const baseUrl = `${proto}://${host}`

  // Vérifier si le slug correspond à une boutique existante
  try {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:3000'
    const res = await fetch(`${backendUrl}/api/boutiques/${encodeURIComponent(slug)}`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 60 }
    })

    if (res.ok) {
      const data = await res.json()
      if (data && data.id) {
        const destinationSlug = data.slug || data.id || slug
        const url = new URL(request.url)
        const queryString = url.search // préserver d'éventuels query params (?produit=...)
        return NextResponse.redirect(new URL(`/boutiques/${destinationSlug}${queryString}`, baseUrl), 307)
      }
    }
  } catch {
    // Si erreur réseau temporaire vers le backend, rediriger vers /boutiques/:slug
    const url = new URL(request.url)
    return NextResponse.redirect(new URL(`/boutiques/${slug}${url.search}`, baseUrl), 307)
  }

  return new NextResponse(null, { status: 404 })
}
