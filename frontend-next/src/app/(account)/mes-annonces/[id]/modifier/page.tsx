import { redirect } from 'next/navigation'
import Link from 'next/link'
import { backendFetch } from '@/lib/backend-fetch'
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
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/mes-annonces" style={{ fontSize: 14, color: 'var(--accent)', textDecoration: 'none' }}>
          ← Retour à mes annonces
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--navy)', margin: '8px 0 4px' }}>
          Modifier l&apos;annonce
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text2)', margin: 0 }}>
          Toute modification soumettra votre annonce à une nouvelle modération.
        </p>
      </div>
      <ModifierAnnonceForm annonce={annonce} />
    </div>
  )
}
