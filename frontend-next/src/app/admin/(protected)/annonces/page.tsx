import { cookies } from 'next/headers'
import AdminAnnoncesClient from './AdminAnnoncesClient'
import { BACKEND, extractAdminToken, adminHeaders } from '@/app/actions/admin/admin-common'

export const metadata = { title: 'Annonces — Admin Nopalou' }

export default async function AdminAnnoncesPage() {
  const jar = await cookies()
  const secret = extractAdminToken(jar)
  const headers = adminHeaders(secret)

  let data: { annonces?: any[]; counts?: any } = { annonces: [] }

  try {
    const r = await fetch(`${BACKEND}/api/annonces/admin/en-attente?limit=200`, {
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(9000),
    })
    if (r.ok) {
      data = await r.json()
    }
  } catch (err) {
    console.error('[ADMIN_ANNONCES_PAGE_FETCH_ERR]', err)
  }

  const annonces = Array.isArray(data.annonces) ? data.annonces : []
  const counts = data.counts

  return (
    <div className="admin-content">
      <h1 className="admin-page-titre">
        Annonces classifiées
        <span className="admin-page-count">{counts?.toutes ?? annonces.length}</span>
      </h1>
      <AdminAnnoncesClient annonces={annonces} initialCounts={counts} />
    </div>
  )
}
