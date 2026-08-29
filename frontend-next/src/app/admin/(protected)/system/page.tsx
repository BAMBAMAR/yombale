import { cookies } from 'next/headers'
import AdminSystemClient from './AdminSystemClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

export const metadata = { title: 'Santé Système & Maintenance — Admin Nopalou' }

export default async function AdminSystemPage() {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value ?? ''

  let systemData: any = null

  try {
    const res = await fetch(`${BACKEND}/api/admin/system/health`, {
      headers: { 'X-Admin-Secret': secret },
      cache: 'no-store',
    })
    if (res.ok) {
      systemData = await res.json()
    }
  } catch (err) {
    console.error('[ADMIN_SYSTEM_PAGE_ERR]', err)
  }

  return (
    <div className="admin-content">
      <AdminSystemClient initialData={systemData} secret={secret} />
    </div>
  )
}
