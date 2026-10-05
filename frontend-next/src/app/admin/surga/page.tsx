import { cookies } from 'next/headers'
import { getAdminSession, adminLogout } from '@/app/actions/admin'
import AdminSurgaClient from './AdminSurgaClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

export const metadata = {
  title: 'Surga Admin — Console de Commandement Autonome',
  description: 'Administration centralisée des contenus, concours, adresses, trafic et abonnements Surga.',
}

async function fetchJson(url: string, headers: Record<string, string>) {
  try {
    const r = await fetch(url, { headers, cache: 'no-store', signal: AbortSignal.timeout(3000) })
    if (!r.ok) return null
    return await r.json()
  } catch {
    return null
  }
}

export default async function AdminSurgaPage() {
  const adminUser = await getAdminSession()

  const jar = await cookies()
  const token = jar.get('nopalou_admin_jwt')?.value || jar.get('nopalou_admin')?.value || ''

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token.startsWith('eyJ')) {
    headers['Authorization'] = `Bearer ${token}`
    headers['Cookie'] = `nopalou_admin_jwt=${token}`
  } else {
    headers['X-Admin-Secret'] = token
  }

  const statsData = await fetchJson(`${BACKEND}/api/admin/surga/stats`, headers)

  return (
    <AdminSurgaClient
      initialStats={statsData?.stats}
      adminEmail={adminUser?.email}
      adminRole={adminUser?.role}
      logoutAction={adminLogout}
    />
  )
}
