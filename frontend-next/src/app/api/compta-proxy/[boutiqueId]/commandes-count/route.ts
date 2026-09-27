import { type NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

export async function GET(
  _req: NextRequest,
  { params }: { params: { boutiqueId: string } }
) {
  try {
    const res = await backendFetch(
      `/api/comptabilite/${params.boutiqueId}/commandes?statut=en_attente`
    )
    if (!res.ok) return NextResponse.json({ error: 'Erreur backend', count: 0 }, { status: res.status })
    const rows = await res.json()
    return NextResponse.json({ count: Array.isArray(rows) ? rows.length : 0 })
  } catch (err: any) {
    return NextResponse.json({ error: 'Erreur réseau', count: 0 }, { status: 502 })
  }
}
