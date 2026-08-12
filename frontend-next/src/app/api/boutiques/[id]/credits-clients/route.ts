import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

// GET /api/boutiques/[id]/credits-clients — Proxy authentifié pour les clients/crédits
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const res = await backendFetch(`/api/boutiques/${params.id}/credits-clients`)
    if (!res.ok) {
      return NextResponse.json({ clients: [] }, { status: 200 })
    }
    const data = await res.json().catch(() => ({ clients: [] }))
    return NextResponse.json(data)
  } catch (err) {
    console.error('[API Route] /boutiques/[id]/credits-clients error:', err)
    return NextResponse.json({ clients: [] }, { status: 200 })
  }
}
