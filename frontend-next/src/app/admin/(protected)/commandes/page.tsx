import { cookies } from 'next/headers'
import AdminCommandesClient from './AdminCommandesClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

export const metadata = { title: 'Gestion des Commandes — Admin Nopalou' }

export default async function AdminCommandesPage() {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value ?? ''

  let initialData: any = { commandes: [], total: 0, stats: {} }

  try {
    const res = await fetch(`${BACKEND}/api/admin/commandes?page=1`, {
      headers: { 'X-Admin-Secret': secret },
      cache: 'no-store',
    })
    if (res.ok) {
      initialData = await res.json()
    }
  } catch (err) {
    console.error('[ADMIN_COMMANDES_PAGE_ERR]', err)
  }

  return (
    <div className="admin-content">
      <AdminCommandesClient initialData={initialData} secret={secret} />
    </div>
  )
}
