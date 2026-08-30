import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

// PUT /api/boutiques/[id]/caissiers/[caissierId] — Modifier un caissier
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; caissierId: string } }
) {
  try {
    const body = await request.json().catch(() => ({}))
    const res = await backendFetch(`/api/boutiques/${params.id}/caissiers/${params.caissierId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[API Route] PUT /api/boutiques/[id]/caissiers/[caissierId] error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PATCH /api/boutiques/[id]/caissiers/[caissierId] — Modifier statut d'un caissier
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; caissierId: string } }
) {
  try {
    const body = await request.json().catch(() => ({}))
    const res = await backendFetch(`/api/boutiques/${params.id}/caissiers/${params.caissierId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[API Route] PATCH /api/boutiques/[id]/caissiers/[caissierId] error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE /api/boutiques/[id]/caissiers/[caissierId] — Supprimer un caissier
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; caissierId: string } }
) {
  try {
    const res = await backendFetch(`/api/boutiques/${params.id}/caissiers/${params.caissierId}`, {
      method: 'DELETE',
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[API Route] DELETE /api/boutiques/[id]/caissiers/[caissierId] error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
