import { cookies } from 'next/headers'
import PaiementsSupervisionClient from './PaiementsSupervisionClient'

export const metadata = {
  title: 'Flux Financiers & Rapprochement | Nopalou Control Center',
}

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

export default async function AdminPaiementsPage() {
  const jar = await cookies()
  const token = jar.get('nopalou_admin_jwt')?.value || jar.get('nopalou_admin')?.value || ''

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token.startsWith('eyJ')) {
    headers['Authorization'] = `Bearer ${token}`
    headers['Cookie'] = `nopalou_admin_jwt=${token}`
  } else {
    headers['X-Admin-Secret'] = token
  }

  let stats: any = null
  let flux: any[] = []

  try {
    const [rStats, rFlux] = await Promise.all([
      fetch(`${BACKEND}/api/admin/paiements/stats?period=30d`, { headers, cache: 'no-store' }),
      fetch(`${BACKEND}/api/admin/paiements/flux?limit=50`, { headers, cache: 'no-store' }),
    ])

    if (rStats.ok) {
      const d = await rStats.json()
      stats = d.stats
    }
    if (rFlux.ok) {
      const d = await rFlux.json()
      flux = d.flux || []
    }
  } catch (err) {
    console.error('[ADMIN_PAIEMENTS_FETCH_ERR]', err)
  }

  return <PaiementsSupervisionClient initialStats={stats} initialFlux={flux} />
}
