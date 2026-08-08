import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { adminLogout } from '@/app/actions/admin'

const COOKIE = 'nopalou_admin'

export const metadata = { title: 'Administration', robots: 'noindex, nofollow' }

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
          <a href="/admin" className="admin-nav-link">📊 Dashboard</a>

          <div className="admin-nav-group">
            <span className="admin-nav-group-title">Contenu</span>
            <a href="/admin/annonces" className="admin-nav-link">📋 Annonces classifiées</a>
            <a href="/admin/immo" className="admin-nav-link">🏠 Immo à valider</a>
            <a href="/admin/boutiques" className="admin-nav-link">🏪 Boutiques</a>
            <a href="/admin/telecom" className="admin-nav-link">📱 Forfaits télécom</a>
            <a href="/admin/qualite" className="admin-nav-link">🔍 Qualité Données</a>
          </div>

          <div className="admin-nav-group">
            <span className="admin-nav-group-title">Monétisation &amp; Facturation</span>
            <a href="/admin/comptes" className="admin-nav-link">👥 Comptes utilisateurs</a>
            <a href="/admin/abonnements" className="admin-nav-link">⭐ Abonnements</a>
            <a href="/admin/paiements-manuels" className="admin-nav-link">🧾 Paiements manuels</a>
            <a href="/admin/revenus" className="admin-nav-link">💰 Revenus</a>
          </div>

          <div className="admin-nav-group">
            <span className="admin-nav-group-title">Marketing &amp; Partenaires</span>
            <a href="/admin/partenaires" className="admin-nav-link">🤝 Partenaires</a>
            <a href="/admin/affiliation" className="admin-nav-link">🖱 Affiliation</a>
            <a href="/admin/affiliates/tracking" className="admin-nav-link">🔗 Tracking Affiliates</a>
            <a href="/admin/apporteurs" className="admin-nav-link">🤝 Apporteurs d&apos;affaires</a>
            <a href="/admin/tarifs" className="admin-nav-link">🏷 Tarifs &amp; Promos</a>
          </div>

          <div className="admin-nav-group">
            <span className="admin-nav-group-title">Canaux &amp; Outils</span>
            <a href="/admin/whatsapp" className="admin-nav-link">💬 WhatsApp</a>
            <a href="/admin/publications" className="admin-nav-link">📘 Publications Facebook</a>
            <a href="/admin/communication" className="admin-nav-link">🎨 Kit communication</a>
            <a href="/admin/developer" className="admin-nav-link">🔌 Portail Développeur API</a>
            <a href="/admin/seo" className="admin-nav-link">🔍 SEO</a>
          </div>

          <div className="admin-nav-group">
            <span className="admin-nav-group-title">Paramètres</span>
            <a href="/admin/compte" className="admin-nav-link">👤 Mon compte</a>
          </div>
        </nav>
        <form action={adminLogout} className="admin-logout-form">
          <button type="submit" className="admin-logout-btn">Déconnexion</button>
        </form>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  )
}
