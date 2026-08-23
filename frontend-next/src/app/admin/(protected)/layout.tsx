import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { adminLogout } from '@/app/actions/admin'
import AdminSidebarClient from './AdminSidebarClient'

const COOKIE = 'nopalou_admin'

export const metadata = { title: 'Administration', robots: 'noindex, nofollow' }

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) redirect('/admin/login')

  return (
    <div className="admin-layout">
      <AdminSidebarClient logoutAction={adminLogout} />
      <main className="admin-main">{children}</main>
    </div>
  )
}
