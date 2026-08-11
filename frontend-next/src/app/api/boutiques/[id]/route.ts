import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

// GET /api/boutiques/[id] — Proxy authentifié pour la fiche d'une boutique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const res = await backendFetch(`/api/boutiques/${params.id}`)
    if (!res.ok) {
      return NextResponse.json({ error: 'Boutique introuvable' }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('[API Route] /boutiques/[id] GET error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/boutiques/[id] — Proxy pour les actions sur la boutique (update, etc.)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let body: BodyInit
    if (contentType.includes('multipart/form-data')) {
      body = await request.formData()
    } else {
      body = await request.text()
    }
    const res = await backendFetch(`/api/boutiques/${params.id}`, {
      method: 'POST',
      body,
      headers: contentType.includes('multipart/form-data') ? {} : { 'Content-Type': contentType },
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[API Route] /boutiques/[id] POST error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
