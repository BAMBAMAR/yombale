import { cookies } from 'next/headers'
import AdminBoutiquesClient from './AdminBoutiquesClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

export const metadata = { title: 'Boutiques — Admin Nopalou' }

interface Boutique {
  id: string
  nom: string
  slug?: string
  description: string | null
  categorie: string | null
  telephone: string | null
  whatsapp?: string | null
  adresse: string | null
  ville: string | null
  logo_url: string | null
  actif: boolean
  sponsorise: boolean
  sponsor_jusqu_au: string | null
  created_at: string
  derniere_relance_catalogue_at?: string | null
  nb_relances_catalogue?: number
  nb_produits?: number
  proprietaire_nom: string | null
  proprietaire_prenom?: string | null
  proprietaire_email: string | null
  proprietaire_telephone?: string | null
  plan_actif: 'pro' | 'business' | null
  plan_fin: string | null
}

export default async function AdminBoutiquesPage() {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value ?? ''

  let boutiques: Boutique[] = []
  let relanceConfig: any = null
  let relanceStats: any = null

  try {
    const [rBoutiques, rConfig] = await Promise.all([
      fetch(`${BACKEND}/api/boutiques/admin/toutes`, {
        headers: { 'X-Admin-Secret': secret },
        cache: 'no-store',
      }),
      fetch(`${BACKEND}/api/boutiques/admin/relance-catalogue/config`, {
        headers: { 'X-Admin-Secret': secret },
        cache: 'no-store',
      }).catch(() => null),
    ])

    if (rBoutiques.ok) {
      const data = await rBoutiques.json()
      boutiques = data.boutiques ?? []
    }
    if (rConfig && rConfig.ok) {
      const dataCfg = await rConfig.json()
      relanceConfig = dataCfg.config ?? null
      relanceStats = dataCfg.stats ?? null
    }
  } catch {
    // backend indisponible
  }

  return (
    <div className="admin-content">
      <h1 className="admin-page-titre">
        Boutiques
        <span className="admin-page-count">{boutiques.length}</span>
      </h1>
      <AdminBoutiquesClient
        boutiques={boutiques}
        initialRelanceConfig={relanceConfig}
        initialRelanceStats={relanceStats}
      />
    </div>
  )
}
