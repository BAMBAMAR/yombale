import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

// PUT /api/boutiques/[id]/statut — Activer ou désactiver la visibilité d'une boutique par le commerçant
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}))
    const res = await backendFetch(`/api/boutiques/${params.id}/statut`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[API Route] PUT /api/boutiques/[id]/statut error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// GET /api/boutiques/[id]/statut — Consulter le statut de visibilité d'une boutique
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const res = await backendFetch(`/api/boutiques/${params.id}`)
    if (!res.ok) {
      return NextResponse.json({ error: 'Boutique introuvable' }, { status: res.status })
    }
    const data = await res.json().catch(() => ({}))
    return NextResponse.json({ actif: data.actif ?? true, statut: data.actif ? 'actif' : 'masque' })
  } catch (err) {
    console.error('[API Route] GET /api/boutiques/[id]/statut error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
