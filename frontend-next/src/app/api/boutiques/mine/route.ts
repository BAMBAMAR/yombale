import { NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

export const dynamic = 'force-dynamic'

// GET /api/boutiques/mine — Proxy authentifié pour les boutiques de l'utilisateur connecté
export async function GET() {
  try {
    const res = await backendFetch('/api/boutiques/mine')
    if (!res.ok) {
      return NextResponse.json({ boutiques: [] }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('[API Route] /boutiques/mine error:', err)
    return NextResponse.json({ boutiques: [] }, { status: 500 })
  }
}
