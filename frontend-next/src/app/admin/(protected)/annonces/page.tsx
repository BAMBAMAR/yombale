import { cookies } from 'next/headers'
import AdminAnnoncesClient from './AdminAnnoncesClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

export const metadata = { title: 'Annonces — Admin Nopalou' }

export default async function AdminAnnoncesPage() {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value ?? ''

  const r = await fetch(`${BACKEND}/api/annonces/admin/en-attente`, {
    headers: { 'X-Admin-Secret': secret },
    cache: 'no-store',
  })

  const data = r.ok ? await r.json() : { annonces: [] }

  return (
    <div className="admin-content">
      <h1 className="admin-page-titre">
        Annonces classifiées
        <span className="admin-page-count">{data.annonces?.length ?? 0}</span>
      </h1>
      <AdminAnnoncesClient annonces={data.annonces ?? []} />
    </div>
  )
}
