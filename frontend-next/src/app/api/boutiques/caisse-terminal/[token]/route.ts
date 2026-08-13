import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

// GET /api/boutiques/caisse-terminal/[token] — Proxy unauthenticated caisse terminal access
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> | { token: string } }
) {
  try {
    const resolvedParams = await params
    const token = resolvedParams?.token?.trim()

    if (!token) {
      return NextResponse.json({ error: 'Jeton de caisse requis' }, { status: 400 })
    }

    const res = await backendFetch(`/api/boutiques/caisse-terminal/${token}`)
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[API Route] /caisse-terminal/[token] error:', err)
    return NextResponse.json({ error: 'Erreur lors de la connexion au terminal caisse' }, { status: 500 })
  }
}
