import { redirect } from 'next/navigation'
import Link from 'next/link'
import { backendFetch } from '@/lib/backend-fetch'
import PageHeader from '@/components/PageHeader'
import ModifierImmoForm from './ModifierImmoForm'

interface AnnonceImmo {
  id: string
  titre: string
  type_bien: string | null
  transaction: string | null
  prix: number | null
  surface_m2: number | null
  nb_pieces: number | null
  nb_chambres: number | null
  meuble: boolean
  ville: string | null
  quartier: string | null
  description: string | null
  contact_nom: string | null
  contact_tel: string | null
  actif: boolean
}

export default async function ModifierImmoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let annonce: AnnonceImmo | null = null
  try {
    const res = await backendFetch('/api/immo/mine')
    if (res.ok) {
      const list: AnnonceImmo[] = await res.json()
      annonce = list.find(a => a.id === id) ?? null
    }
  } catch {
    // réseau indisponible
  }

  if (!annonce) redirect('/mes-annonces-immo')

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: 'Mes biens immo', href: '/mes-annonces-immo' },
          { label: 'Modifier' }
        ]}
        emoji="🏡"
        titre="Modifier le bien"
        compteur="Toute modification soumettra votre annonce à une nouvelle validation."
      />
      <ModifierImmoForm annonce={annonce} />
    </div>
  )
}
