import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const res = await backendFetch(`/api/analytics/boutique/${params.id}`)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return NextResponse.json(data, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur interne'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
