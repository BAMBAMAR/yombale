import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

// PATCH /api/boutiques/[id]/credits-clients/[clientId]/statut — Blacklister/Changer statut d'un client
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; clientId: string } }
) {
  try {
    const body = await request.json().catch(() => ({}))
    const res = await backendFetch(`/api/boutiques/${params.id}/credits-clients/${params.clientId}/statut`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[API Route] PATCH statut client error:', err)
    return NextResponse.json({ error: 'Erreur réseau' }, { status: 500 })
  }
}
