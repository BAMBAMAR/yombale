import { NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const res = await backendFetch('/api/boutiques/catalogues-standards')
    if (!res.ok) {
      return NextResponse.json({ error: 'Erreur chargement catalogue' }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
