import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const url = new URL(request.url)
  const produitId = url.searchParams.get('produit') || url.searchParams.get('p')

  if (!id) {
    return NextResponse.redirect(new URL('/boutiques', request.url), 307)
  }

  // Si un produit est ciblé pour la commande, rediriger immédiatement vers checkout-express
  if (produitId) {
    const target = new URL('/checkout-express', request.url)
    target.searchParams.set('boutique', id)
    target.searchParams.set('produit', produitId)

    const ref = url.searchParams.get('ref')
    if (ref) target.searchParams.set('ref', ref)

    const phone = url.searchParams.get('phone') || url.searchParams.get('tel')
    if (phone) target.searchParams.set('phone', phone)

    const nom = url.searchParams.get('nom')
    if (nom) target.searchParams.set('nom', nom)

    const pay = url.searchParams.get('pay')
    if (pay) target.searchParams.set('pay', pay)

    const q = url.searchParams.get('q')
    if (q) target.searchParams.set('q', q)

    return NextResponse.redirect(target, 307)
  }

  // Sinon, retour sur la vitrine de la boutique
  return NextResponse.redirect(new URL(`/boutiques/${id}`, request.url), 307)
}
