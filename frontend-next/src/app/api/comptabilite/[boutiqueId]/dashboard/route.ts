import { type NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

export async function GET(
  _req: NextRequest,
  { params }: { params: { boutiqueId: string } }
) {
  try {
    const res = await backendFetch(`/api/comptabilite/${params.boutiqueId}/dashboard`)
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      return NextResponse.json({ error: errData.error || 'Erreur backend' }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    console.error(`[API Route] GET /comptabilite/${params.boutiqueId}/dashboard error:`, err?.message)
    return NextResponse.json({ error: 'Erreur réseau proxy' }, { status: 502 })
  }
}
