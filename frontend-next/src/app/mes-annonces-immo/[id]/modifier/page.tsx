import { redirect } from 'next/navigation'
import { backendFetch } from '@/lib/backend-fetch'
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
    <div className="page-container" style={{ paddingTop: '2rem', maxWidth: 680 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <a href="/mes-annonces-immo" style={{ fontSize: 14, color: 'var(--accent)', textDecoration: 'none' }}>
          ← Mes annonces immo
        </a>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--navy)', margin: '8px 0 4px' }}>
          Modifier le bien
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text2)', margin: 0 }}>
          Toute modification soumettra votre annonce à une nouvelle validation.
        </p>
      </div>
      <ModifierImmoForm annonce={annonce} />
    </div>
  )
}
