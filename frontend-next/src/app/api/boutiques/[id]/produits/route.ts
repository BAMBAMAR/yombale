import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

// GET /api/boutiques/[id]/produits — Proxy authentifié côté serveur (pour le préchargement client)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const res = await backendFetch(`/api/boutiques/${params.id}/produits`)
    if (!res.ok) {
      return NextResponse.json({ produits: [] }, { status: 200 })
    }
    const data = await res.json().catch(() => ({ produits: [] }))
    return NextResponse.json(data)
  } catch (err) {
    console.error('[API Route] /boutiques/[id]/produits error:', err)
    return NextResponse.json({ produits: [] }, { status: 200 })
  }
}
