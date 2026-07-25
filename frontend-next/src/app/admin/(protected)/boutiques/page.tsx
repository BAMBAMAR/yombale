import { cookies } from 'next/headers'
import AdminBoutiquesClient from './AdminBoutiquesClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

export const metadata = { title: 'Boutiques — Admin Nopalou' }

interface Boutique {
  id: string
  nom: string
  description: string | null
  categorie: string | null
  telephone: string | null
  adresse: string | null
  ville: string | null
  logo_url: string | null
  actif: boolean
  sponsorise: boolean
  sponsor_jusqu_au: string | null
  created_at: string
  proprietaire_nom: string | null
  proprietaire_email: string | null
  plan_actif: 'pro' | 'business' | null
  plan_fin: string | null
}

export default async function AdminBoutiquesPage() {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value ?? ''

  let boutiques: Boutique[] = []
  try {
    const r = await fetch(`${BACKEND}/api/boutiques/admin/toutes`, {
      headers: { 'X-Admin-Secret': secret },
      cache: 'no-store',
    })
    if (r.ok) {
      const data = await r.json()
      boutiques = data.boutiques ?? []
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
      <AdminBoutiquesClient boutiques={boutiques} />
    </div>
  )
}
