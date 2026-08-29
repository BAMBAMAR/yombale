import { cookies } from 'next/headers'
import AdminDashboardClient from './AdminDashboardClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

export const metadata = { title: 'Dashboard — Console Admin Nopalou' }

export default async function AdminDashboardPage() {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value ?? ''
  if (!secret) return null

  let stats: any = null

  try {
    const res = await fetch(`${BACKEND}/api/admin/dashboard/stats?period=30d`, {
      headers: { 'X-Admin-Secret': secret },
      cache: 'no-store',
    })
    if (res.ok) {
      stats = await res.json()
    }
  } catch (err) {
    console.error('[ADMIN_DASHBOARD_FETCH_ERR]', err)
  }

  return (
    <div className="admin-content">
      <AdminDashboardClient initialStats={stats} secret={secret} />
    </div>
  )
}
