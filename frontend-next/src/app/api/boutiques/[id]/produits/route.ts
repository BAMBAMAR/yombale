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
      const errData = await res.json().catch(() => ({}))
      return NextResponse.json({ error: errData.error || 'Erreur backend', produits: [] }, { status: res.status })
    }
    const data = await res.json().catch(() => ({ produits: [] }))
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[API Route] /boutiques/[id]/produits error:', err?.message)
    return NextResponse.json({ error: 'Erreur réseau proxy', produits: [] }, { status: 502 })
  }
}
