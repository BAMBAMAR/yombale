import { cookies } from 'next/headers'
import DataHealthClient from './DataHealthClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

export const metadata = { title: 'Santé des Données & Intégrité — Console Admin Nopalou' }

export default async function DataHealthPage() {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value ?? ''
  if (!secret) return null

  let healthData: any = null

  try {
    const res = await fetch(`${BACKEND}/api/admin/system/data-health`, {
      headers: { 'X-Admin-Secret': secret },
      cache: 'no-store',
    })
    if (res.ok) {
      healthData = await res.json()
    }
  } catch (err) {
    console.error('[ADMIN_DATA_HEALTH_FETCH_ERR]', err)
  }

  return (
    <div className="admin-content">
      <DataHealthClient initialData={healthData} secret={secret} />
    </div>
  )
}
