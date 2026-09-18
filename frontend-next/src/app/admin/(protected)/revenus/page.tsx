import { cookies } from 'next/headers'
import Link from 'next/link'
import {
  DollarSign, TrendingUp, Smartphone, Building2, Tag,
  ShoppingBag, Wallet, CheckCircle2, Sparkles, Store
} from 'lucide-react'

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
  transactions_manuel?:   string
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
  if (ref.startsWith('ann_'))   return 'Annonce'
  if (ref.startsWith('immo_'))  return 'Sponsoring Immo'
  if (ref.startsWith('bout_'))  return 'Sponsoring Boutique'
  if (ref.startsWith('prod_'))  return 'Sponsoring Produit'
  if (ref.startsWith('boost_')) return 'Boost Annonce'
  if (ref.startsWith('abmt_'))  return 'Abonnement Marchand'
  return 'Autre paiement'
}

export default async function AdminRevenusPage() {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value ?? ''
  if (!secret) return null

  let stats: RevenusStats | null = null
  let ventes: VentesStats | null = null
  let prixAnnonce = 1500
  try {
    const [resStats, resVentes, resSettings] = await Promise.all([
      fetch(`${BACKEND}/api/paiement/stats`, { headers: { 'X-Admin-Secret': secret }, cache: 'no-store' }),
      fetch(`${BACKEND}/api/comptabilite/admin/stats`, { headers: { 'X-Admin-Secret': secret }, cache: 'no-store' }),
      fetch(`${BACKEND}/api/settings/public`, { cache: 'no-store' }),
    ])
    if (resStats.ok) stats = await resStats.json()
    if (resVentes.ok) ventes = await resVentes.json()
    if (resSettings.ok) prixAnnonce = Number((await resSettings.json()).prix_annonce) || 1500
  } catch (err) { console.warn('[Nopalou:page:L71]', err); }

  if (!stats) {
    return (
      <div className="admin-content">
        <h1 className="admin-page-titre">Revenus</h1>
        <p style={{ color: 'var(--text2)' }}>Impossible de charger les statistiques.</p>
      </div>
    )
  }

  const total        = parseInt(stats.total_transactions) || 0
  const revTotal     = parseFloat(stats.revenus_total) || 0
  const revMois      = parseFloat(stats.revenus_mois) || 0
  const revSemaine   = parseFloat(stats.revenus_semaine) || 0
  const txMois       = parseInt(stats.transactions_mois) || 0
  const txWave       = parseInt(stats.transactions_wave) || 0
  const txOrange     = parseInt(stats.transactions_orange) || 0
  const txManuel     = parseInt(stats.transactions_manuel || '0') || 0
  const annonces     = parseInt(stats.annonces_payees) || 0
  const immoSponsor  = parseInt(stats.sponsorings_immo) || 0
  const boutSponsor  = parseInt(stats.sponsorings_boutiques) || 0

  return (
    <div className="admin-content">
      <div style={{ marginBottom: 24 }}>
        <h1 className="admin-page-titre" style={{ margin: 0 }}>
          Finances &amp; Comptabilité
        </h1>
        <p style={{ margin: '6px 0 0', color: 'var(--text2)', fontSize: 14 }}>
          Distinction comptable entre les revenus directs encaissés par Nopalou et le volume d&apos;affaires (GMV) du réseau marchand.
        </p>
      </div>

      {/* SECTION 1 : REVENUS DIRECTS PLATEFORME */}
      <div className="admin-section" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Wallet size={18} color="var(--price)" />
          <h2 className="admin-section-titre" style={{ margin: 0 }}>
            Revenus Directs Plateforme Nopalou (Monétisation SaaS &amp; Services)
          </h2>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text2)', margin: '0 0 16px' }}>
          Encaissements directs de Nopalou : activations d&apos;annonces classifiées, boosts de visibilité et sponsorings.
        </p>

        {/* Cartes stats Nopalou */}
        <div className="admin-stats-grid" style={{ marginBottom: 20 }}>
          <div className="admin-stat-card admin-stat-card--green">
            <p className="admin-stat-value">{fcfa(revTotal)}</p>
            <p className="admin-stat-label">Revenus totaux encaissés</p>
          </div>
          <div className="admin-stat-card admin-stat-card--navy">
            <p className="admin-stat-value">{fcfa(revMois)}</p>
            <p className="admin-stat-label">Ce mois-ci ({txMois} transactions)</p>
          </div>
          <div className="admin-stat-card admin-stat-card--navy">
            <p className="admin-stat-value">{fcfa(revSemaine)}</p>
            <p className="admin-stat-label">Cette semaine</p>
          </div>
          <div className="admin-stat-card admin-stat-card--green">
            <p className="admin-stat-value">{total}</p>
            <p className="admin-stat-label">Transactions totales payées</p>
          </div>
        </div>

        {/* Répartition canaux */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card admin-stat-card--navy">
            <p className="admin-stat-value">{txWave}</p>
            <p className="admin-stat-label">Paiements Wave</p>
          </div>
          <div className="admin-stat-card admin-stat-card--navy">
            <p className="admin-stat-value">{txOrange}</p>
            <p className="admin-stat-label">Orange Money</p>
          </div>
          <div className="admin-stat-card admin-stat-card--navy">
            <p className="admin-stat-value">{annonces}</p>
            <p className="admin-stat-label">Annonces activées ({prixAnnonce.toLocaleString('fr-FR')} FCFA)</p>
          </div>
          <div className="admin-stat-card admin-stat-card--navy">
            <p className="admin-stat-value">{immoSponsor + boutSponsor}</p>
            <p className="admin-stat-label">Sponsorings ({immoSponsor} immo + {boutSponsor} boutiques)</p>
          </div>
        </div>
      </div>

      {/* ── SECTION 2 : Ventes boutiques (GMV Marchand) ──────────────────── */}
      {ventes && (
        <div className="admin-section" style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Store size={18} color="var(--accent)" />
            <h2 className="admin-section-titre" style={{ margin: 0 }}>
              Volume d&apos;Affaires Réseau Marchands (GMV Caisses POS &amp; Ventes)
            </h2>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text2)', margin: '0 0 16px' }}>
            Chiffre d&apos;affaires généré par les commerçants via leurs caisses enregistreuses et le catalogue boutique Nopalou.
          </p>

          <div className="admin-stats-grid" style={{ marginBottom: 20 }}>
            <div className="admin-stat-card admin-stat-card--green">
              <p className="admin-stat-value">{fcfa(ventes.global.chiffre_affaires_total)}</p>
              <p className="admin-stat-label">CA total déclaré marchands</p>
            </div>
            <div className="admin-stat-card admin-stat-card--navy">
              <p className="admin-stat-value">{fcfa(ventes.global.ca_mois)}</p>
              <p className="admin-stat-label">Ce mois-ci</p>
            </div>
            <div className="admin-stat-card admin-stat-card--navy">
              <p className="admin-stat-value">{ventes.global.total_ventes}</p>
              <p className="admin-stat-label">Ventes comptoir &amp; web</p>
            </div>
            <div className="admin-stat-card admin-stat-card--navy">
              <p className="admin-stat-value">{ventes.global.boutiques_actives}</p>
              <p className="admin-stat-label">Boutiques actives avec ventes</p>
            </div>
          </div>

          {ventes.top_boutiques.length > 0 && (
            <>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 10 }}>Top boutiques contributrices</h3>
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
      )}

      {/* ── SECTION 3 : Transactions directes plateforme ──────────────────── */}
      <div className="admin-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <TrendingUp size={18} color="var(--navy)" />
          <h2 className="admin-section-titre" style={{ margin: 0 }}>
            30 Dernières Transactions Encaissées par Nopalou
          </h2>
        </div>
        {stats.recentes.length === 0 ? (
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>Aucune transaction enregistrée pour l&apos;instant.</p>
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
                      <span className={`admin-badge ${tx.methode_paiement === 'wave' ? 'admin-badge--blue' : tx.methode_paiement === 'orange' || tx.methode_paiement === 'orange_money' ? 'admin-badge--green' : 'admin-badge--gray'}`}>
                        {tx.methode_paiement === 'wave' ? 'Wave' : tx.methode_paiement === 'orange' || tx.methode_paiement === 'orange_money' ? 'Orange Money' : 'Manuel'}
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
