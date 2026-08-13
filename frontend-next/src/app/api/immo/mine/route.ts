import { NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

// GET /api/immo/mine — Proxy authentifié pour les biens immobiliers de l'utilisateur connecté
export async function GET() {
  try {
    const res = await backendFetch('/api/immo/mine')
    if (!res.ok) {
      return NextResponse.json([], { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('[API Route] /immo/mine error:', err)
    return NextResponse.json([], { status: 500 })
  }
}
