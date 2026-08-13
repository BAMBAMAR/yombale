import { NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

// GET /api/abonnements/mon-plan — Proxy authentifié pour le plan d'abonnement actif
export async function GET() {
  try {
    const res = await backendFetch('/api/abonnements/mon-plan')
    if (!res.ok) {
      return NextResponse.json({ abonnement: null }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('[API Route] /abonnements/mon-plan error:', err)
    return NextResponse.json({ abonnement: null }, { status: 500 })
  }
}
