import { cookies } from 'next/headers'
import AgencesImmoClient from './AgencesImmoClient'

export const metadata = {
  title: 'Réseau Agences Immobilières | Nopalou Control Center',
}

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

export default async function AdminAgencesImmoPage() {
  const jar = await cookies()
  const token = jar.get('nopalou_admin_jwt')?.value || jar.get('nopalou_admin')?.value || ''

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token.startsWith('eyJ')) {
    headers['Authorization'] = `Bearer ${token}`
    headers['Cookie'] = `nopalou_admin_jwt=${token}`
  } else {
    headers['X-Admin-Secret'] = token
  }

  let agences: any[] = []
  let total = 0

  try {
    const res = await fetch(`${BACKEND}/api/admin/immo-global/agences?limit=200`, { headers, cache: 'no-store' })
    if (res.ok) {
      const d = await res.json()
      agences = d.agences || []
      total = d.total || 0
    }
  } catch (err) {
    console.error('[ADMIN_AGENCES_FETCH_ERR]', err)
  }

  return <AgencesImmoClient initialAgences={agences} total={total} />
}
