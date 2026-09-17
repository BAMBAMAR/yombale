import '@/styles/admin.css'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { adminLogout, getAdminSession } from '@/app/actions/admin'
import AdminSidebarClient from './AdminSidebarClient'
import AdminOmnisearch from './AdminOmnisearch'
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs'

export const metadata = { title: 'Administration - Nopalou Control Center', robots: 'noindex, nofollow' }

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const adminUser = await getAdminSession()
  if (!adminUser) redirect('/admin/login')

  const jar = await cookies()
  const secret = jar.get('nopalou_admin')?.value || jar.get('nopalou_admin_jwt')?.value || ''

  return (
    <div className="admin-layout">
      <AdminSidebarClient logoutAction={adminLogout} adminUser={adminUser} />
      <main className="admin-main">
        <AdminOmnisearch secret={secret} />
        <AdminBreadcrumbs />
        {children}
      </main>
    </div>
  )
}
