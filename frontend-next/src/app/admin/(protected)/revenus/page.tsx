import { cookies } from 'next/headers'
import Link from 'next/link'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

interface VentesStats {
  global: {
    total_ventes: number
    chiffre_affaires_total: string
    ca_mois: string
    ca_semaine: string
    boutiques_actives: number
  }
  top_boutiques: { boutique_nom: string; slug: string | null; nb_ventes: number; ca_total: string }[]
  recentes: { reference: string; nom_produit: string; montant_total: string; methode_paiement: string; created_at: string; boutique_nom: string }[]
}

interface RevenusStats {
  total_transactions:     string
  revenus_total:          string
  transactions_wave:      string
  transactions_orange:    string
  revenus_mois:           string
  transactions_mois:      string
  revenus_semaine:        string
  annonces_payees:        string
  sponsorings_immo:       string
  sponsorings_boutiques:  string
  recentes: {
    reference:         string
    montant:           string
    methode_paiement:  string
    created_at:        string
  }[]
}

function fcfa(v: string | number) {
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (!n) return '0 FCFA'
  return n.toLocaleString('fr-SN') + ' FCFA'
}

function typeLabel(ref: string) {
  if (ref.startsWith('ann_'))  return '📢 Annonce'
  if (ref.startsWith('immo_')) return '🏘 Immo sponsoring'
  if (ref.startsWith('bout_')) return '🏪 Boutique sponsoring'
  return '—'
}

export default async function AdminRevenusPage() {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value ?? ''
  if (!secret) return null

  let stats: RevenusStats | null = null
  let ventes: VentesStats | null = null
  try {
    const [resStats, resVentes] = await Promise.all([
      fetch(`${BACKEND}/api/paiement/stats`, { headers: { 'X-Admin-Secret': secret }, cache: 'no-store' }),
      fetch(`${BACKEND}/api/comptabilite/admin/stats`, { headers: { 'X-Admin-Secret': secret }, cache: 'no-store' }),
    ])
    if (resStats.ok) stats = await resStats.json()
    if (resVentes.ok) ventes = await resVentes.json()
  } catch {}

  if (!stats) {
    return (
      <div className="admin-content">
        <h1 className="admin-page-titre">Revenus</h1>
        <p style={{ color: 'var(--text2)' }}>Impossible de charger les statistiques.</p>
      </div>
    )
  }

  const total        = parseInt(stats.total_transactions)
  const revTotal     = parseFloat(stats.revenus_total)
  const revMois      = parseFloat(stats.revenus_mois)
  const revSemaine   = parseFloat(stats.revenus_semaine)
  const txMois       = parseInt(stats.transactions_mois)
  const txWave       = parseInt(stats.transactions_wave)
  const txOrange     = parseInt(stats.transactions_orange)
  const annonces     = parseInt(stats.annonces_payees)
  const immoSponsor  = parseInt(stats.sponsorings_immo)
  const boutSponsor  = parseInt(stats.sponsorings_boutiques)

  return (
    <div className="admin-content">
      <h1 className="admin-page-titre">Revenus &amp; Transactions</h1>

      {/* Cartes stats */}
      <div className="admin-stats-grid" style={{ marginBottom: 32 }}>
        <div className="admin-stat-card admin-stat-card--green">
          <p className="admin-stat-value">{fcfa(revTotal)}</p>
          <p className="admin-stat-label">Revenus totaux</p>
        </div>
        <div className="admin-stat-card admin-stat-card--navy">
          <p className="admin-stat-value">{fcfa(revMois)}</p>
          <p className="admin-stat-label">Ce mois-ci ({txMois} tx)</p>
        </div>
        <div className="admin-stat-card admin-stat-card--navy">
          <p className="admin-stat-value">{fcfa(revSemaine)}</p>
          <p className="admin-stat-label">Cette semaine</p>
        </div>
        <div className="admin-stat-card admin-stat-card--green">
          <p className="admin-stat-value">{total}</p>
          <p className="admin-stat-label">Transactions totales</p>
        </div>
      </div>

      {/* Répartition */}
      <div className="admin-section" style={{ marginBottom: 32 }}>
        <h2 className="admin-section-titre">Répartition</h2>
        <div className="admin-stats-grid">
          <div className="admin-stat-card admin-stat-card--navy">
            <p className="admin-stat-value">🌊 {txWave}</p>
            <p className="admin-stat-label">Paiements Wave</p>
          </div>
          <div className="admin-stat-card admin-stat-card--navy">
            <p className="admin-stat-value">🟠 {txOrange}</p>
            <p className="admin-stat-label">Paiements Orange Money</p>
          </div>
          <div className="admin-stat-card admin-stat-card--navy">
            <p className="admin-stat-value">📢 {annonces}</p>
            <p className="admin-stat-label">Annonces activées (1 500 FCFA)</p>
          </div>
          <div className="admin-stat-card admin-stat-card--navy">
            <p className="admin-stat-value">⭐ {immoSponsor + boutSponsor}</p>
            <p className="admin-stat-label">Sponsorings ({immoSponsor} immo + {boutSponsor} boutiques)</p>
          </div>
        </div>
      </div>

      {/* ── Ventes boutiques ──────────────────────────────────────────────── */}
      {ventes && (
        <>
          <div className="admin-section" style={{ marginBottom: 32 }}>
            <h2 className="admin-section-titre">🏪 Ventes boutiques (comptabilité)</h2>
            <div className="admin-stats-grid" style={{ marginBottom: 20 }}>
              <div className="admin-stat-card admin-stat-card--green">
                <p className="admin-stat-value">{fcfa(ventes.global.chiffre_affaires_total)}</p>
                <p className="admin-stat-label">CA total déclaré</p>
              </div>
              <div className="admin-stat-card admin-stat-card--navy">
                <p className="admin-stat-value">{fcfa(ventes.global.ca_mois)}</p>
                <p className="admin-stat-label">Ce mois-ci</p>
              </div>
              <div className="admin-stat-card admin-stat-card--navy">
                <p className="admin-stat-value">{ventes.global.total_ventes}</p>
                <p className="admin-stat-label">Ventes déclarées</p>
              </div>
              <div className="admin-stat-card admin-stat-card--navy">
                <p className="admin-stat-value">{ventes.global.boutiques_actives}</p>
                <p className="admin-stat-label">Boutiques actives</p>
              </div>
            </div>

            {ventes.top_boutiques.length > 0 && (
              <>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 10 }}>Top boutiques</h3>
                <div className="admin-table-wrap" style={{ marginBottom: 20 }}>
                  <table className="admin-table">
                    <thead><tr><th>Boutique</th><th>Ventes</th><th>CA total</th></tr></thead>
                    <tbody>
                      {ventes.top_boutiques.map(b => (
                        <tr key={b.boutique_nom}>
                          <td>
                            <Link href={`/boutiques/${b.slug || ''}`} target="_blank" style={{ color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>
                              {b.boutique_nom}
                            </Link>
                          </td>
                          <td>{b.nb_ventes}</td>
                          <td style={{ fontWeight: 700, color: 'var(--green)' }}>{fcfa(b.ca_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {ventes.recentes.length > 0 && (
              <>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 10 }}>30 dernières ventes boutiques</h3>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead><tr><th>Date</th><th>Boutique</th><th>Produit</th><th>Montant</th><th>Paiement</th></tr></thead>
                    <tbody>
                      {ventes.recentes.map(v => (
                        <tr key={v.reference}>
                          <td style={{ fontSize: 12, color: '#6b7280' }}>{new Date(v.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</td>
                          <td style={{ fontSize: 13 }}>{v.boutique_nom}</td>
                          <td style={{ fontSize: 13 }}>{v.nom_produit}</td>
                          <td style={{ fontWeight: 700, color: 'var(--green)' }}>{fcfa(v.montant_total)}</td>
                          <td><span className="admin-badge admin-badge--blue">{v.methode_paiement}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Transactions récentes */}
      <div className="admin-section">
        <h2 className="admin-section-titre">30 dernières transactions Nopalou</h2>
        {stats.recentes.length === 0 ? (
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>Aucune transaction pour l&apos;instant.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Référence</th>
                  <th>Montant</th>
                  <th>Méthode</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentes.map((tx) => (
                  <tr key={tx.reference}>
                    <td style={{ fontSize: 12, color: '#6b7280' }}>
                      {new Date(tx.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td>{typeLabel(tx.reference)}</td>
                    <td><code style={{ fontSize: 11 }}>{tx.reference.slice(0, 30)}</code></td>
                    <td style={{ fontWeight: 700, color: 'var(--green)' }}>{fcfa(tx.montant)}</td>
                    <td>
                      <span className={`admin-badge ${tx.methode_paiement === 'wave' ? 'admin-badge--blue' : 'admin-badge--green'}`}>
                        {tx.methode_paiement === 'wave' ? '🌊 Wave' : '🟠 Orange'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
