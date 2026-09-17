import { cookies } from 'next/headers'
import ProduitsSupervisionClient from './ProduitsSupervisionClient'

export const metadata = {
  title: 'Catalogue Marchands & Modération Stocks | Nopalou Control Center',
}

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

export default async function AdminProduitsPage() {
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

  let data: any = { produits: [], total: 0, stats: {} }

  try {
    const res = await fetch(`${BACKEND}/api/admin/produits?limit=40`, { headers, cache: 'no-store' })
    if (res.ok) {
      data = await res.json()
    }
  } catch (err) {
    console.error('[ADMIN_PRODUITS_FETCH_ERR]', err)
  }

  return <ProduitsSupervisionClient initialData={data} />
}
