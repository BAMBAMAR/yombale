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
  // Silos B2B Solutions Marchands "Problème → Solution"
  { url: '/creer-boutique-en-ligne', titre: 'Créer une Boutique en Ligne au Sénégal (2026)', priorite: '0.98', freq: 'weekly', type: 'B2B Solution' },
  { url: '/alternative-shopify-senegal', titre: 'Nopalou vs Shopify au Sénégal : Comparatif Factuel', priorite: '0.95', freq: 'weekly', type: 'B2B Solution' },
  { url: '/logiciel-caisse-senegal', titre: 'Logiciel de Caisse Enregistreuse au Sénégal (POS)', priorite: '0.95', freq: 'weekly', type: 'B2B Solution' },
  { url: '/vendre-sur-whatsapp', titre: 'Vendre sur WhatsApp au Sénégal : Boutique & Commandes', priorite: '0.95', freq: 'weekly', type: 'B2B Solution' },
  { url: '/paiement-en-ligne-senegal', titre: 'Paiement en Ligne au Sénégal : Wave & Orange Money', priorite: '0.95', freq: 'weekly', type: 'B2B Solution' },
  { url: '/gestion-stock-carnet-dettes', titre: 'Carnet de Dettes & Gestion de Stock au Sénégal', priorite: '0.95', freq: 'weekly', type: 'B2B Solution' },
  // Hubs Marchands existants
  { url: '/marchands', titre: 'Nopalou Marchands — E-commerce & Caisse', priorite: '0.95', freq: 'weekly', type: 'Hub Marchand' },
  { url: '/pos', titre: 'Caisse Enregistreuse Dakar & Sénégal', priorite: '0.90', freq: 'weekly', type: 'Application POS' },
  { url: '/whatsapp', titre: 'Vendre sur WhatsApp avec Nopalou', priorite: '0.90', freq: 'weekly', type: 'Hub WhatsApp' },
  { url: '/migration', titre: 'Migration Shopify & Excel vers Nopalou', priorite: '0.85', freq: 'monthly', type: 'Outil Migration' },
  { url: '/guide-creer-boutique', titre: 'Guide 2026 : Créer sa Boutique au Sénégal', priorite: '0.85', freq: 'monthly', type: 'Guide HowTo' },
  { url: '/guide-sourcing-revente', titre: 'Guide Sourcing Alibaba, AliExpress & Grossistes', priorite: '0.85', freq: 'monthly', type: 'Guide HowTo' },
  // Comparateur B2C & Portails
  { url: '/', titre: 'Accueil — Comparateur de prix Sénégal', priorite: '1.0', freq: 'daily', type: 'Portail B2C' },
  { url: '/immo', titre: 'Immobilier Sénégal — Acheter, Louer, Vendre', priorite: '0.9', freq: 'daily', type: 'Portail B2C' },
  { url: '/telecom', titre: 'Comparateur Forfaits Télécom Sénégal', priorite: '0.9', freq: 'weekly', type: 'Portail B2C' },
  { url: '/annonces', titre: 'Annonces classifiées Sénégal', priorite: '0.9', freq: 'daily', type: 'Portail B2C' },
  { url: '/boutiques', titre: 'Boutiques partenaires Nopalou', priorite: '0.7', freq: 'weekly', type: 'Annuaire' },
]

const OPPORTUNITES_SEO = [
  {
    intention: 'Imprimante ticket Bluetooth Dakar',
    requete: 'imprimante thermique ticket de caisse dakar wave',
    volumeEstime: 'Moyen',
    priorite: 'Haute',
    cible: '/logiciel-caisse-senegal',
    statut: 'Ciblée'
  },
  {
    intention: 'Avis Shopify au Sénégal',
    requete: 'pourquoi shopify ne marche pas au sénégal',
    volumeEstime: 'Fort',
    priorite: 'Très Haute',
    cible: '/alternative-shopify-senegal',
    statut: 'Ciblée'
  },
  {
    intention: 'Frais Wave pour commerçant',
    requete: 'frais wave paiement marchand boutique en ligne',
    volumeEstime: 'Très Fort',
    priorite: 'Urgente',
    cible: '/paiement-en-ligne-senegal',
    statut: 'Ciblée'
  },
  {
    intention: 'Relance impayés boutique Dakar',
    requete: 'comment récupérer argent dette client dakar',
    volumeEstime: 'Moyen',
    priorite: 'Moyenne',
    cible: '/gestion-stock-carnet-dettes',
    statut: 'Ciblée'
  }
]

export default async function AdminSeoPage() {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value ?? ''
  if (!secret) return null
  const stats  = await fetchSeoStats(secret)

  const totalPages = PAGES_INDEXEES.length + stats.produits + Math.min(stats.immo, 200) + Math.min(stats.annonces, 200)

  return (
    <div className="admin-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="admin-page-titre" style={{ margin: 0 }}>🧠 SEO Center & Intelligence de Recherche</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Supervision du positionnement organique Nopalou : Solutions Marchands B2B, Villes du Sénégal et Comparateur B2C.
          </p>
        </div>
        <span style={{
          background: 'rgba(16,185,129,0.1)', color: '#059669',
          padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700,
          display: 'inline-flex', alignItems: 'center', gap: 6
        }}>
          ● Indexation Saine (Zéro 404 critique)
        </span>
      </div>

      {/* Stats rapides */}
      <div className="admin-stats-grid" style={{ marginBottom: 32 }}>
        <div className="admin-stat-card admin-stat-card--navy">
          <p className="admin-stat-value">{totalPages.toLocaleString('fr-SN')}+</p>
          <p className="admin-stat-label">Pages indexables totales</p>
        </div>
        <div className="admin-stat-card admin-stat-card--navy">
          <p className="admin-stat-value">6</p>
          <p className="admin-stat-label">Nouvelles landings Solutions B2B</p>
        </div>
        <div className="admin-stat-card admin-stat-card--green">
          <p className="admin-stat-value">{PAGES_INDEXEES.length}</p>
          <p className="admin-stat-label">Pages statiques prioritaires</p>
        </div>
        <div className="admin-stat-card admin-stat-card--green">
          <p className="admin-stat-value">{stats.produits.toLocaleString('fr-SN')}</p>
          <p className="admin-stat-label">Fiches produits scrapées</p>
        </div>
      </div>

      {/* Radar Opportunités SEO */}
      <div className="admin-section" style={{ marginBottom: 32 }}>
        <h2 className="admin-section-titre">🔥 Radar Opportunités SEO « Problème → Solution » (Sénégal)</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Intention Détectée</th>
                <th>Requête type Google</th>
                <th>Volume estimé</th>
                <th>Priorité</th>
                <th>Page Nopalou Cible</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {OPPORTUNITES_SEO.map((o, idx) => (
                <tr key={idx}>
                  <td><strong>{o.intention}</strong></td>
                  <td><code>{o.requete}</code></td>
                  <td><span style={{ fontSize: 12, fontWeight: 600 }}>{o.volumeEstime}</span></td>
                  <td>
                    <span className={`admin-badge ${o.priorite.includes('Haute') || o.priorite.includes('Urgente') ? 'admin-badge--orange' : 'admin-badge--blue'}`}>
                      {o.priorite}
                    </span>
                  </td>
                  <td><code style={{ fontSize: 12 }}>{o.cible}</code></td>
                  <td>
                    <span className="admin-badge admin-badge--green">✓ {o.statut}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Outils et validateurs */}
      <div className="admin-section" style={{ marginBottom: 32 }}>
        <h2 className="admin-section-titre">Outils de référencement & Validation technique</h2>
        <div className="admin-actions-row" style={{ flexWrap: 'wrap', gap: 12 }}>
          <a href={`${SITE}/sitemap.xml`} target="_blank" rel="noopener noreferrer" className="admin-action-btn">
            📄 Sitemap XML Dynamique
          </a>
          <a href={`${SITE}/robots.txt`} target="_blank" rel="noopener noreferrer" className="admin-action-btn">
            🤖 Robots.txt (Anti-Scrape IA actif)
          </a>
          <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="admin-action-btn">
            📊 Google Search Console
          </a>
          <a href={`https://pagespeed.web.dev/report?url=${encodeURIComponent(SITE)}`} target="_blank" rel="noopener noreferrer" className="admin-action-btn">
            ⚡ PageSpeed Insights (Mobile First)
          </a>
          <a href={`https://validator.schema.org/?url=${encodeURIComponent(SITE)}`} target="_blank" rel="noopener noreferrer" className="admin-action-btn">
            🔍 Schema Validator (Product & Software)
          </a>
        </div>
      </div>

      {/* Pages principales indexées */}
      <div className="admin-section" style={{ marginBottom: 32 }}>
        <h2 className="admin-section-titre">Silos & Pages Stratégiques Indexées ({PAGES_INDEXEES.length})</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Type</th>
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
                  <td>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                      background: p.type.includes('Solution') ? '#fef3c7' : '#f1f5f9',
                      color: p.type.includes('Solution') ? '#92400e' : '#475569'
                    }}>
                      {p.type}
                    </span>
                  </td>
                  <td><code style={{ fontSize: 12 }}>{p.url}</code></td>
                  <td style={{ fontSize: 13, fontWeight: 600 }}>{p.titre}</td>
                  <td>
                    <span className={`admin-badge ${parseFloat(p.priorite) >= 0.95 ? 'admin-badge--green' : 'admin-badge--blue'}`}>
                      {p.priorite}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: '#6b7280' }}>{p.freq}</td>
                  <td>
                    <a href={`${SITE}${p.url}`} target="_blank" rel="noopener noreferrer" className="admin-btn-small">
                      Tester →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Données structurées JSON-LD */}
      <div className="admin-section" style={{ marginBottom: 32 }}>
        <h2 className="admin-section-titre">Architecture des Données Structurées (Schema.org)</h2>
        <div className="admin-seo-chips">
          {[
            { label: 'SoftwareApplication', page: 'Solutions Marchands & POS (/logiciel-caisse, /creer-boutique)', color: 'green' },
            { label: 'Store / LocalBusiness', page: 'Vitrines Boutiques Publiques (/boutiques/[id])', color: 'green' },
            { label: 'FAQPage (Rich Snippets)', page: 'Toutes les nouvelles landings Solutions', color: 'green' },
            { label: 'Product + Offer (XOF)', page: 'Fiches produits comparateur (/produit/[id])', color: 'green' },
            { label: 'HowTo + BreadcrumbList', page: 'Guides Commerçants (/guide-creer-boutique)', color: 'green' },
            { label: 'WebSite + SearchAction', page: 'Portail global racine', color: 'green' },
          ].map(d => (
            <div key={d.label} className="admin-seo-chip">
              <span className={`admin-badge admin-badge--${d.color}`}>✓</span>
              <span className="admin-seo-chip-label">{d.label}</span>
              <span className="admin-seo-chip-page">{d.page}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
