import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'

export const dynamic = 'force-dynamic'

interface Produit {
  id: number
  nom: string
  prix_min: number | null
}

interface ApiResponse {
  produits?: Produit[]
  data?: Produit[]
}

export async function GET() {
  try {
    const data = await apiFetch<ApiResponse | Produit[]>('/produits?limit=5&tri=prix_asc')
    const rawList: Produit[] = Array.isArray(data) ? data : (data.produits || data.data || [])

    const items = rawList.slice(0, 5).map(p => ({
      nom: p.nom,
      prix: p.prix_min ? p.prix_min.toLocaleString('fr-FR') : 'Sur devis',
      url: `https://nopalou.com/produit/${p.id}`,
    }))

    return NextResponse.json(
      {
        title: 'Bons Plans Nopalou',
        subtitle: 'Sélection des meilleures offres à Dakar',
        items: items.length > 0 ? items : [
          { nom: 'Découvrez les offres du jour', prix: 'Voir', url: 'https://nopalou.com' }
        ],
        updatedAt: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (_err) {
    return NextResponse.json(
      {
        title: 'Bons Plans Nopalou',
        subtitle: 'Plateforme de commerce au Sénégal',
        items: [
          { nom: 'Voir les comparatifs et bons plans', prix: 'Nopalou', url: 'https://nopalou.com' }
        ],
        updatedAt: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=60',
        },
      }
    )
  }
}
