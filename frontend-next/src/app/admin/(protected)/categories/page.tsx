import { cookies } from 'next/headers'
import AdminCategoriesClient from './AdminCategoriesClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

export const metadata = { title: 'Catégories — Admin Nopalou' }

export default async function AdminCategoriesPage() {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value ?? ''

  let categories = []

  try {
    const res = await fetch(`${BACKEND}/api/categories/admin/toutes`, {
      headers: { 'X-Admin-Secret': secret },
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      categories = data.categories ?? []
    }
  } catch (err) {
    console.error('[CATEGORIES_PAGE_ERR]', err)
  }

  return (
    <div className="admin-content">
      <AdminCategoriesClient initialCategories={categories} secret={secret} />
    </div>
  )
}
