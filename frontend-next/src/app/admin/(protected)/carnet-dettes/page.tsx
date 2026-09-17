import { cookies } from 'next/headers'
import CarnetDettesClient from './CarnetDettesClient'

export const metadata = {
  title: 'Carnet de Dettes & Crédits | Nopalou Control Center',
}

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

export default async function AdminCarnetDettesPage() {
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
  let clients: any[] = []

  try {
    const [rStats, rClients] = await Promise.all([
      fetch(`${BACKEND}/api/admin/credits/stats`, { headers, cache: 'no-store' }),
      fetch(`${BACKEND}/api/admin/credits/clients?limit=50`, { headers, cache: 'no-store' }),
    ])

    if (rStats.ok) {
      const d = await rStats.json()
      stats = d.stats
    }
    if (rClients.ok) {
      const d = await rClients.json()
      clients = d.clients || []
    }
  } catch (err) {
    console.error('[ADMIN_CREDITS_FETCH_ERR]', err)
  }

  return <CarnetDettesClient initialStats={stats} initialClients={clients} />
}
