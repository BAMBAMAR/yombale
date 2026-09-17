import { cookies } from 'next/headers'
import PosSupervisionClient from './PosSupervisionClient'

export const metadata = {
  title: 'Supervision Réseau POS & Caisses | Nopalou Admin',
}

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

export default async function AdminPosPage() {
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
  let sessions: any[] = []

  try {
    const [rStats, rSessions] = await Promise.all([
      fetch(`${BACKEND}/api/admin/pos/stats?period=30d`, { headers, cache: 'no-store' }),
      fetch(`${BACKEND}/api/admin/pos/sessions?limit=30`, { headers, cache: 'no-store' }),
    ])

    if (rStats.ok) {
      const d = await rStats.json()
      stats = d.stats
    }
    if (rSessions.ok) {
      const d = await rSessions.json()
      sessions = d.sessions || []
    }
  } catch (err) {
    console.error('[ADMIN_POS_FETCH_ERR]', err)
  }

  return <PosSupervisionClient initialStats={stats} initialSessions={sessions} />
}
