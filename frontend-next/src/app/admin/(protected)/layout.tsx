import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { adminLogout } from '@/app/actions/admin'

const COOKIE = 'nopalou_admin'

export const metadata = { title: 'Administration — Nopalou', robots: 'noindex, nofollow' }

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) redirect('/admin/login')

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <a href="/admin" className="admin-logo">
          Nopa<span>lou</span>
          <em>Admin</em>
        </a>
        <nav className="admin-nav">
          <a href="/admin" className="admin-nav-link">Dashboard</a>
          <a href="/admin/annonces" className="admin-nav-link">Annonces classifiées</a>
          <a href="/admin/immo" className="admin-nav-link">Immo à valider</a>
          <a href="/admin/telecom" className="admin-nav-link">Forfaits télécom</a>
        </nav>
        <form action={adminLogout} className="admin-logout-form">
          <button type="submit" className="admin-logout-btn">Déconnexion</button>
        </form>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  )
}
