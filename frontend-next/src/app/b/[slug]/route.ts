import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const url = new URL(request.url)
  const produitId = url.searchParams.get('produit') || url.searchParams.get('p')

  const proto = request.headers.get('x-forwarded-proto') || 'https'
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'nopalou.com'
  const baseUrl = `${proto}://${host}`

  if (!slug) {
    return NextResponse.redirect(new URL('/boutiques', baseUrl), 307)
  }

  // Si le paramètre produit est présent, redirection directe vers la fiche produit
  if (produitId) {
    return NextResponse.redirect(
      new URL(`/boutiques/${slug}/produits/${produitId}`, baseUrl),
      307
    )
  }

  // Sinon redirection vers la vitrine boutique
  return NextResponse.redirect(
    new URL(`/boutiques/${slug}`, baseUrl),
    307
  )
}
