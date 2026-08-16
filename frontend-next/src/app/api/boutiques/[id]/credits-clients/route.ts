import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

// GET /api/boutiques/[id]/credits-clients — Liste des clients carnet
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : ''
    const res = await backendFetch(`/api/boutiques/${params.id}/credits-clients${queryString}`)
    if (!res.ok) {
      return NextResponse.json({ clients: [] }, { status: 200 })
    }
    const data = await res.json().catch(() => ({ clients: [] }))
    return NextResponse.json(data)
  } catch (err) {
    console.error('[API Route] GET /boutiques/[id]/credits-clients error:', err)
    return NextResponse.json({ clients: [] }, { status: 200 })
  }
}

// POST /api/boutiques/[id]/credits-clients — Créer un profil client carnet
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}))
    const res = await backendFetch(`/api/boutiques/${params.id}/credits-clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[API Route] POST /boutiques/[id]/credits-clients error:', err)
    return NextResponse.json({ error: 'Erreur réseau' }, { status: 500 })
  }
}


