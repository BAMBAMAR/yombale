import { cookies } from 'next/headers'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

interface StatCard { label: string; value: number | string; sub?: string; color?: string }

async function fetchStats(secret: string) {
  const headers = { 'X-Admin-Secret': secret }
  const opts    = { headers, cache: 'no-store' as RequestCache }

  const [annoncesRes, immoRes, produitsRes, partenairesRes, sponsoringRes, boutiquesRes] = await Promise.allSettled([
    fetch(`${BACKEND}/api/annonces/admin/en-attente`, opts),
    fetch(`${BACKEND}/api/immo/admin/en-attente`, opts),
    fetch(`${BACKEND}/api/produits?limit=1`, opts),
    fetch(`${BACKEND}/api/partenaires/admin/en-attente`, opts),
    fetch(`${BACKEND}/api/immo/admin/demandes-sponsorisation`, opts),
    fetch(`${BACKEND}/api/boutiques/admin/toutes`, opts),
  ])

  let annonces: { annonces: { actif: boolean; rejete: boolean; payee: boolean }[] } = { annonces: [] }
  let immoEnAttente = 0
  let produits      = 0
  let partenairesEnAttente = 0
  let demandesSponsoring = 0
  let boutiquesTotal = 0

  if (annoncesRes.status === 'fulfilled' && annoncesRes.value.ok) {
    annonces = await annoncesRes.value.json()
  }
  if (immoRes.status === 'fulfilled' && immoRes.value.ok) {
    const d = await immoRes.value.json()
    immoEnAttente = (d.annonces ?? d).length ?? 0
  }
  if (produitsRes.status === 'fulfilled' && produitsRes.value.ok) {
    const d = await produitsRes.value.json()
    produits = d.total ?? 0
  }
  if (partenairesRes.status === 'fulfilled' && partenairesRes.value.ok) {
    const d = await partenairesRes.value.json()
    partenairesEnAttente = Array.isArray(d) ? d.length : 0
  }
  if (sponsoringRes.status === 'fulfilled' && sponsoringRes.value.ok) {
    const d = await sponsoringRes.value.json()
    demandesSponsoring = (d.annonces ?? d).length ?? 0
  }
  if (boutiquesRes.status === 'fulfilled' && boutiquesRes.value.ok) {
    const d = await boutiquesRes.value.json()
    boutiquesTotal = (d.boutiques ?? []).length ?? 0
  }

  const total      = annonces.annonces.length
  const actives    = annonces.annonces.filter(a => a.actif).length
  const enAttente  = annonces.annonces.filter(a => !a.actif && !a.rejete).length
  const rejetees   = annonces.annonces.filter(a => a.rejete).length

  return { total, actives, enAttente, rejetees, immoEnAttente, produits, partenairesEnAttente, demandesSponsoring, boutiquesTotal }
}

export default async function AdminDashboard() {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value ?? ''
  if (!secret) return null
  const stats  = await fetchStats(secret)

  const cards: StatCard[] = [
    { label: 'Produits scrapés',         value: stats.produits,              color: 'navy' },
    { label: 'Annonces classifiées',      value: stats.total,                 color: 'navy' },
    { label: 'Annonces actives',          value: stats.actives,               color: 'green' },
    { label: 'En attente modération',     value: stats.enAttente,             color: stats.enAttente > 0 ? 'orange' : 'green' },
    { label: 'Immo à valider',            value: stats.immoEnAttente,         color: stats.immoEnAttente > 0 ? 'orange' : 'green' },
    { label: 'Partenaires en attente',    value: stats.partenairesEnAttente,  color: stats.partenairesEnAttente > 0 ? 'orange' : 'green' },
    { label: 'Demandes sponsoring immo',  value: stats.demandesSponsoring,    color: stats.demandesSponsoring > 0 ? 'orange' : 'green' },
    { label: 'Boutiques enregistrées',    value: stats.boutiquesTotal,        color: 'navy' },
  ]

  return (
    <div className="admin-content">
      <h1 className="admin-page-titre">Dashboard</h1>
      <div className="admin-stats-grid">
        {cards.map(c => (
          <div key={c.label} className={`admin-stat-card admin-stat-card--${c.color}`}>
            <p className="admin-stat-value">{typeof c.value === 'number' ? c.value.toLocaleString('fr-SN') : c.value}</p>
            <p className="admin-stat-label">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="admin-quick-actions">
        <h2 className="admin-section-titre">Actions rapides</h2>
        <div className="admin-actions-row">
          <a href="/admin/annonces" className="admin-action-btn">
            Modérer les annonces
            {stats.enAttente > 0 && <span className="admin-badge">{stats.enAttente}</span>}
          </a>
          <a href="/admin/immo" className="admin-action-btn">
            Valider annonces immo
            {stats.immoEnAttente > 0 && <span className="admin-badge">{stats.immoEnAttente}</span>}
          </a>
          <a href="/admin/partenaires" className="admin-action-btn">
            Partenaires
            {stats.partenairesEnAttente > 0 && <span className="admin-badge">{stats.partenairesEnAttente}</span>}
          </a>
          <a href="/admin/boutiques" className="admin-action-btn">
            Boutiques
            {stats.boutiquesTotal > 0 && <span className="admin-badge">{stats.boutiquesTotal}</span>}
          </a>
        </div>
      </div>
    </div>
  )
}
