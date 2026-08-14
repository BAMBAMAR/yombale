import { redirect } from 'next/navigation'
import Link from 'next/link'
import { backendFetch } from '@/lib/backend-fetch'
import PageHeader from '@/components/PageHeader'
import ModifierAnnonceForm from './ModifierAnnonceForm'

interface Annonce {
  id: string
  titre: string
  categorie_slug: string
  description: string | null
  prix: number | null
  ville: string | null
  quartier: string | null
  contact_nom: string | null
  contact_tel: string | null
  photos: string[] | null
  caracteristiques: Record<string, string> | null
  actif: boolean
  payee: boolean
  rejete: boolean
}

export default async function ModifierAnnoncePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let annonce: Annonce | null = null
  try {
    const res = await backendFetch('/api/annonces/mine')
    if (res.ok) {
      const data = await res.json()
      const list: Annonce[] = data.annonces ?? []
      annonce = list.find(a => a.id === id) ?? null
    }
  } catch {
    // réseau indisponible
  }

  if (!annonce) redirect('/mes-annonces')

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: 'Mes annonces', href: '/mes-annonces' },
          { label: 'Modifier' }
        ]}
        emoji="✏️"
        titre="Modifier l'annonce"
        compteur="Toute modification soumettra votre annonce à une nouvelle modération."
      />
      <ModifierAnnonceForm annonce={annonce} />
    </div>
  )
}
