import { type NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

export async function GET(
  _req: NextRequest,
  { params }: { params: { boutiqueId: string } }
) {
  const res = await backendFetch(
    `/api/comptabilite/${params.boutiqueId}/commandes?statut=en_attente`
  )
  if (!res.ok) return NextResponse.json({ count: 0 })
  const rows = await res.json()
  return NextResponse.json({ count: Array.isArray(rows) ? rows.length : 0 })
}
