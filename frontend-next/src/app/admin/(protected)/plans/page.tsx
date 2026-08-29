import { cookies } from 'next/headers'
import AdminPlansClient from './AdminPlansClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

export const metadata = { title: 'Plans & Forfaits — Admin Nopalou' }

export default async function AdminPlansPage() {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value ?? ''

  let plans = []

  try {
    const res = await fetch(`${BACKEND}/api/plans/admin/tous`, {
      headers: { 'X-Admin-Secret': secret },
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      plans = data.plans ?? []
    }
  } catch (err) {
    console.error('[PLANS_PAGE_ERR]', err)
  }

  return (
    <div className="admin-content">
      <AdminPlansClient initialPlans={plans} secret={secret} />
    </div>
  )
}
