import { NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

export const dynamic = 'force-dynamic'

// GET /api/annonces/mine — Proxy authentifié pour les annonces de l'utilisateur connecté
export async function GET() {
  try {
    const res = await backendFetch('/api/annonces/mine')
    if (!res.ok) {
      return NextResponse.json({ annonces: [] }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('[API Route] /annonces/mine error:', err)
    return NextResponse.json({ annonces: [] }, { status: 500 })
  }
}
