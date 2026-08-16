import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

// POST /api/boutiques/[id]/credits-clients/[clientId]/transaction
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; clientId: string } }
) {
  try {
    const body = await request.json().catch(() => ({}))
    const res = await backendFetch(`/api/boutiques/${params.id}/credits-clients/${params.clientId}/transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[API Route] POST transaction client error:', err)
    return NextResponse.json({ error: 'Erreur réseau' }, { status: 500 })
  }
}
