import { cookies } from 'next/headers'
import AdminSamaXaalisClient from './AdminSamaXaalisClient'

export const metadata = {
  title: 'Sama Xaalis (Supervision) | Nopalou Control Center',
}

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

export default async function AdminSamaXaalisPage() {
  const jar = await cookies()
  const token = jar.get('nopalou_admin_jwt')?.value || jar.get('nopalou_admin')?.value || ''

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token.startsWith('eyJ')) {
    headers['Authorization'] = `Bearer ${token}`
    headers['Cookie'] = `nopalou_admin_jwt=${token}`
  } else {
    headers['X-Admin-Secret'] = token
  }

  let stats: any = null
  let utilisateurs: any[] = []

  try {
    const [rStats, rUsers] = await Promise.all([
      fetch(`${BACKEND}/api/admin/kalpe/stats`, { headers, cache: 'no-store' }),
      fetch(`${BACKEND}/api/admin/kalpe/utilisateurs?limit=50`, { headers, cache: 'no-store' }),
    ])

    if (rStats.ok) {
      const d = await rStats.json()
      stats = d.stats
    }
    if (rUsers.ok) {
      const d = await rUsers.json()
      utilisateurs = d.utilisateurs || []
    }
  } catch (err) {
    console.error('[ADMIN_KALPE_FETCH_ERR]', err)
  }

  return <AdminSamaXaalisClient initialStats={stats} initialUtilisateurs={utilisateurs} />
}
