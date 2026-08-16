import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

// POST /api/boutiques/[id]/credits-clients/approuver-commande — Approbation d'une demande d'achat à crédit
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}))
    console.log('[NEXT API APPROUVER-CMD INCOMING]', { boutiqueId: params.id, body })
    const res = await backendFetch(`/api/boutiques/${params.id}/credits-clients/approuver-commande`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    console.log('[NEXT API APPROUVER-CMD RESPONSE]', { status: res.status, data })
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[NEXT API APPROUVER-CMD ERROR]', err)
    return NextResponse.json({ error: 'Erreur réseau' }, { status: 500 })
  }
}
