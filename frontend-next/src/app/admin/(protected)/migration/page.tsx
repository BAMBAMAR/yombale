import { cookies } from 'next/headers'
import AdminMigrationClient from './AdminMigrationClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

export const metadata = {
  title: 'Centre d\'Onboarding & Migration Marchands — Admin Nopalou',
  description: 'Migration ultra-rapide de catalogues depuis Shopify, WooCommerce, Excel, AliExpress, CoinAfrique, carnets de dettes et kits vitrine.',
}

export default async function AdminMigrationPage() {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value ?? ''

  let initialData = null

  try {
    const res = await fetch(`${BACKEND}/api/admin/migration/stats`, {
      headers: { 'X-Admin-Secret': secret },
      cache: 'no-store',
    })
    if (res.ok) {
      initialData = await res.json()
    }
  } catch (err) {
    console.error('[ADMIN_MIGRATION_PAGE_ERR]', err)
  }

  return (
    <div className="admin-content">
      <AdminMigrationClient initialData={initialData} secret={secret} />
    </div>
  )
}
