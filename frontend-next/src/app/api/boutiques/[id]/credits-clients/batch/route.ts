import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

// POST /api/boutiques/[id]/credits-clients/batch — Import groupé de clients / carnet dettes
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}))
    const res = await backendFetch(`/api/boutiques/${params.id}/credits-clients/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[API Route] POST /api/boutiques/[id]/credits-clients/batch error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
