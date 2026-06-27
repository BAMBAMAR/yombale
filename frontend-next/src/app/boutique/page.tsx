import type { Metadata } from 'next'
import { backendFetch } from '@/lib/backend-fetch'
import BoutiqueClient from './BoutiqueClient'

export const metadata: Metadata = { title: 'Ma boutique' }

interface Boutique {
  id: string
  nom: string
  description: string | null
  categorie: string | null
  telephone: string | null
  adresse: string | null
  ville: string
  logo_url: string | null
  actif: boolean
  sponsorise: boolean | null
  sponsor_jusqu_au: string | null
  created_at: string
}

export default async function BoutiquePage() {
  let boutiques: Boutique[] = []
  try {
    const res = await backendFetch('/api/boutiques/mine')
    if (res.ok) {
      const data = await res.json()
      boutiques = data.boutiques ?? []
    }
  } catch {
    // afficher liste vide si erreur réseau
  }

  const canCreate = boutiques.length < 3

  return <BoutiqueClient boutiques={boutiques} canCreate={canCreate} />
}
