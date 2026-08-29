import { cookies } from 'next/headers'
import AdminFeatureFlagsClient from './AdminFeatureFlagsClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

export const metadata = { title: 'Feature Flags — Admin Nopalou' }

export default async function AdminFeatureFlagsPage() {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value ?? ''

  let flags = []

  try {
    const res = await fetch(`${BACKEND}/api/feature-flags/admin/tous`, {
      headers: { 'X-Admin-Secret': secret },
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      flags = data.flags ?? []
    }
  } catch (err) {
    console.error('[FEATURE_FLAGS_PAGE_ERR]', err)
  }

  return (
    <div className="admin-content">
      <AdminFeatureFlagsClient initialFlags={flags} secret={secret} />
    </div>
  )
}
