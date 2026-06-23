import type { Metadata } from 'next'
import { backendFetch } from '@/lib/backend-fetch'
import AnnoncesClient from './AnnoncesClient'

export const metadata: Metadata = { title: 'Mes annonces' }

interface Annonce {
  id: string
  titre: string
  categorie_slug: string
  prix: number | null
  ville: string | null
  actif: boolean
  payee: boolean
  rejete: boolean
  photos: string[]
  created_at: string
}

export default async function MesAnnoncesPage() {
  let annonces: Annonce[] = []
  try {
    const res = await backendFetch('/api/annonces/mine')
    if (res.ok) {
      const data = await res.json()
      annonces = data.annonces ?? []
    }
  } catch {
    // afficher liste vide si erreur réseau
  }

  return <AnnoncesClient annonces={annonces} />
}
