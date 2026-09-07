import { type NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

export async function GET(
  _req: NextRequest,
  { params }: { params: { boutiqueId: string } }
) {
  try {
    const res = await backendFetch(`/api/comptabilite/${params.boutiqueId}/dashboard`)
    if (!res.ok) {
      return NextResponse.json({
        ca_mois: 0,
        ca_mois_precedent: 0,
        nb_ventes_mois: 0,
        ca_total: 0,
        depenses_mois: 0,
        depenses_total: 0,
        benefice_mois: 0,
        top_produits: [],
        stock_alerte: [],
      })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({
      ca_mois: 0,
      ca_mois_precedent: 0,
      nb_ventes_mois: 0,
      ca_total: 0,
      depenses_mois: 0,
      depenses_total: 0,
      benefice_mois: 0,
      top_produits: [],
      stock_alerte: [],
    })
  }
}
