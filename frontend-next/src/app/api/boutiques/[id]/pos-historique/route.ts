import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

// GET /api/boutiques/[id]/pos-historique — Proxy authentifié pour l'historique caisse POS
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const res = await backendFetch(`/api/boutiques/${params.id}/pos-historique`)
    if (!res.ok) {
      return NextResponse.json([], { status: 200 })
    }
    const data = await res.json().catch(() => [])
    return NextResponse.json(data)
  } catch (err) {
    console.error('[API Route] /boutiques/[id]/pos-historique error:', err)
    return NextResponse.json([], { status: 200 })
  }
}
