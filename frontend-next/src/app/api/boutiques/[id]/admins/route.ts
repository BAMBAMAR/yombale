import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

// GET /api/boutiques/[id]/admins — Proxy authentifié pour les admins d'une boutique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const res = await backendFetch(`/api/boutiques/${params.id}/admins`)
    if (!res.ok) {
      return NextResponse.json({ admins: [] }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('[API Route] /boutiques/[id]/admins GET error:', err)
    return NextResponse.json({ admins: [] }, { status: 500 })
  }
}

// POST /api/boutiques/[id]/admins — Ajouter un admin
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const res = await backendFetch(`/api/boutiques/${params.id}/admins`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[API Route] /boutiques/[id]/admins POST error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
