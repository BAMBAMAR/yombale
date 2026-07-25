import { cookies } from 'next/headers'
import AdminPartenairesClient from './AdminPartenairesClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

export const metadata = { title: 'Partenaires — Admin Nopalou' }

interface Partenaire {
  id: string
  nom_entreprise: string
  secteur: string | null
  contact_nom: string | null
  contact_tel: string | null
  email: string | null
  description: string | null
  statut: string
  created_at: string
}

export default async function AdminPartenairesPage() {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value ?? ''

  let demandes: Partenaire[] = []
  try {
    const r = await fetch(`${BACKEND}/api/partenaires/admin/en-attente`, {
      headers: { 'X-Admin-Secret': secret },
      cache: 'no-store',
    })
    if (r.ok) {
      const data = await r.json()
      demandes = Array.isArray(data) ? data : []
    }
  } catch {
    // backend indisponible
  }

  return (
    <div className="admin-content">
      <h1 className="admin-page-titre">
        Partenaires — Demandes en attente
        <span className="admin-page-count">{demandes.length}</span>
      </h1>
      <AdminPartenairesClient demandes={demandes} />
    </div>
  )
}
