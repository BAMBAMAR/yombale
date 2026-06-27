import { cookies } from 'next/headers'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'
const SITE    = 'https://nopalou.com'

async function fetchSeoStats(secret: string) {
  const headers = { 'X-Admin-Secret': secret }
  const opts    = { headers, cache: 'no-store' as RequestCache }

  const [produitsRes, immoRes, annoncesRes] = await Promise.allSettled([
    fetch(`${BACKEND}/api/produits?limit=1`, opts),
    fetch(`${BACKEND}/api/immo?limit=1`, opts),
    fetch(`${BACKEND}/api/annonces?limit=1`, opts),
  ])

  let produits = 0, immo = 0, annonces = 0
  if (produitsRes.status === 'fulfilled' && produitsRes.value.ok) {
    const d = await produitsRes.value.json(); produits = d.total ?? 0
  }
  if (immoRes.status === 'fulfilled' && immoRes.value.ok) {
    const d = await immoRes.value.json(); immo = d.total ?? (d.annonces?.length ?? 0)
  }
  if (annoncesRes.status === 'fulfilled' && annoncesRes.value.ok) {
    const d = await annoncesRes.value.json(); annonces = d.total ?? (d.annonces?.length ?? 0)
  }

  return { produits, immo, annonces }
}

const PAGES_INDEXEES = [
  { url: '/', titre: 'Accueil — Comparateur de prix Sénégal', priorite: '1.0', freq: 'daily' },
  { url: '/immo', titre: 'Immobilier Sénégal — Acheter, Louer, Vendre', priorite: '0.9', freq: 'daily' },
  { url: '/telecom', titre: 'Comparateur Forfaits Télécom Sénégal', priorite: '0.9', freq: 'weekly' },
  { url: '/annonces', titre: 'Annonces classifiées Sénégal', priorite: '0.9', freq: 'daily' },
  { url: '/boutiques', titre: 'Boutiques partenaires', priorite: '0.7', freq: 'weekly' },
  { url: '/categorie/smartphones', titre: 'Smartphones au Sénégal — Comparer les prix', priorite: '0.85', freq: 'daily' },
  { url: '/categorie/informatique', titre: 'Informatique au Sénégal — Comparer les prix', priorite: '0.85', freq: 'daily' },
  { url: '/categorie/tv-electro', titre: 'TV & Électroménager au Sénégal', priorite: '0.85', freq: 'daily' },
  { url: '/categorie/mode', titre: 'Mode au Sénégal — Comparer les prix', priorite: '0.85', freq: 'daily' },
  { url: '/categorie/maison', titre: 'Maison au Sénégal — Comparer les prix', priorite: '0.85', freq: 'daily' },
  { url: '/categorie/auto-moto', titre: 'Auto & Moto au Sénégal', priorite: '0.85', freq: 'daily' },
  { url: '/guide-achat', titre: 'Guide d\'achat intelligent', priorite: '0.8', freq: 'weekly' },
  { url: '/deposer-annonce', titre: 'Publier une annonce', priorite: '0.7', freq: 'monthly' },
  { url: '/deposer-immo', titre: 'Publier un bien immobilier', priorite: '0.7', freq: 'monthly' },
]

export default async function AdminSeoPage() {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)!.value
  const stats  = await fetchSeoStats(secret)

  const totalPages = PAGES_INDEXEES.length + stats.produits + Math.min(stats.immo, 200) + Math.min(stats.annonces, 200)

  return (
    <div className="admin-content">
      <h1 className="admin-page-titre">SEO — Référencement</h1>

      {/* Stats rapides */}
      <div className="admin-stats-grid" style={{ marginBottom: 32 }}>
        <div className="admin-stat-card admin-stat-card--navy">
          <p className="admin-stat-value">{totalPages.toLocaleString('fr-SN')}+</p>
          <p className="admin-stat-label">Pages indexables totales</p>
        </div>
        <div className="admin-stat-card admin-stat-card--navy">
          <p className="admin-stat-value">{stats.produits.toLocaleString('fr-SN')}</p>
          <p className="admin-stat-label">Fiches produits</p>
        </div>
        <div className="admin-stat-card admin-stat-card--green">
          <p className="admin-stat-value">{PAGES_INDEXEES.length}</p>
          <p className="admin-stat-label">Pages statiques indexées</p>
        </div>
        <div className="admin-stat-card admin-stat-card--green">
          <p className="admin-stat-value">8</p>
          <p className="admin-stat-label">Pages catégories SEO</p>
        </div>
      </div>

      {/* Liens utiles */}
      <div className="admin-section" style={{ marginBottom: 32 }}>
        <h2 className="admin-section-titre">Outils de référencement</h2>
        <div className="admin-actions-row" style={{ flexWrap: 'wrap', gap: 12 }}>
          <a href={`${SITE}/sitemap.xml`} target="_blank" rel="noopener noreferrer" className="admin-action-btn">
            📄 Sitemap XML
          </a>
          <a href={`${SITE}/robots.txt`} target="_blank" rel="noopener noreferrer" className="admin-action-btn">
            🤖 Robots.txt
          </a>
          <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="admin-action-btn">
            📊 Google Search Console
          </a>
          <a href={`https://pagespeed.web.dev/report?url=${encodeURIComponent(SITE)}`} target="_blank" rel="noopener noreferrer" className="admin-action-btn">
            ⚡ PageSpeed Insights
          </a>
          <a href={`https://validator.schema.org/?url=${encodeURIComponent(SITE)}`} target="_blank" rel="noopener noreferrer" className="admin-action-btn">
            🔍 Schema Validator
          </a>
        </div>
      </div>

      {/* Pages indexées */}
      <div className="admin-section">
        <h2 className="admin-section-titre">Pages principales indexées ({PAGES_INDEXEES.length})</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>URL</th>
                <th>Titre SEO</th>
                <th>Priorité</th>
                <th>Fréquence</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {PAGES_INDEXEES.map(p => (
                <tr key={p.url}>
                  <td><code style={{ fontSize: 12 }}>{p.url}</code></td>
                  <td style={{ fontSize: 13 }}>{p.titre}</td>
                  <td>
                    <span className={`admin-badge ${parseFloat(p.priorite) >= 0.9 ? 'admin-badge--green' : 'admin-badge--blue'}`}>
                      {p.priorite}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: '#6b7280' }}>{p.freq}</td>
                  <td>
                    <a href={`${SITE}${p.url}`} target="_blank" rel="noopener noreferrer" className="admin-btn-small">
                      Voir →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON-LD actif */}
      <div className="admin-section" style={{ marginTop: 32 }}>
        <h2 className="admin-section-titre">Données structurées (JSON-LD) actives</h2>
        <div className="admin-seo-chips">
          {[
            { label: 'WebSite + SearchAction', page: 'Toutes les pages', color: 'green' },
            { label: 'BreadcrumbList', page: 'Catégories', color: 'green' },
            { label: 'ItemList', page: 'Catégories (top 10 produits)', color: 'green' },
            { label: 'Product', page: 'Fiche produit', color: 'green' },
          ].map(d => (
            <div key={d.label} className="admin-seo-chip">
              <span className={`admin-badge admin-badge--${d.color}`}>✓</span>
              <span className="admin-seo-chip-label">{d.label}</span>
              <span className="admin-seo-chip-page">{d.page}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mots-clés cibles */}
      <div className="admin-section" style={{ marginTop: 32 }}>
        <h2 className="admin-section-titre">Mots-clés cibles</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            'comparateur prix Sénégal', 'prix moins cher Dakar', 'meilleur prix Sénégal',
            'achat smartphone Dakar', 'immobilier Dakar', 'appartement louer Dakar',
            'forfait télécom Sénégal', 'Orange Tigo Free Sénégal', 'annonces classées Sénégal',
            'comparateur tv Dakar', 'ordinateur prix Sénégal', 'prix voiture Dakar',
          ].map(kw => (
            <span key={kw} style={{
              background: '#f0f4ff', color: '#3b5bdb', borderRadius: 6,
              padding: '4px 10px', fontSize: 13, border: '1px solid #c5d0fa'
            }}>
              {kw}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
