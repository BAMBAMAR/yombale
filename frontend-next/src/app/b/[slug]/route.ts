import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const url = new URL(request.url)
  const produitId = url.searchParams.get('produit') || url.searchParams.get('p')

  if (!slug) {
    return NextResponse.redirect(new URL('/boutiques', request.url), 307)
  }

  // Si le paramètre produit est présent, redirection directe vers la fiche produit
  if (produitId) {
    return NextResponse.redirect(
      new URL(`/boutiques/${slug}/produits/${produitId}`, request.url),
      307
    )
  }

  // Sinon redirection vers la vitrine boutique
  return NextResponse.redirect(
    new URL(`/boutiques/${slug}`, request.url),
    307
  )
}
