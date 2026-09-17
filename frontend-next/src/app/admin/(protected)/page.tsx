import { cookies } from 'next/headers'
import AdminDashboardClient from './AdminDashboardClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

export const metadata = { title: 'Dashboard — Console Admin Nopalou' }

export default async function AdminDashboardPage() {
  const jar   = await cookies()
  const token = jar.get('nopalou_admin_jwt')?.value || jar.get('nopalou_admin')?.value || ''
  if (!token) return null

  let stats: any = null

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token.startsWith('eyJ')) {
    headers['Authorization'] = `Bearer ${token}`
    headers['Cookie'] = `nopalou_admin_jwt=${token}`
  } else {
    headers['X-Admin-Secret'] = token
  }

  try {
    const res = await fetch(`${BACKEND}/api/admin/dashboard/stats?period=30d`, {
      headers,
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
      <AdminDashboardClient initialStats={stats} secret={token} />
    </div>
  )
}
