import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

export const dynamic = 'force-dynamic'

// PUT /api/immo/mine/[id] — Proxy pour modifier sa propre annonce immobilière
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const { id } = await Promise.resolve(params)
    const contentType = request.headers.get('content-type') || ''
    let body: BodyInit
    if (contentType.includes('multipart/form-data')) {
      body = await request.formData()
    } else {
      body = await request.text()
    }
    const res = await backendFetch(`/api/immo/mine/${id}`, {
      method: 'PUT',
      body,
      headers: contentType.includes('multipart/form-data') ? {} : { 'Content-Type': contentType },
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[API Route] /immo/mine/[id] PUT error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE /api/immo/mine/[id] — Proxy pour supprimer sa propre annonce immobilière
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const { id } = await Promise.resolve(params)
    const res = await backendFetch(`/api/immo/mine/${id}`, {
      method: 'DELETE',
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[API Route] /immo/mine/[id] DELETE error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
