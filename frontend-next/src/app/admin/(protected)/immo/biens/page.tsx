import { cookies } from 'next/headers'
import BiensImmoClient from './BiensImmoClient'

export const metadata = {
  title: 'Parc Biens Immobiliers & Baux | Nopalou Control Center',
}

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

export default async function AdminBiensImmoPage() {
  const jar = await cookies()
  const token = jar.get('nopalou_admin_jwt')?.value || jar.get('nopalou_admin')?.value || ''

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token.startsWith('eyJ')) {
    headers['Authorization'] = `Bearer ${token}`
    headers['Cookie'] = `nopalou_admin_jwt=${token}`
  } else {
    headers['X-Admin-Secret'] = token
  }

  let biens: any[] = []
  let total = 0

  try {
    const res = await fetch(`${BACKEND}/api/admin/immo-global/biens?limit=50`, { headers, cache: 'no-store' })
    if (res.ok) {
      const d = await res.json()
      biens = d.biens || []
      total = d.total || 0
    }
  } catch (err) {
    console.error('[ADMIN_BIENS_FETCH_ERR]', err)
  }

  return <BiensImmoClient initialBiens={biens} total={total} />
}
