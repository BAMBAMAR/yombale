import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

// GET /api/boutiques/[id]/credits-clients/[clientId]/historique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; clientId: string } }
) {
  try {
    const res = await backendFetch(`/api/boutiques/${params.id}/credits-clients/${params.clientId}/historique`)
    const data = await res.json().catch(() => ({ historique: [] }))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[API Route] GET historique client error:', err)
    return NextResponse.json({ historique: [] }, { status: 200 })
  }
}
