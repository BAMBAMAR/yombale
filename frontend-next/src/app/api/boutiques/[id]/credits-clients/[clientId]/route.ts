import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

// PUT /api/boutiques/[id]/credits-clients/[clientId] — Modifier un client carnet
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; clientId: string } }
) {
  try {
    const body = await request.json().catch(() => ({}))
    const res = await backendFetch(`/api/boutiques/${params.id}/credits-clients/${params.clientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[API Route] PUT /boutiques/[id]/credits-clients/[clientId] error:', err)
    return NextResponse.json({ error: 'Erreur réseau' }, { status: 500 })
  }
}

// DELETE /api/boutiques/[id]/credits-clients/[clientId] — Supprimer un client carnet
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; clientId: string } }
) {
  try {
    const res = await backendFetch(`/api/boutiques/${params.id}/credits-clients/${params.clientId}`, {
      method: 'DELETE',
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[API Route] DELETE /boutiques/[id]/credits-clients/[clientId] error:', err)
    return NextResponse.json({ error: 'Erreur réseau' }, { status: 500 })
  }
}

