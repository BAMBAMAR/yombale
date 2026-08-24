'use client'
import { useEffect, useState, useRef, useTransition } from 'react'
import {
  listZones, createZone, deleteZone,
  listVentes, declarerVente, deleteVente, updateVente,
  getDashboard, listDepenses, addDepense, deleteDepense, updateDepense,
  updateStock, getBoutiqueProduits, getBilanComptable, getInventaireValorise,
  getPosSessions, getPosSessionDetail
} from './actions'
import { fcfa, formatNombre, fmtDate, fmtDateHeure } from '@/lib/format'
import { exportToCSV, printPDFReport, printBilanComptablePDF, printInventairePDF, printPosSessionRapportZ_PDF } from '@/lib/export'
import { CONFIG_SCANNER_EAN_PRO, capturerZoneViseurExacte, jouerBipEtVibrer } from '@/lib/scanner-helper'
import { useTranslation } from '@/i18n/context'
import { useScrollNudge } from '@/hooks/useScrollNudge'

interface Zone    { id: string; nom: string; prix: number }
interface Vente   { id: string; reference: string; nom_produit: string; quantite: number; prix_unitaire: number; frais_livraison: number; montant_total: number; client_nom: string | null; methode_paiement: string; created_at: string; justificatif_url: string | null }
interface Produit { id: string; nom: string; prix: number | null; prix_promo?: number | null; prix_achat?: number | null; stock_quantite: number | null; quantite_stock?: number | null; code_barre?: string | null; categorie?: string | null }
interface Depense { id: string; montant: number; categorie: string; description: string | null; date_depense: string; justificatif_url: string | null }
interface Dashboard {
  ca_mois: number; ca_mois_precedent: number; nb_ventes_mois: number; ca_total: number
  depenses_mois: number; depenses_total: number; benefice_mois: number
  top_produits: { nom_produit: string; total_vendu: number; ca: number }[]
  stock_alerte: { id: string; nom: string; stock_quantite: number }[]
}

interface BilanData {
  periode: { from: string | null; to: string | null }
  financier: {
    ca_total: number
    depenses_total: number
    benefice_net: number
    marge_nette_pct: number
    nb_ventes: number
    panier_moyen: number
    total_articles_vendus: number
    modes_paiement: { mode: string; count: number; total: number }[]
    depenses_par_categorie: Record<string, number>
    top_produits: { nom_produit: string; total_vendu: number; ca_genere: number }[]
    timeline: { jour: string; nb_ventes: number; ca: number }[]
  }
  inventaire: {
    total_references: number
    total_quantite_stock: number
    valeur_stock_achat: number
    valeur_stock_vente: number
    marge_stock_potentielle: number
    marge_stock_pct: number
    stock_alertes_count: number
    stock_ruptures_count: number
  }
  caissiers: {
    nom: string
    nb_ventes: number
    ca_total: number
    panier_moyen: number
    ca_especes: number
    ca_digital: number
    part_ca_pct: number
  }[]
}

const MOIS_NOMS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

const inputStyle = { padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, width: '100%', background: '#fff', boxSizing: 'border-box' as const }
const labelStyle = { fontSize: 13, fontWeight: 600 as const, color: '#374151', display: 'block' as const, marginBottom: 4 }

const CAT_DEPENSES = ['loyer', 'stock', 'transport', 'salaires', 'marketing', 'fournitures', 'taxes', 'autre']

type DatePreset = 'today' | 'yesterday' | '7d' | '30d' | 'this_month' | 'last_month' | 'this_year' | 'custom'

function getDateRangeForPreset(preset: DatePreset): { from: string; to: string; label: string } {
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  
  if (preset === 'today') {
    return { from: todayStr + 'T00:00:00.000Z', to: todayStr + 'T23:59:59.999Z', label: 'Aujourd\'hui' }
  }
  if (preset === 'yesterday') {
    const yest = new Date(now.getTime() - 24 * 3600 * 1000)
    const yStr = yest.toISOString().slice(0, 10)
    return { from: yStr + 'T00:00:00.000Z', to: yStr + 'T23:59:59.999Z', label: 'Hier' }
  }
  if (preset === '7d') {
    const d7 = new Date(now.getTime() - 7 * 24 * 3600 * 1000)
    return { from: d7.toISOString().slice(0, 10) + 'T00:00:00.000Z', to: todayStr + 'T23:59:59.999Z', label: '7 derniers jours' }
  }
  if (preset === '30d') {
    const d30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000)
    return { from: d30.toISOString().slice(0, 10) + 'T00:00:00.000Z', to: todayStr + 'T23:59:59.999Z', label: '30 derniers jours' }
  }
  if (preset === 'this_month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    return { from: firstDay + 'T00:00:00.000Z', to: todayStr + 'T23:59:59.999Z', label: 'Ce mois-ci' }
  }
  if (preset === 'last_month') {
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10)
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10)
    return { from: firstDayLastMonth + 'T00:00:00.000Z', to: lastDayLastMonth + 'T23:59:59.999Z', label: 'Mois dernier' }
  }
  if (preset === 'this_year') {
    const firstDayYear = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10)
    return { from: firstDayYear + 'T00:00:00.000Z', to: todayStr + 'T23:59:59.999Z', label: 'Cette année' }
  }
  return { from: '', to: '', label: 'Période personnalisée' }
}

// ── Dashboard / Bilan Périodique & Multi-Critères ──────────────────────────────

function KpiCard({ label, value, sub, color, bg }: { label: string; value: string; sub?: string; color?: string; bg?: string }) {
  return (
    <div style={{ background: bg || '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px', flex: '1 1 140px', minWidth: 130, boxSizing: 'border-box', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
      <p style={{ margin: '0 0 4px', fontSize: 11.5, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: color ?? '#111827' }}>{value}</p>
      {sub && <p style={{ margin: '3px 0 0', fontSize: 11, color: '#94a3b8' }}>{sub}</p>}
    </div>
  )
}

function BilanView({ boutiqueId, boutiqueNom = 'Ma Boutique' }: { boutiqueId: string; boutiqueNom?: string }) {
  const { t } = useTranslation()
  const [preset, setPreset] = useState<DatePreset>('this_month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [selectedCaissier, setSelectedCaissier] = useState('')
  const [selectedMode, setSelectedMode] = useState('')

  const [bilan, setBilan] = useState<BilanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const activeRange = preset === 'custom' 
    ? { from: customFrom ? customFrom + 'T00:00:00.000Z' : '', to: customTo ? customTo + 'T23:59:59.999Z' : '', label: 'Période personnalisée' }
    : getDateRangeForPreset(preset)

  const loadBilan = async () => {
    setLoading(true)
    setErrorMessage(null)
    const cacheKey = `nopalou_bilan_${boutiqueId}_${preset}_${activeRange.from}_${activeRange.to}_${selectedCaissier}_${selectedMode}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        setBilan(JSON.parse(cached))
        setLoading(false)
      } catch (e) {}
    }

    try {
      const data = await getBilanComptable(boutiqueId, {
        from: activeRange.from || undefined,
        to: activeRange.to || undefined,
        caissier: selectedCaissier || undefined,
        mode_paiement: selectedMode || undefined,
      })
      if (data && !data.error) {
        setBilan(data)
        setErrorMessage(null)
        localStorage.setItem(cacheKey, JSON.stringify(data))
      } else if (data?.error) {
        setErrorMessage(data.error)
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Erreur de communication avec le serveur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBilan()
  }, [boutiqueId, preset, customFrom, customTo, selectedCaissier, selectedMode])

  const handleExportCSV = () => {
    if (!bilan) return
    const headers = ['Métrique', 'Valeur', 'Détails']
    const rows: (string | number)[][] = [
      ['Période analysée', activeRange.label, `${activeRange.from || 'Début'} au ${activeRange.to || 'Fin'}`],
      ['Chiffre d\'Affaires Total', bilan.financier.ca_total, 'FCFA'],
      ['Total Dépenses', bilan.financier.depenses_total, 'FCFA'],
      ['Bénéfice Net', bilan.financier.benefice_net, 'FCFA'],
      ['Taux de Marge Nette', `${bilan.financier.marge_nette_pct}%`, ''],
      ['Nombre de Ventes', bilan.financier.nb_ventes, 'tickets'],
      ['Panier Moyen', bilan.financier.panier_moyen, 'FCFA / transaction'],
      ['Articles Vendus', bilan.financier.total_articles_vendus, 'unités'],
      ['---', '---', '---'],
      ['Valeur Stock Achat', bilan.inventaire.valeur_stock_achat, 'FCFA'],
      ['Valeur Stock Vente', bilan.inventaire.valeur_stock_vente, 'FCFA'],
      ['Marge Stock Potentielle', bilan.inventaire.marge_stock_potentielle, `${bilan.inventaire.marge_stock_pct}%`],
    ]

    exportToCSV(`bilan_${boutiqueNom.replace(/\s+/g, '_')}_${preset}`, headers, rows)
  }

  const handleExportPDF = () => {
    if (!bilan) return
    printBilanComptablePDF({
      boutiqueNom,
      periodeLabel: activeRange.label + (preset === 'custom' && customFrom && customTo ? ` (${customFrom} au ${customTo})` : ''),
      financier: bilan.financier,
      inventaire: bilan.inventaire,
      caissiers: bilan.caissiers,
    })
  }

  const presetsList: { id: DatePreset; label: string }[] = [
    { id: 'today', label: '⚡ Aujourd\'hui' },
    { id: 'yesterday', label: '📅 Hier' },
    { id: '7d', label: '🗓️ 7 jours' },
    { id: '30d', label: '🗓️ 30 jours' },
    { id: 'this_month', label: '📊 Ce mois-ci' },
    { id: 'last_month', label: '📆 Mois dernier' },
    { id: 'this_year', label: '🏛️ Cette année' },
    { id: 'custom', label: '⚙️ Période libre' },
  ]

  const modeLabels: Record<string, string> = { wave: 'Wave', orange_money: 'Orange Money', cash: 'Espèces', virement: 'Virement', carte: 'Carte bancaire' }
  const modeColors: Record<string, string> = { wave: '#00c3e3', orange_money: '#ff7900', cash: '#16a34a', virement: '#1e3a8a', carte: '#9333ea' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Barre Universelle de Période & Filtres ── */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>📅</span>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1e293b' }}>
              Période d&apos;analyse : <span style={{ color: '#C75B00' }}>{activeRange.label}</span>
            </h3>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={loading || !bilan}
              style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span>📄</span>
              <span>Bilan PDF</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={loading || !bilan}
              style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #16a34a', background: '#f0fdf4', color: '#15803d', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span>📊</span>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Pilules de raccourcis temporels */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', overflowX: 'auto', paddingBottom: 2 }}>
          {presetsList.map(p => {
            const isActive = preset === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: isActive ? 800 : 600,
                  border: isActive ? '1px solid #C75B00' : '1px solid #e2e8f0',
                  background: isActive ? '#fff7ed' : '#f8fafc',
                  color: isActive ? '#C75B00' : '#475569',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {p.label}
              </button>
            )
          })}
        </div>

        {/* Ligne filtres spécifiques (Dates libres + Caissier + Mode) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
          {preset === 'custom' && (
            <>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 2 }}>Du (Date début)</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={e => setCustomFrom(e.target.value)}
                  style={{ ...inputStyle, padding: '6px 10px', fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 2 }}>Au (Date fin)</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={e => setCustomTo(e.target.value)}
                  style={{ ...inputStyle, padding: '6px 10px', fontSize: 13 }}
                />
              </div>
            </>
          )}

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 2 }}>Filtrer par Caissier</label>
            <select
              value={selectedCaissier}
              onChange={e => setSelectedCaissier(e.target.value)}
              style={{ ...inputStyle, padding: '7px 10px', fontSize: 13 }}
            >
              <option value="">Tous les caissiers</option>
              {bilan?.caissiers?.map(c => (
                <option key={c.nom} value={c.nom}>{c.nom} ({fcfa(c.ca_total)})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 2 }}>Mode de règlement</label>
            <select
              value={selectedMode}
              onChange={e => setSelectedMode(e.target.value)}
              style={{ ...inputStyle, padding: '7px 10px', fontSize: 13 }}
            >
              <option value="">Tous les règlements</option>
              <option value="wave">🌊 Wave</option>
              <option value="orange_money">🍊 Orange Money</option>
              <option value="cash">💵 Espèces</option>
              <option value="carte">💳 Carte Bancaire</option>
              <option value="virement">🏦 Virement</option>
            </select>
          </div>
        </div>
      </div>

      {loading && !bilan ? (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 90, flex: 1, minWidth: 140, borderRadius: 12 }} />
          ))}
        </div>
      ) : !bilan ? (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <p style={{ color: '#b91c1c', fontSize: 13.5, margin: 0, fontWeight: 600 }}>
            ⚠️ {errorMessage || 'Impossible de charger le bilan comptable pour le moment.'}
          </p>
          <button
            type="button"
            onClick={loadBilan}
            style={{ padding: '6px 14px', borderRadius: 8, background: '#dc2626', color: '#fff', border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
          >
            🔄 Réessayer
          </button>
        </div>
      ) : (
        <>
          {/* ── KPIs Financiers Principaux ── */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <KpiCard
              label="Chiffre d'Affaires (CA)"
              value={fcfa(bilan.financier.ca_total)}
              sub={`${bilan.financier.nb_ventes} ventes (${bilan.financier.total_articles_vendus} articles)`}
              color="#1e3a8a"
              bg="#eff6ff"
            />
            <KpiCard
              label="Total Dépenses"
              value={fcfa(bilan.financier.depenses_total)}
              sub="Charges d'exploitation"
              color="#dc2626"
              bg="#fef2f2"
            />
            <KpiCard
              label="Bénéfice Net Réalisé"
              value={fcfa(bilan.financier.benefice_net)}
              sub={`Marge nette : ${bilan.financier.marge_nette_pct}%`}
              color={bilan.financier.benefice_net >= 0 ? '#15803d' : '#b91c1c'}
              bg={bilan.financier.benefice_net >= 0 ? '#f0fdf4' : '#fef2f2'}
            />
            <KpiCard
              label="Panier Moyen (AOV)"
              value={fcfa(bilan.financier.panier_moyen)}
              sub="Moyenne par client"
              color="#b45309"
              bg="#fffbeb"
            />
          </div>

          {/* ── Grille Intermédiaire : Règlements & Top Articles (Auto-fit mobile) ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            {/* Répartition des encaissements */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: '#1e293b' }}>💳 Modes de Règlement</p>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Total : {fcfa(bilan.financier.ca_total)}</span>
              </div>

              {bilan.financier.modes_paiement.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: 12.5, margin: 0 }}>Aucun encaissement sur la période sélectionnée.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {bilan.financier.modes_paiement.map(m => {
                    const pct = bilan.financier.ca_total > 0 ? Math.round((m.total / bilan.financier.ca_total) * 100) : 0
                    const barColor = modeColors[m.mode] || '#64748b'
                    return (
                      <div key={m.mode}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, color: '#334155' }}>
                            {modeLabels[m.mode] || m.mode} <span style={{ color: '#94a3b8', fontWeight: 500 }}>({m.count}x)</span>
                          </span>
                          <span style={{ fontWeight: 800, color: '#0f172a' }}>
                            {fcfa(m.total)} <span style={{ color: '#64748b', fontWeight: 600 }}>({pct}%)</span>
                          </span>
                        </div>
                        <div style={{ width: '100%', height: 7, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 4, transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Top Produits Vendus */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 20px' }}>
              <p style={{ margin: '0 0 14px', fontSize: 13.5, fontWeight: 800, color: '#1e293b' }}>🏆 Top Articles sur la période</p>
              {bilan.financier.top_produits.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: 12.5, margin: 0 }}>Aucune vente d&apos;article sur la période sélectionnée.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {bilan.financier.top_produits.map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5, paddingBottom: 6, borderBottom: idx < bilan.financier.top_produits.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 20, height: 20, borderRadius: 6, background: idx === 0 ? '#fef3c7' : '#f1f5f9', color: idx === 0 ? '#b45309' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
                          {idx + 1}
                        </span>
                        <span style={{ fontWeight: 600, color: '#334155' }}>{p.nom_produit}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 800, color: '#0f172a' }}>{fcfa(p.ca_genere)}</span>
                        <span style={{ display: 'block', fontSize: 10.5, color: '#64748b' }}>{p.total_vendu} vendus</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── 📦 Vue Inventaire & Valorisation du Stock ──────────────────────────────────

function InventaireView({ boutiqueId, boutiqueNom = 'Ma Boutique' }: { boutiqueId: string; boutiqueNom?: string }) {
  const { t } = useTranslation()
  const [produits, setProduits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtreRecherche, setFiltreRecherche] = useState('')
  const [filtreStatut, setFiltreStatut] = useState<'tous' | 'alerte' | 'en_stock'>('tous')
  const [ajustantId, setAjustantId] = useState<string | null>(null)
  const [nouveauStock, setNouveauStock] = useState<number>(0)
  const [, startTransition] = useTransition()

  const loadInventaire = async () => {
    setLoading(true)
    const cacheKey = `nopalou_inventaire_${boutiqueId}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        setProduits(JSON.parse(cached))
        setLoading(false)
      } catch (e) {}
    }

    try {
      const data = await getInventaireValorise(boutiqueId)
      if (Array.isArray(data)) {
        setProduits(data)
        localStorage.setItem(cacheKey, JSON.stringify(data))
      }
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInventaire()
  }, [boutiqueId])

  const totalReferences = produits.length
  const totalQuantiteStock = produits.reduce((acc, p) => acc + (Number(p.stock_quantite) || 0), 0)
  const valeurStockAchat = produits.reduce((acc, p) => acc + (Number(p.valeur_achat_totale) || 0), 0)
  const valeurStockVente = produits.reduce((acc, p) => acc + (Number(p.valeur_vente_totale) || 0), 0)
  const margeStockPotentielle = valeurStockVente - valeurStockAchat
  const margeStockPct = valeurStockVente > 0 ? Math.round((margeStockPotentielle / valeurStockVente) * 100) : 0
  const stockAlertesCount = produits.filter(p => p.stock_quantite !== null && p.stock_quantite <= 3).length

  const produitsFiltres = produits.filter(p => {
    if (filtreRecherche.trim()) {
      const q = filtreRecherche.trim().toLowerCase()
      const matchNom = p.nom?.toLowerCase().includes(q)
      const matchCat = p.categorie?.toLowerCase().includes(q)
      const matchCode = p.code_barre?.toLowerCase().includes(q)
      if (!matchNom && !matchCat && !matchCode) return false
    }
    if (filtreStatut === 'alerte') {
      if (p.stock_quantite === null || p.stock_quantite > 3) return false
    }
    if (filtreStatut === 'en_stock') {
      if (p.stock_quantite !== null && p.stock_quantite <= 0) return false
    }
    return true
  })

  const handleExportExcel = () => {
    const headers = ['Référence / ID', 'Désignation Article', 'Catégorie', 'Code-barres', 'Stock Disponible', 'Prix d\'Achat (Coût)', 'Prix de Vente', 'Valeur Stock Achat', 'Valeur Marchande Vente', 'Marge Unitaire', 'Marge %']
    const rows = produits.map(p => [
      p.id,
      p.nom,
      p.categorie || 'Non classé',
      p.code_barre || '',
      p.stock_quantite ?? 0,
      p.prix_achat ?? 0,
      p.prix ?? 0,
      p.valeur_achat_totale ?? 0,
      p.valeur_vente_totale ?? 0,
      p.marge_unitaire ?? 0,
      `${p.marge_pct ?? 0}%`,
    ])

    exportToCSV(`inventaire_valorise_${boutiqueNom.replace(/\s+/g, '_')}`, headers, rows)
  }

  const handlePrintPDF = () => {
    printInventairePDF({
      boutiqueNom,
      inventaireStats: {
        total_references: totalReferences,
        total_quantite_stock: totalQuantiteStock,
        valeur_stock_achat: valeurStockAchat,
        valeur_stock_vente: valeurStockVente,
        marge_stock_potentielle: margeStockPotentielle,
      },
      produits: produitsFiltres,
    })
  }

  const submitAjustementStock = (prodId: string) => {
    startTransition(async () => {
      await updateStock(boutiqueId, prodId, nouveauStock)
      setAjustantId(null)
      loadInventaire()
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── KPIs Valorisation du Stock ── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard
          label="Valeur Coût d'Achat"
          value={fcfa(valeurStockAchat)}
          sub="Capital immobilisé dans le stock"
          color="#0f172a"
          bg="#f8fafc"
        />
        <KpiCard
          label="Valeur Marchande (Vente)"
          value={fcfa(valeurStockVente)}
          sub="CA potentiel si tout est vendu"
          color="#1e3a8a"
          bg="#eff6ff"
        />
        <KpiCard
          label="Marge Brute Potentielle"
          value={fcfa(margeStockPotentielle)}
          sub={`Taux de marge prévisionnel : ${margeStockPct}%`}
          color="#15803d"
          bg="#f0fdf4"
        />
        <KpiCard
          label="Articles en Stock"
          value={`${formatNombre(totalQuantiteStock)} pcs`}
          sub={`${totalReferences} références (${stockAlertesCount} en alerte)`}
          color={stockAlertesCount > 0 ? '#b45309' : '#0f172a'}
          bg={stockAlertesCount > 0 ? '#fffbeb' : '#ffffff'}
        />
      </div>

      {/* ── Barre d'Actions & Filtres ── */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: '1 1 240px' }}>
            <input
              type="text"
              placeholder="🔍 Rechercher un article, catégorie, code-barres…"
              value={filtreRecherche}
              onChange={e => setFiltreRecherche(e.target.value)}
              style={{ ...inputStyle, padding: '8px 12px', fontSize: 13 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handlePrintPDF}
              style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #0284c7', background: '#f0f9ff', color: '#0369a1', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span>🖨️</span>
              <span>Fiche Pointage PDF</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #16a34a', background: '#f0fdf4', color: '#15803d', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span>📊</span>
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Pilules de statut stock */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'tous', label: `Tous (${totalReferences})` },
            { id: 'alerte', label: `⚠️ Ruptures & Alertes (${stockAlertesCount})` },
            { id: 'en_stock', label: `✅ En stock normal` },
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltreStatut(f.id as any)}
              style={{
                padding: '4px 10px',
                borderRadius: 16,
                fontSize: 12,
                fontWeight: filtreStatut === f.id ? 800 : 600,
                border: filtreStatut === f.id ? '1px solid #0284c7' : '1px solid #e2e8f0',
                background: filtreStatut === f.id ? '#e0f2fe' : '#f8fafc',
                color: filtreStatut === f.id ? '#0369a1' : '#64748b',
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tableau d'Inventaire Détaillé (Touch Scroll) ── */}
      {loading && produits.length === 0 ? (
        <p style={{ color: '#94a3b8' }}>Chargement de l&apos;inventaire…</p>
      ) : (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left', minWidth: 620 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 16px' }}>Article</th>
                  <th style={{ padding: '12px 12px' }}>Catégorie</th>
                  <th style={{ padding: '12px 12px', textAlign: 'center' }}>Stock</th>
                  <th style={{ padding: '12px 12px', textAlign: 'right' }}>Prix Achat</th>
                  <th style={{ padding: '12px 12px', textAlign: 'right' }}>Prix Vente</th>
                  <th style={{ padding: '12px 12px', textAlign: 'right' }}>Valeur Vente</th>
                  <th style={{ padding: '12px 12px', textAlign: 'right' }}>Marge (%)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {produitsFiltres.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                      Aucun article correspondant trouvé.
                    </td>
                  </tr>
                ) : (
                  produitsFiltres.map(p => {
                    const isAlert = p.stock_quantite !== null && p.stock_quantite <= 3
                    const isEditing = ajustantId === p.id
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                          <div>{p.nom}</div>
                          {p.code_barre && <span style={{ fontSize: 10.5, color: '#64748b', fontFamily: 'monospace' }}>EAN: {p.code_barre}</span>}
                        </td>
                        <td style={{ padding: '12px 12px', color: '#64748b', fontSize: 12 }}>{p.categorie || '—'}</td>
                        <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                              <input
                                type="number"
                                min={0}
                                value={nouveauStock}
                                onChange={e => setNouveauStock(Number(e.target.value))}
                                style={{ width: 60, padding: '4px 6px', borderRadius: 6, border: '1px solid #0284c7', fontSize: 12, textAlign: 'center' }}
                              />
                              <button onClick={() => submitAjustementStock(p.id)} style={{ padding: '4px 8px', borderRadius: 6, background: '#16a34a', color: '#fff', border: 'none', fontSize: 11, cursor: 'pointer' }}>✓</button>
                              <button onClick={() => setAjustantId(null)} style={{ padding: '4px 8px', borderRadius: 6, background: '#e2e8f0', color: '#0f172a', border: 'none', fontSize: 11, cursor: 'pointer' }}>✕</button>
                            </div>
                          ) : (
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 12,
                              fontSize: 12,
                              fontWeight: 800,
                              background: isAlert ? '#fef3c7' : '#f1f5f9',
                              color: isAlert ? '#b45309' : '#0f172a',
                            }}>
                              {p.stock_quantite ?? 0}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 12px', textAlign: 'right', color: '#64748b' }}>
                          {p.prix_achat ? fcfa(p.prix_achat) : '—'}
                        </td>
                        <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                          {p.prix ? fcfa(p.prix) : '—'}
                        </td>
                        <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 800, color: '#1e3a8a' }}>
                          {fcfa(p.valeur_vente_totale || ((p.prix || 0) * (p.stock_quantite || 0)))}
                        </td>
                        <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 700, color: p.marge_pct > 0 ? '#16a34a' : '#64748b' }}>
                          {p.marge_pct ? `${p.marge_pct}%` : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {!isEditing && (
                            <button
                              type="button"
                              onClick={() => { setAjustantId(p.id); setNouveauStock(p.stock_quantite ?? 0) }}
                              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                            >
                              Ajuster
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 👤 Vue Performances des Caissiers ─────────────────────────────────────────

function PerformancesCaissiersView({ boutiqueId, boutiqueNom = 'Ma Boutique' }: { boutiqueId: string; boutiqueNom?: string }) {
  const { t } = useTranslation()
  const [preset, setPreset] = useState<DatePreset>('this_month')
  const [bilan, setBilan] = useState<BilanData | null>(null)
  const [loading, setLoading] = useState(true)

  const activeRange = getDateRangeForPreset(preset)

  useEffect(() => {
    setLoading(true)
    const cacheKey = `nopalou_caissiers_bilan_${boutiqueId}_${preset}`
    const cached = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null
    if (cached) {
      try {
        setBilan(JSON.parse(cached))
        setLoading(false)
      } catch (e) {}
    }

    getBilanComptable(boutiqueId, { from: activeRange.from, to: activeRange.to })
      .then(data => {
        if (data && !data.error) {
          setBilan(data)
          if (typeof window !== 'undefined') {
            localStorage.setItem(cacheKey, JSON.stringify(data))
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [boutiqueId, preset])

  const handleExportCaissiers = () => {
    if (!bilan) return
    const headers = ['Caissier / Vendeur', 'Tickets Encaissés', 'Chiffre d\'Affaires Total', 'Panier Moyen', 'Part du CA Global', 'Encaissements Espèces', 'Encaissements Digitaux']
    const rows = bilan.caissiers.map(c => [
      c.nom,
      c.nb_ventes,
      c.ca_total,
      c.panier_moyen,
      `${c.part_ca_pct}%`,
      c.ca_especes,
      c.ca_digital,
    ])
    exportToCSV(`performances_caissiers_${boutiqueNom.replace(/\s+/g, '_')}_${preset}`, headers, rows)
  }

  const presetsList: { id: DatePreset; label: string }[] = [
    { id: 'today', label: 'Aujourd\'hui' },
    { id: 'yesterday', label: 'Hier' },
    { id: '7d', label: '7 jours' },
    { id: '30d', label: '30 jours' },
    { id: 'this_month', label: 'Ce mois-ci' },
    { id: 'this_year', label: 'Cette année' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Barre de sélection période */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {presetsList.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreset(p.id)}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: preset === p.id ? 800 : 600,
                border: preset === p.id ? '1px solid #1e3a8a' : '1px solid #e2e8f0',
                background: preset === p.id ? '#eff6ff' : '#f8fafc',
                color: preset === p.id ? '#1e3a8a' : '#475569',
                cursor: 'pointer',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleExportCaissiers}
          disabled={loading || !bilan}
          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #16a34a', background: '#f0fdf4', color: '#15803d', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span>📊</span>
          <span>Export Classement CSV</span>
        </button>
      </div>

      {/* Tableau comparatif des caissiers */}
      {loading && !bilan ? (
        <p style={{ color: '#94a3b8' }}>Chargement des statistiques caissiers…</p>
      ) : !bilan || bilan.caissiers.length === 0 ? (
        <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 12, padding: 32, textAlign: 'center', color: '#64748b' }}>
          <p style={{ fontSize: 24, margin: '0 0 8px' }}>👤</p>
          <p style={{ margin: 0, fontWeight: 700 }}>Aucune vente enregistrée par un caissier sur cette période.</p>
        </div>
      ) : (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left', minWidth: 540 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 16px' }}>Rang & Caissier</th>
                  <th style={{ padding: '12px 12px', textAlign: 'right' }}>Tickets Ventes</th>
                  <th style={{ padding: '12px 12px', textAlign: 'right' }}>CA Encaissé</th>
                  <th style={{ padding: '12px 12px', textAlign: 'right' }}>Panier Moyen</th>
                  <th style={{ padding: '12px 12px', textAlign: 'right' }}>Part Boutique</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Espèces vs Digital</th>
                </tr>
              </thead>
              <tbody>
                {bilan.caissiers.map((c, idx) => {
                  const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`
                  return (
                    <tr key={c.nom} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0f172a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16 }}>{medal}</span>
                          <span>{c.nom}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 700, color: '#334155' }}>
                        {c.nb_ventes} tickets
                      </td>
                      <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 900, color: '#1e3a8a' }}>
                        {fcfa(c.ca_total)}
                      </td>
                      <td style={{ padding: '12px 12px', textAlign: 'right', color: '#475569' }}>
                        {fcfa(c.panier_moyen)}
                      </td>
                      <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 800, color: '#15803d' }}>
                        {c.part_ca_pct}%
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, color: '#64748b' }}>
                        <span>💵 {fcfa(c.ca_especes)}</span> · <span style={{ color: '#0284c7' }}>📱 {fcfa(c.ca_digital)}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}


// ── Onglet 🧾 Clôtures & Rapports Z ──────────────────────────────────────────

interface PosSessionItem {
  id: string
  boutique_id: string
  caissier_id: string | null
  caissier_nom: string
  fond_caisse_initial: number
  especes_comptees: number
  ventes_especes: number
  ventes_wave: number
  ventes_orange_money: number
  ventes_carte: number
  ventes_total: number
  nb_ventes: number
  ecart_caisse: number
  statut: 'ouverte' | 'cloturee'
  date_ouverture: string
  date_cloture: string | null
  created_at: string
}

export function RapportsZView({ boutiqueId, boutiqueNom = 'Ma Boutique' }: { boutiqueId: string; boutiqueNom?: string }) {
  const { t } = useTranslation()
  const [sessions, setSessions] = useState<PosSessionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [preset, setPreset] = useState<DatePreset>('this_month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [selectedCaissier, setSelectedCaissier] = useState('')
  const [selectedStatut, setSelectedStatut] = useState<'tous' | 'cloturee' | 'ouverte'>('tous')
  const [modalSessionVentes, setModalSessionVentes] = useState<{ session: PosSessionItem; ventes: any[] } | null>(null)
  const [loadingVentes, setLoadingVentes] = useState(false)
  const [printingId, setPrintingId] = useState<string | null>(null)
  const { scrollRef: presetScrollRef, scrollToCenter } = useScrollNudge()

  const activeRange = preset === 'custom'
    ? { from: customFrom ? customFrom + 'T00:00:00.000Z' : '', to: customTo ? customTo + 'T23:59:59.999Z' : '', label: 'Période personnalisée' }
    : getDateRangeForPreset(preset)

  const loadSessions = async () => {
    setLoading(true)
    const cacheKey = `nopalou_offline_pos_sessions_${boutiqueId}`
    const cached = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null
    if (cached) {
      try {
        setSessions(JSON.parse(cached))
        setLoading(false)
      } catch (e) {}
    }

    try {
      const res = await getPosSessions(boutiqueId, {
        from: activeRange.from || undefined,
        to: activeRange.to || undefined,
        caissier: selectedCaissier || undefined,
        statut: selectedStatut !== 'tous' ? selectedStatut : undefined,
      })
      if (res && Array.isArray(res.sessions)) {
        setSessions(res.sessions)
        if (typeof window !== 'undefined') {
          localStorage.setItem(cacheKey, JSON.stringify(res.sessions))
        }
      }
    } catch (e) {
      console.warn(`📊 [Clôtures Z] Mode hors-ligne : utilisation du cache (${cached ? 'disponible' : 'vide'}).`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [boutiqueId, preset, customFrom, customTo, selectedCaissier, selectedStatut])

  // Caissiers uniques trouvés dans les sessions
  const caissiersList = Array.from(new Set(sessions.map(s => s.caissier_nom).filter(Boolean)))

  // Métriques consolidées
  const totalCA = sessions.reduce((acc, s) => acc + Number(s.ventes_total || 0), 0)
  const totalTickets = sessions.reduce((acc, s) => acc + Number(s.nb_ventes || 0), 0)
  const totalEcart = sessions.reduce((acc, s) => acc + Number(s.ecart_caisse || 0), 0)
  const nbCloturees = sessions.filter(s => s.statut === 'cloturee').length
  const nbOuvertes = sessions.filter(s => s.statut === 'ouverte').length

  const handlePrintRapportZ = async (session: PosSessionItem) => {
    setPrintingId(session.id)
    try {
      const detail = await getPosSessionDetail(boutiqueId, session.id)
      printPosSessionRapportZ_PDF({
        boutiqueNom,
        session,
        ventes: detail?.ventes || [],
      })
    } catch (err) {
      console.error(err)
      printPosSessionRapportZ_PDF({
        boutiqueNom,
        session,
        ventes: [],
      })
    } finally {
      setPrintingId(null)
    }
  }

  const handleOpenVentesModal = async (session: PosSessionItem) => {
    setLoadingVentes(true)
    setModalSessionVentes({ session, ventes: [] })
    try {
      const detail = await getPosSessionDetail(boutiqueId, session.id)
      setModalSessionVentes({ session, ventes: detail?.ventes || [] })
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingVentes(false)
    }
  }

  const handleExportSessionCSV = async (session: PosSessionItem) => {
    try {
      const detail = await getPosSessionDetail(boutiqueId, session.id)
      const ventes = detail?.ventes || []
      const headers = ['Référence Ticket', 'Date/Heure', 'Article', 'Quantité', 'Prix Unitaire', 'Montant Total', 'Mode Règlement', 'Caissier']
      const rows = ventes.map((v: any) => [
        v.reference || '—',
        v.created_at ? new Date(v.created_at).toLocaleString('fr-FR') : '—',
        v.nom_produit || 'Article',
        v.quantite || 1,
        v.prix_unitaire || 0,
        v.montant_total || 0,
        (v.methode_paiement || 'cash').toUpperCase(),
        v.caissier_nom || session.caissier_nom || 'Caissier'
      ])
      exportToCSV(`ventes_session_${session.caissier_nom?.replace(/\s+/g, '_')}_${session.id.slice(0, 8)}`, headers, rows)
    } catch (e) {
      console.error(e)
    }
  }

  const handleExportGlobalCSV = () => {
    if (sessions.length === 0) return
    const headers = [
      'ID Session',
      'Statut',
      'Caissier',
      'Date Ouverture',
      'Date Clôture',
      'Fond Initial (FCFA)',
      'CA Total (FCFA)',
      'Nombre Tickets',
      'Ventes Espèces',
      'Ventes Wave',
      'Ventes Orange Money',
      'Ventes Carte',
      'Espèces Comptées',
      'Écart Caisse (FCFA)'
    ]
    const rows = sessions.map(s => [
      s.id,
      s.statut === 'cloturee' ? 'Clôturée Z' : 'En cours',
      s.caissier_nom || 'Caissier',
      s.date_ouverture ? new Date(s.date_ouverture).toLocaleString('fr-FR') : '—',
      s.date_cloture ? new Date(s.date_cloture).toLocaleString('fr-FR') : 'En cours',
      Number(s.fond_caisse_initial || 0),
      Number(s.ventes_total || 0),
      Number(s.nb_ventes || 0),
      Number(s.ventes_especes || 0),
      Number(s.ventes_wave || 0),
      Number(s.ventes_orange_money || 0),
      Number(s.ventes_carte || 0),
      Number(s.especes_comptees || 0),
      Number(s.ecart_caisse || 0)
    ])
    exportToCSV(`rapports_z_sessions_${boutiqueNom.replace(/\s+/g, '_')}`, headers, rows)
  }

  const presetsList: { id: DatePreset; label: string }[] = [
    { id: 'today', label: '⚡ Aujourd\'hui' },
    { id: 'yesterday', label: '📅 Hier' },
    { id: '7d', label: '7 derniers jours' },
    { id: '30d', label: '30 derniers jours' },
    { id: 'this_month', label: 'Ce mois-ci' },
    { id: 'last_month', label: 'Mois dernier' },
    { id: 'this_year', label: 'Cette année' },
    { id: 'custom', label: '⚙️ Période libre' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Barre de Contrôle : Périodes & Filtres ── */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              🧾 Historique des Sessions & Rapports Z
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#64748b' }}>
              Consultez, ré-imprimez et exportez les clôtures journalières et tickets de fin de service
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleExportGlobalCSV}
              disabled={sessions.length === 0}
              style={{
                padding: '8px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #cbd5e1',
                color: '#334155', fontWeight: 700, fontSize: 12.5, cursor: sessions.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s'
              }}
            >
              📊 Export CSV Synthèse
            </button>
            <button
              type="button"
              onClick={loadSessions}
              style={{
                padding: '8px 12px', borderRadius: 10, background: '#f1f5f9', border: '1px solid #cbd5e1',
                color: '#0f172a', fontWeight: 700, fontSize: 12.5, cursor: 'pointer'
              }}
              title="Actualiser les données"
            >
              🔄
            </button>
          </div>
        </div>

        {/* ── Sélecteur de Presets ── */}
        <div ref={presetScrollRef} className="nopalou-scroll-tabs horizontal-scroll-fade" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {presetsList.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={(e) => {
                setPreset(p.id)
                scrollToCenter(e.currentTarget)
              }}
              style={{
                padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                background: preset === p.id ? '#C75B00' : '#f1f5f9',
                color: preset === p.id ? '#ffffff' : '#475569',
                boxShadow: preset === p.id ? '0 2px 6px rgba(199, 91, 0, 0.3)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* ── Filtres Secondaires ── */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', paddingTop: 6, borderTop: '1px dashed #e2e8f0' }}>
          {preset === 'custom' && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
              />
              <span style={{ fontSize: 12, color: '#94a3b8' }}>au</span>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
              />
            </div>
          )}

          {caissiersList.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>👤 Caissier :</span>
              <select
                value={selectedCaissier}
                onChange={e => setSelectedCaissier(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 600 }}
              >
                <option value="">Tous les caissiers</option>
                {caissiersList.map((cn, i) => (
                  <option key={i} value={cn}>{cn}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>🏷️ Statut :</span>
            <select
              value={selectedStatut}
              onChange={e => setSelectedStatut(e.target.value as any)}
              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 600 }}
            >
              <option value="tous">Tous les statuts</option>
              <option value="cloturee">🟢 Clôturées Z</option>
              <option value="ouverte">🟡 En cours</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── KPIs Consolidés des Sessions ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <KpiCard
          label="Chiffre d'Affaires Encaissé"
          value={fcfa(totalCA)}
          sub={`${totalTickets} tickets encaissés`}
          color="#1e3a8a"
          bg="#eff6ff"
        />
        <KpiCard
          label="Sessions Enregistrées"
          value={`${sessions.length}`}
          sub={`${nbCloturees} clôturées · ${nbOuvertes} en cours`}
          color="#C75B00"
          bg="#fff7ed"
        />
        <KpiCard
          label="Écart de Caisse Cumulé"
          value={`${totalEcart >= 0 ? '+' : ''}${fcfa(totalEcart)}`}
          sub={totalEcart === 0 ? 'Parfait équilibre de caisse' : totalEcart > 0 ? 'Excédent global constaté' : 'Déficit global constaté'}
          color={totalEcart === 0 ? '#15803d' : totalEcart > 0 ? '#1d4ed8' : '#dc2626'}
          bg={totalEcart === 0 ? '#f0fdf4' : totalEcart > 0 ? '#eff6ff' : '#fef2f2'}
        />
      </div>

      {/* ── Liste des Sessions de Caisse ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14 }} />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#ffffff', borderRadius: 16, border: '1px dashed #cbd5e1', color: '#64748b' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🧾</div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Aucune session de caisse trouvée</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Ajustez vos filtres de dates ou effectuez des encaissements sur la caisse POS pour générer des sessions.
          </p>
        </div>
      ) : (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 16px' }}>Session & Caissier</th>
                  <th style={{ padding: '12px 12px' }}>Horaires</th>
                  <th style={{ padding: '12px 12px', textAlign: 'right' }}>Fond Initial</th>
                  <th style={{ padding: '12px 12px', textAlign: 'right' }}>CA Encaissé</th>
                  <th style={{ padding: '12px 12px', textAlign: 'right' }}>Espèces Comptées</th>
                  <th style={{ padding: '12px 12px', textAlign: 'right' }}>Écart Caisse</th>
                  <th style={{ padding: '12px 12px', textAlign: 'center' }}>Statut</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => {
                  const ecart = Number(s.ecart_caisse || 0)
                  const isCloturee = s.statut === 'cloturee'
                  const isPrinting = printingId === s.id

                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{s.caissier_nom || 'Caissier Principal'}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>#{s.id.slice(0, 8)}</div>
                      </td>
                      <td style={{ padding: '14px 12px', fontSize: 12, color: '#475569' }}>
                        <div>🟢 {s.date_ouverture ? new Date(s.date_ouverture).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                        <div style={{ color: isCloturee ? '#64748b' : '#C75B00', fontWeight: isCloturee ? 400 : 700 }}>
                          {isCloturee ? `🏁 ${new Date(s.date_cloture!).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : '⚡ En cours'}
                        </div>
                      </td>
                      <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>
                        {fcfa(s.fond_caisse_initial)}
                      </td>
                      <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                        <div style={{ fontWeight: 900, color: '#1e3a8a' }}>{fcfa(s.ventes_total)}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{s.nb_ventes} tickets</div>
                      </td>
                      <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        {isCloturee ? fcfa(s.especes_comptees) : '—'}
                      </td>
                      <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                        {isCloturee ? (
                          <span style={{
                            display: 'inline-block', padding: '3px 8px', borderRadius: 6, fontSize: 11.5, fontWeight: 800,
                            background: ecart === 0 ? '#f0fdf4' : ecart > 0 ? '#eff6ff' : '#fef2f2',
                            color: ecart === 0 ? '#15803d' : ecart > 0 ? '#1d4ed8' : '#dc2626'
                          }}>
                            {ecart >= 0 ? '+' : ''}{fcfa(ecart)}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                          background: isCloturee ? '#f0fdf4' : '#fff7ed',
                          color: isCloturee ? '#15803d' : '#C75B00',
                          border: `1px solid ${isCloturee ? '#bbf7d0' : '#fed7aa'}`
                        }}>
                          {isCloturee ? 'Clôturée Z' : 'En cours'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handlePrintRapportZ(s)}
                            disabled={isPrinting}
                            style={{
                              padding: '6px 10px', borderRadius: 8, background: '#fff7ed', border: '1px solid #fed7aa',
                              color: '#C75B00', fontWeight: 800, fontSize: 11.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                            }}
                            title="Imprimer / Télécharger le Rapport Z en PDF"
                          >
                            {isPrinting ? '⏳' : '🧾'} Rapport Z
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenVentesModal(s)}
                            style={{
                              padding: '6px 10px', borderRadius: 8, background: '#f8fafc', border: '1px solid #cbd5e1',
                              color: '#334155', fontWeight: 700, fontSize: 11.5, cursor: 'pointer'
                            }}
                            title="Voir les tickets de la session"
                          >
                            👁️ Ventes
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExportSessionCSV(s)}
                            style={{
                              padding: '6px 8px', borderRadius: 8, background: '#f1f5f9', border: '1px solid #cbd5e1',
                              color: '#0f172a', fontWeight: 700, fontSize: 11.5, cursor: 'pointer'
                            }}
                            title="Exporter les ventes de cette session en CSV"
                          >
                            📥
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal Détail des Ventes d'une Session ── */}
      {modalSessionVentes && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: 16 }}>
          <div style={{ background: '#ffffff', borderRadius: 20, width: '100%', maxWidth: 720, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            {/* Header Modal */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                  🧾 Ventes de la Session #{modalSessionVentes.session.id.slice(0, 8)}
                </h4>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>
                  Caissier : <strong>{modalSessionVentes.session.caissier_nom}</strong> · {modalSessionVentes.ventes.length} ticket(s) réalisé(s)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalSessionVentes(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, color: '#64748b', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Contenu Modal */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {loadingVentes ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 45, borderRadius: 8 }} />
                  ))}
                </div>
              ) : modalSessionVentes.ventes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: 13.5 }}>
                  Aucune vente enregistrée dans l'intervalle de cette session.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569', fontSize: 11, textTransform: 'uppercase' }}>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Heure</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Référence</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Article</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Qté</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Montant</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Règlement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalSessionVentes.ventes.map((v: any, idx: number) => (
                      <tr key={v.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 10px', color: '#64748b' }}>
                          {v.created_at ? new Date(v.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td style={{ padding: '10px 10px', fontWeight: 700, color: '#0f172a' }}>{v.reference || '—'}</td>
                        <td style={{ padding: '10px 10px' }}>{v.nom_produit || 'Article'}</td>
                        <td style={{ padding: '10px 10px', textAlign: 'center', fontWeight: 600 }}>{v.quantite || 1}</td>
                        <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 800, color: '#1e3a8a' }}>{fcfa(v.montant_total)}</td>
                        <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                          <span style={{ padding: '2px 6px', borderRadius: 6, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', background: '#f1f5f9', color: '#334155' }}>
                            {v.methode_paiement || 'cash'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer Modal */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => handleExportSessionCSV(modalSessionVentes.session)}
                style={{ padding: '8px 14px', borderRadius: 8, background: '#fff', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >
                📊 Exporter en CSV
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => handlePrintRapportZ(modalSessionVentes.session)}
                  style={{ padding: '8px 16px', borderRadius: 8, background: '#C75B00', color: '#fff', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
                >
                  🧾 Imprimer Rapport Z
                </button>
                <button
                  type="button"
                  onClick={() => setModalSessionVentes(null)}
                  style={{ padding: '8px 14px', borderRadius: 8, background: '#e2e8f0', color: '#334155', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


// ── Formulaire vente ──────────────────────────────────────────────────────────

function VenteForm({ boutiqueId, produits, zones, onDone }: { boutiqueId: string; produits: Produit[]; zones: Zone[]; onDone: () => void }) {
  const [modeSelection, setModeSelection] = useState<'catalogue' | 'libre'>('catalogue')
  const [recherche, setRecherche] = useState('')
  const [catFiltre, setCatFiltre] = useState('tous')
  
  const [produitId, setProduitId] = useState('')
  const [nomLibre, setNomLibre] = useState('')
  const [quantite, setQuantite] = useState(1)
  const [prix, setPrix] = useState<number>(0)
  const [zoneId, setZoneId] = useState('')
  const [clientNom, setClientNom] = useState('')
  const [clientTel, setClientTel] = useState('')
  const [paiement, setPaiement] = useState('cash')
  const [fichier, setFichier] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // Scanner EAN
  const [modalScannerEan, setModalScannerEan] = useState(false)
  const [scannerEanStatus, setScannerEanStatus] = useState('Initialisation…')
  const html5ScannerRef = useRef<any>(null)

  // Scanner Nom OCR
  const [modalScannerNom, setModalScannerNom] = useState(false)
  const videoNomRef = useRef<HTMLVideoElement | null>(null)
  const streamNomRef = useRef<MediaStream | null>(null)
  const [ocrDetections, setOcrDetections] = useState<string[]>([])
  const [statusScannerNom, setStatusScannerNom] = useState('')
  const [ocrLoading, setOcrLoading] = useState(false)

  function handleProduit(id: string) {
    setProduitId(id)
    const p = produits.find(p => p.id === id)
    if (p?.nom) setNomLibre(p.nom)
    if (p?.prix) setPrix(p.prix)
    jouerBipEtVibrer('succes')
  }

  // ── Scanner EAN ──
  const demarrerScannerEan = async () => {
    setModalScannerEan(true)
    setScannerEanStatus('📷 Initialisation du scanner EAN…')

    setTimeout(async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
        if (html5ScannerRef.current) {
          try {
            await html5ScannerRef.current.stop()
            html5ScannerRef.current.clear()
          } catch (e) {}
          html5ScannerRef.current = null
        }

        const scanner = new Html5Qrcode('vente-ean-scanner-reader')
        html5ScannerRef.current = scanner

        const config = CONFIG_SCANNER_EAN_PRO(Html5QrcodeSupportedFormats, { fps: 24 })

        const onScanSuccess = (decodedText: string) => {
          const code = decodedText.trim().toLowerCase()
          const prodTrouve = produits.find(
            (p: any) =>
              p.barcode?.trim().toLowerCase() === code ||
              p.sku?.trim().toLowerCase() === code ||
              p.id?.trim().toLowerCase() === code ||
              p.code_barre?.trim().toLowerCase() === code
          )

          if (prodTrouve) {
            handleProduit(prodTrouve.id)
            jouerBipEtVibrer('succes')
            setScannerEanStatus(`✅ Produit trouvé : "${prodTrouve.nom}"`)
            setTimeout(() => arreterScannerEan(), 600)
          } else {
            jouerBipEtVibrer('alerte')
            setScannerEanStatus(`⚠️ Code "${decodedText}" inconnu dans le catalogue.`)
            if (confirm(`Code-barres "${decodedText}" non trouvé. L'ajouter comme article libre ?`)) {
              setProduitId('')
              setNomLibre(`Article EAN-${decodedText}`)
              setModeSelection('libre')
              arreterScannerEan()
            }
          }
        }

        try {
          await scanner.start({ facingMode: 'environment' }, config, onScanSuccess, () => {})
          setScannerEanStatus('📷 Cadrez le code-barres dans le rectangle.')
        } catch (errEnv) {
          try {
            await scanner.start({ facingMode: 'user' }, config, onScanSuccess, () => {})
            setScannerEanStatus('📷 Caméra active ! Placez le code-barres.')
          } catch (errUser) {
            setScannerEanStatus('❌ Impossible d’accéder à la caméra.')
          }
        }
      } catch (err) {
        setScannerEanStatus('❌ Erreur de chargement du module de scan.')
      }
    }, 250)
  }

  const arreterScannerEan = () => {
    if (html5ScannerRef.current) {
      try {
        html5ScannerRef.current.stop()
        html5ScannerRef.current.clear()
      } catch (e) {}
      html5ScannerRef.current = null
    }
    setModalScannerEan(false)
  }

  // ── Scanner Nom OCR ──
  const demarrerScannerNom = async () => {
    setModalScannerNom(true)
    setOcrDetections([])
    setStatusScannerNom('📷 Cadrez le nom sur l’emballage du produit…')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamNomRef.current = stream
      if (videoNomRef.current) {
        videoNomRef.current.srcObject = stream
        await videoNomRef.current.play().catch(() => {})
      }
    } catch (e) {
      setStatusScannerNom('❌ Impossible d’accéder à la caméra.')
    }
  }

  const arreterScannerNom = () => {
    if (streamNomRef.current) {
      streamNomRef.current.getTracks().forEach(t => t.stop())
      streamNomRef.current = null
    }
    setModalScannerNom(false)
  }

  const capturerNomOCR = async () => {
    if (!videoNomRef.current) return
    setOcrLoading(true)
    setStatusScannerNom('🔍 Analyse OCR en cours…')

    const imageBase64 = capturerZoneViseurExacte(videoNomRef.current, {
      boxTopRatio: 0.15,
      boxLeftRatio: 0.05,
      boxWidthRatio: 0.90,
      boxHeightRatio: 0.70
    })

    if (!imageBase64) {
      setOcrLoading(false)
      setStatusScannerNom('❌ Échec de la capture d’image.')
      return
    }

    try {
      const res = await fetch('/api/boutiques/scan-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 })
      })
      const data = await res.json()
      setOcrLoading(false)

      if (data.ok && data.nom) {
        setNomLibre(data.nom)
        if (data.detections && data.detections.length > 0) {
          setOcrDetections(data.detections)
        }
        jouerBipEtVibrer('succes')
        setStatusScannerNom(`✅ Nom capturé : "${data.nom}"`)
        setTimeout(() => arreterScannerNom(), 1000)
      } else {
        jouerBipEtVibrer('alerte')
        setStatusScannerNom(`⚠️ ${data.error || 'Aucun texte lisible détecté.'}`)
      }
    } catch (err) {
      setOcrLoading(false)
      jouerBipEtVibrer('alerte')
      setStatusScannerNom('❌ Erreur de lecture OCR.')
    }
  }

  function submit() {
    if (prix <= 0) {
      setError('Veuillez renseigner un prix unitaire valide (> 0).')
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await declarerVente(boutiqueId, {
        produit_id: produitId || undefined,
        nom_produit: produitId ? undefined : (nomLibre.trim() || 'Produit'),
        quantite, prix_unitaire: prix,
        zone_livraison_id: zoneId || undefined,
        client_nom: clientNom.trim() || undefined,
        client_telephone: clientTel.trim() || undefined,
        methode_paiement: paiement,
      })
      if (res.error) { setError(res.error); return }
      if (fichier && res.id) {
        setUploading(true)
        const form = new FormData()
        form.append('justificatif', fichier)
        await fetch(`/api/compta-proxy/${boutiqueId}/ventes/${res.id}/justificatif`, { method: 'POST', body: form }).catch(() => null)
        setUploading(false)
      }
      onDone()
    })
  }

  const categories = Array.from(new Set(produits.map((p: any) => p.categorie).filter(Boolean))) as string[]
  const qClean = recherche.trim().toLowerCase()
  const prodsFiltres = produits.filter((p: any) => {
    const matchCat = catFiltre === 'tous' || p.categorie === catFiltre
    const matchText = !qClean ||
      p.nom?.toLowerCase().includes(qClean) ||
      p.categorie?.toLowerCase().includes(qClean) ||
      p.barcode?.toLowerCase().includes(qClean) ||
      p.sku?.toLowerCase().includes(qClean)
    return matchCat && matchText
  })

  const { t } = useTranslation()
  const stock = produits.find(p => p.id === produitId)?.stock_quantite

  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
        <p style={{ margin: 0, fontWeight: 900, fontSize: 16, color: '#0f172a' }}>💰 {t('shop.declareSaleBtn')}</p>
        <span style={{ fontSize: 11, background: '#eff6ff', color: '#1d4ed8', padding: '3px 8px', borderRadius: 8, fontWeight: 700 }}>
          {t('shop.transactionSale')}
        </span>
      </div>

      {error && <div style={{ background: '#fef2f2', borderRadius: 8, padding: '8px 12px', color: '#dc2626', fontSize: 13, fontWeight: 700 }}>{error}</div>}

      {/* Onglets de sélection du produit */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6, background: '#e2e8f0', padding: 3, borderRadius: 10, flex: 1 }}>
          <button
            type="button"
            onClick={() => setModeSelection('catalogue')}
            style={{
              flex: 1, padding: '7px 10px', borderRadius: 8, border: 'none',
              background: modeSelection === 'catalogue' ? '#ffffff' : 'transparent',
              fontWeight: modeSelection === 'catalogue' ? 800 : 600,
              color: modeSelection === 'catalogue' ? '#0f172a' : '#64748b',
              fontSize: 12.5, cursor: 'pointer'
            }}
          >
            {t('shop.catalogModeTab')} ({produits.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setModeSelection('libre')
              setProduitId('')
            }}
            style={{
              flex: 1, padding: '7px 10px', borderRadius: 8, border: 'none',
              background: modeSelection === 'libre' ? '#ffffff' : 'transparent',
              fontWeight: modeSelection === 'libre' ? 800 : 600,
              color: modeSelection === 'libre' ? '#0f172a' : '#64748b',
              fontSize: 12.5, cursor: 'pointer'
            }}
          >
            {t('shop.manualModeTab')}
          </button>
        </div>

        <button
          type="button"
          onClick={demarrerScannerEan}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: '#0284c7', color: '#fff', border: 'none',
            padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer'
          }}
        >
          {t('shop.scanEanBtn')}
        </button>
      </div>

      {modeSelection === 'catalogue' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="text"
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder={t('shop.searchProductPrompt')}
            style={{ ...inputStyle, padding: 8, fontSize: 12.5 }}
          />

          {categories.length > 0 && (
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
              <button
                type="button"
                onClick={() => setCatFiltre('tous')}
                style={{
                  padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer',
                  background: catFiltre === 'tous' ? '#0284c7' : '#e2e8f0',
                  color: catFiltre === 'tous' ? '#ffffff' : '#475569'
                }}
              >
                {t('common.all')}
              </button>
              {categories.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCatFiltre(c)}
                  style={{
                    padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer',
                    background: catFiltre === c ? '#0284c7' : '#e2e8f0',
                    color: catFiltre === c ? '#ffffff' : '#475569',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          <div style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, background: '#ffffff', padding: 6, borderRadius: 8, border: '1px solid #cbd5e1' }}>
            {prodsFiltres.length === 0 ? (
              <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: 12 }}>{t('common.noData')}</div>
            ) : (
              prodsFiltres.map((p: any) => {
                const isSelected = produitId === p.id
                return (
                  <div
                    key={p.id}
                    onClick={() => handleProduit(p.id)}
                    style={{
                      padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
                      background: isSelected ? '#e0f2fe' : 'transparent',
                      border: isSelected ? '1px solid #0284c7' : '1px solid transparent',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5
                    }}
                  >
                    <span style={{ fontWeight: isSelected ? 800 : 600, color: isSelected ? '#0369a1' : '#0f172a' }}>
                      {p.nom} {p.stock_quantite !== null ? `(${t('shop.productStock')}: ${p.stock_quantite})` : ''}
                    </span>
                    <span style={{ fontWeight: 800, color: '#0284c7' }}>{fcfa(p.prix)}</span>
                  </div>
                )
              })
            )}
          </div>
          {stock !== null && stock !== undefined && stock <= 3 && (
            <p style={{ fontSize: 11, color: '#b45309', margin: 0 }}>⚠️ {t('shop.lowStockAlert')} : {stock} {t('shop.remainingLabel')}</p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              value={nomLibre}
              onChange={e => setNomLibre(e.target.value)}
              style={{ ...inputStyle, flex: 1, padding: 9 }}
              placeholder="Ex: Réparation téléphone, Robe Wax, Prestation…"
            />
            <button
              type="button"
              onClick={demarrerScannerNom}
              style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {t('shop.scanNameOcrBtn')}
            </button>
          </div>
          {ocrDetections.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {ocrDetections.map((txt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNomLibre(txt)}
                  style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >
                  {txt}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>{t('shop.quantityLabel')}</label>
          <input type="number" min={1} value={quantite} onChange={e => setQuantite(Number(e.target.value))} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>{t('shop.unitPriceLabel')}</label>
          <input type="number" min={0} value={prix} onChange={e => setPrix(Number(e.target.value))} style={inputStyle} />
        </div>
      </div>

      {zones.length > 0 && (
        <div>
          <label style={labelStyle}>{t('shop.deliveryZoneLabel')}</label>
          <select value={zoneId} onChange={e => setZoneId(e.target.value)} style={inputStyle}>
            <option value="">— {t('common.none')} —</option>
            {zones.map(z => <option key={z.id} value={z.id}>{z.nom} — {fcfa(z.prix)}</option>)}
          </select>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>{t('shop.customerFullNameLabel')}</label>
          <input value={clientNom} onChange={e => setClientNom(e.target.value)} style={inputStyle} placeholder={t('common.optional')} />
        </div>
        <div>
          <label style={labelStyle}>{t('shop.customerPhoneLabel')}</label>
          <input value={clientTel} onChange={e => setClientTel(e.target.value)} style={inputStyle} placeholder="77 000 00 00" />
        </div>
      </div>

      <div>
        <label style={labelStyle}>{t('shop.paymentModePrompt')}</label>
        <select value={paiement} onChange={e => setPaiement(e.target.value)} style={inputStyle}>
          <option value="cash">💵 Espèces</option>
          <option value="wave">🌊 Wave</option>
          <option value="orange_money">🍊 Orange Money</option>
          <option value="virement">🏦 Virement</option>
        </select>
      </div>

      {prix > 0 && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', fontSize: 15, fontWeight: 900, color: '#15803d', display: 'flex', justifyContent: 'space-between' }}>
          <span>{t('shop.totalSales')} :</span>
          <span>{fcfa(prix * quantite + (zoneId ? (zones.find(z => z.id === zoneId)?.prix ?? 0) : 0))}</span>
        </div>
      )}

      <div>
        <label style={labelStyle}>{t('shop.attachReceiptLabel')}</label>
        <input
          type="file" accept="image/*,application/pdf"
          onChange={e => setFichier(e.target.files?.[0] ?? null)}
          style={{ fontSize: 13, color: '#374151' }}
        />
        {fichier && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6b7280' }}>📎 {fichier.name}</p>}
      </div>

      <button onClick={submit} disabled={uploading} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 20px', fontWeight: 900, cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 14, opacity: uploading ? 0.7 : 1 }}>
        {uploading ? t('common.loading') : `✓ ${t('shop.saveSaleBtn')}`}
      </button>

      {/* Modal Scanner EAN VenteForm */}
      {modalScannerEan && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>{t('shop.scanBarcodeModalTitle')}</h4>
              <button type="button" onClick={arreterScannerEan} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: '#475569', fontWeight: 600 }}>{scannerEanStatus}</p>
            <div style={{ width: '100%', height: 240, background: '#000', borderRadius: 12, overflow: 'hidden' }}>
              <div id="vente-ean-scanner-reader" style={{ width: '100%', height: '100%' }} />
            </div>
            <button type="button" onClick={arreterScannerEan} style={{ background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: 8, padding: '8px', fontWeight: 800, cursor: 'pointer' }}>
              {t('common.close')}
            </button>
          </div>
        </div>
      )}

      {/* Modal Scanner Nom OCR VenteForm */}
      {modalScannerNom && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>{t('shop.scanProductNameModalTitle')}</h4>
              <button type="button" onClick={arreterScannerNom} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: '#475569', fontWeight: 600 }}>{statusScannerNom}</p>
            <div style={{ width: '100%', height: 240, background: '#000', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
              <video ref={videoNomRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: '20%', left: '7.5%', width: '85%', height: '60%', border: '2px dashed #38bdf8', borderRadius: 8, pointerEvents: 'none' }} />
            </div>
            <button
              type="button"
              disabled={ocrLoading}
              onClick={capturerNomOCR}
              style={{ width: '100%', padding: '10px', background: ocrLoading ? '#94a3b8' : '#0284c7', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 13, cursor: ocrLoading ? 'not-allowed' : 'pointer' }}
            >
              {ocrLoading ? t('common.loading') : t('shop.captureAndExtractNameBtn')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Ventes ────────────────────────────────────────────────────────────────────

function EditVenteModal({ vente, boutiqueId, onClose, onDone }: { vente: Vente; boutiqueId: string; onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation()
  const [nomProduit, setNomProduit] = useState(vente.nom_produit)
  const [quantite, setQuantite] = useState(vente.quantite)
  const [prix, setPrix] = useState(vente.prix_unitaire)
  const [frais, setFrais] = useState(vente.frais_livraison)
  const [clientNom, setClientNom] = useState(vente.client_nom ?? '')
  const [clientTel, setClientTel] = useState('')
  const [paiement, setPaiement] = useState(vente.methode_paiement)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function submit() {
    setError(null)
    startTransition(async () => {
      const res = await updateVente(boutiqueId, vente.id, {
        nom_produit: nomProduit, quantite, prix_unitaire: prix,
        frais_livraison: frais, client_nom: clientNom || undefined,
        client_telephone: clientTel || undefined, methode_paiement: paiement,
      })
      if (res.error) { setError(res.error); return }
      onDone(); onClose()
    })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 14 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 16 }}>{t('shop.editSaleModalTitle')}</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}>✕</button>
        </div>
        {error && <div style={{ background: '#fef2f2', borderRadius: 8, padding: '8px 12px', color: '#dc2626', fontSize: 13 }}>{error}</div>}
        <div>
          <label style={labelStyle}>{t('shop.articleDesignationLabel')}</label>
          <input value={nomProduit} onChange={e => setNomProduit(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>{t('shop.quantityLabel')}</label><input type="number" min={1} value={quantite} onChange={e => setQuantite(Number(e.target.value))} style={inputStyle} /></div>
          <div><label style={labelStyle}>{t('shop.unitPriceLabel')}</label><input type="number" min={0} value={prix} onChange={e => setPrix(Number(e.target.value))} style={inputStyle} /></div>
        </div>
        <div>
          <label style={labelStyle}>{t('shop.deliveryFeeLabel')}</label>
          <input type="number" min={0} value={frais} onChange={e => setFrais(Number(e.target.value))} style={inputStyle} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>{t('shop.customerFullNameLabel')}</label><input value={clientNom} onChange={e => setClientNom(e.target.value)} style={inputStyle} placeholder={t('common.optional')} /></div>
          <div><label style={labelStyle}>{t('shop.customerPhoneLabel')}</label><input value={clientTel} onChange={e => setClientTel(e.target.value)} style={inputStyle} placeholder={t('common.optional')} /></div>
        </div>
        <div>
          <label style={labelStyle}>{t('shop.paymentModePrompt')}</label>
          <select value={paiement} onChange={e => setPaiement(e.target.value)} style={inputStyle}>
            <option value="cash">Espèces</option>
            <option value="wave">Wave</option>
            <option value="orange_money">Orange Money</option>
            <option value="virement">Virement</option>
          </select>
        </div>
        <div style={{ background: '#eff6ff', borderRadius: 8, padding: '10px 14px', fontSize: 14, fontWeight: 700, color: '#1d4ed8' }}>
          {t('shop.newTotalLabel')} : {fcfa(prix * quantite + frais)}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={submit} style={{ flex: 1, background: '#C75B00', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>{t('common.save')}</button>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 16px', cursor: 'pointer' }}>{t('common.cancel')}</button>
        </div>
      </div>
    </div>
  )
}

function VentesView({ boutiqueId }: { boutiqueId: string }) {
  const { t } = useTranslation()
  const [ventes, setVentes] = useState<Vente[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [produits, setProduits] = useState<Produit[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editingVente, setEditingVente] = useState<Vente | null>(null)
  const [, startTransition] = useTransition()
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  async function load() {
    const cacheKeyV = `nopalou_offline_compta_ventes_${boutiqueId}`
    const cacheKeyZ = `nopalou_offline_compta_zones_${boutiqueId}`
    const cachedV = localStorage.getItem(cacheKeyV)
    const cachedZ = localStorage.getItem(cacheKeyZ)

    if (cachedV) { try { setVentes(JSON.parse(cachedV)) } catch(e) {} }
    if (cachedZ) { try { setZones(JSON.parse(cachedZ)) } catch(e) {} }

    try {
      const [v, z, p] = await Promise.all([
        listVentes(boutiqueId),
        listZones(boutiqueId),
        getBoutiqueProduits(boutiqueId),
      ])
      if (Array.isArray(v)) { setVentes(v); localStorage.setItem(cacheKeyV, JSON.stringify(v)) }
      if (Array.isArray(z)) { setZones(z); localStorage.setItem(cacheKeyZ, JSON.stringify(z)) }
      if (Array.isArray(p)) setProduits(p)
    } catch (err) {
      console.warn(`📊 [Comptabilité] Mode hors-ligne : utilisation du cache local ventes/zones (${cachedV ? 'disponible' : 'vide'}).`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [boutiqueId])

  function removeVente(id: string) {
    if (!confirm(t('common.confirmDelete') || 'Supprimer cette vente ? Elle ne sera plus comptabilisée.')) return
    setDeleting(id)
    startTransition(async () => {
      await deleteVente(boutiqueId, id)
      setDeleting(null)
      load()
    })
  }

  const methodeLabel: Record<string, string> = { cash: 'Espèces', wave: 'Wave', orange_money: 'Orange Money', virement: 'Virement' }

  function exportVentesCSV() {
    const headers = ['Référence', 'Produit/Service', 'Quantité', 'Prix Unitaire (FCFA)', 'Livraison (FCFA)', 'Total (FCFA)', 'Client', 'Mode Paiement', 'Date']
    const rows = ventes.map(v => [
      v.reference || v.id.slice(0, 8),
      v.nom_produit,
      v.quantite,
      v.prix_unitaire,
      v.frais_livraison,
      v.montant_total,
      v.client_nom || 'Client Anonyme',
      methodeLabel[v.methode_paiement] || v.methode_paiement,
      fmtDateHeure(v.created_at)
    ])
    exportToCSV(`ventes_boutique_${boutiqueId}`, headers, rows)
  }

  function exportVentesPDF() {
    const headers = ['Réf.', 'Produit', 'Qte', 'Prix Unit.', 'Total', 'Client', 'Date']
    const rows = ventes.map(v => [
      v.reference || v.id.slice(0, 8),
      v.nom_produit,
      v.quantite,
      `${v.prix_unitaire.toLocaleString('fr-FR')} FCFA`,
      `${v.montant_total.toLocaleString('fr-FR')} FCFA`,
      v.client_nom || 'Client Anonyme',
      fmtDateHeure(v.created_at)
    ])
    const totalCA = ventes.reduce((s, v) => s + Number(v.montant_total), 0)
    const summaryHtml = `
      <div class="summary">
        <h3 style="margin:0 0 6px;">Bilan des Ventes</h3>
        <p style="margin:0; font-size:14px; font-weight:bold; color:#16a34a;">Total Ventes Enregistrées : ${totalCA.toLocaleString('fr-FR')} FCFA (${ventes.length} transactions)</p>
      </div>
    `
    printPDFReport('Registre & Bilan des Ventes', `Boutique ${boutiqueId}`, headers, rows, summaryHtml)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {editingVente && <EditVenteModal vente={editingVente} boutiqueId={boutiqueId} onClose={() => setEditingVente(null)} onDone={load} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{ventes.length} {t('shop.totalSales').toLowerCase()}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={exportVentesCSV} style={{ fontSize: 12, color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '5px 12px', fontWeight: 700, cursor: 'pointer' }}>
            📥 {t('common.exportCsv')}
          </button>
          <button onClick={exportVentesPDF} style={{ fontSize: 12, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '5px 12px', fontWeight: 700, cursor: 'pointer' }}>
            📄 {t('common.exportPdf')}
          </button>
          <button onClick={() => setShowForm(!showForm)} style={{ fontSize: 13, background: '#C75B00', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 700, cursor: 'pointer' }}>
            + {t('shop.declareSaleBtn')}
          </button>
        </div>
      </div>

      {showForm && (
        <VenteForm boutiqueId={boutiqueId} produits={produits} zones={zones} onDone={() => { setShowForm(false); load() }} />
      )}

      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: 14 }}>{t('common.loading')}</p>
      ) : ventes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 20px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #d1d5db', color: '#9ca3af', fontSize: 14 }}>
          {t('shop.noSalesRegistered')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ventes.map(v => (
            <div key={v.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{v.nom_produit}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>
                  {v.quantite} × {fcfa(v.prix_unitaire)}
                  {v.frais_livraison > 0 ? ` + ${fcfa(v.frais_livraison)} livraison` : ''}
                  {v.client_nom ? ` · ${v.client_nom}` : ''}
                  {' · '}{methodeLabel[v.methode_paiement] ?? v.methode_paiement}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>
                  {fmtDate(v.created_at)} · Réf {v.reference}
                </p>
                {v.justificatif_url && (
                  <a href={v.justificatif_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#1d4ed8', textDecoration: 'none' }}>
                    📎 {t('shop.attachReceiptLabel')} ↗
                  </a>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: '#1d4ed8' }}>{fcfa(v.montant_total)}</p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <a href={`/boutique/ventes/facture/${boutiqueId}/${v.id}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#6b7280' }}>
                    PDF ↗
                  </a>
                  <button
                    onClick={() => setEditingVente(v)}
                    style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', borderRadius: 6, padding: '3px 7px', cursor: 'pointer', fontSize: 11 }}
                  >✎</button>
                  <button
                    onClick={() => removeVente(v.id)}
                    disabled={deleting === v.id}
                    style={{ background: 'none', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '3px 7px', cursor: 'pointer', fontSize: 11, opacity: deleting === v.id ? 0.5 : 1 }}
                    title="Archiver"
                  >✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Dépenses ──────────────────────────────────────────────────────────────────

function DepenseCard({ depense: d, boutiqueId, onDelete, onUpdated }: {
  depense: Depense; boutiqueId: string; onDelete: (id: string) => void; onUpdated: () => void
}) {
  const { t } = useTranslation()
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [eMontant, setEMontant] = useState(String(d.montant))
  const [eCategorie, setECategorie] = useState(d.categorie)
  const [eDesc, setEDesc] = useState(d.description ?? '')
  const [eDate, setEDate] = useState(d.date_depense.slice(0, 10))
  const [eError, setEError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const fileRef = { current: null as HTMLInputElement | null }

  function saveEdit() {
    if (!eMontant || Number(eMontant) <= 0) { setEError(t('errors.invalidAmount') || 'Montant invalide'); return }
    setEError(null)
    startTransition(async () => {
      const res = await updateDepense(boutiqueId, d.id, {
        montant: Number(eMontant), categorie: eCategorie,
        description: eDesc || undefined, date_depense: eDate,
      })
      if (res.error) { setEError(res.error); return }
      setEditing(false); onUpdated()
    })
  }

  async function uploadJustificatif(file: File) {
    setUploading(true)
    try {
      const form = new FormData()
      form.append('justificatif', file)
      const res = await fetch(`/api/compta-proxy/${boutiqueId}/depenses/${d.id}/justificatif`, {
        method: 'POST', body: form,
      })
      if (res.ok) onUpdated()
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 16px' }}>
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {eError && <div style={{ background: '#fef2f2', borderRadius: 6, padding: '6px 10px', color: '#dc2626', fontSize: 12 }}>{eError}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={labelStyle}>{t('shop.expenseAmountLabel')}</label><input type="number" min={1} value={eMontant} onChange={e => setEMontant(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>{t('common.date') || 'Date'}</label><input type="date" value={eDate} onChange={e => setEDate(e.target.value)} style={inputStyle} /></div>
          </div>
          <div><label style={labelStyle}>{t('shop.productCategory')}</label>
            <select value={eCategorie} onChange={e => setECategorie(e.target.value)} style={inputStyle}>
              {CAT_DEPENSES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>{t('shop.descriptionLabel')}</label><input value={eDesc} onChange={e => setEDesc(e.target.value)} style={inputStyle} placeholder={t('common.optional')} /></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveEdit} style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>{t('common.save')}</button>
            <button onClick={() => setEditing(false)} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: 7, padding: '8px 12px', cursor: 'pointer', fontSize: 13 }}>{t('common.cancel')}</button>
          </div>
        </div>
      ) : (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#475569' }}>
              {d.categorie}
            </span>
            {d.description && <span style={{ fontSize: 13, color: '#374151' }}>{d.description}</span>}
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9ca3af' }}>{fmtDate(d.date_depense)}</p>
          {/* Justificatif */}
          <div style={{ marginTop: 6 }}>
            {d.justificatif_url ? (
              <a href={d.justificatif_url} target="_blank" rel="noreferrer"
                style={{ fontSize: 11, color: '#1d4ed8', textDecoration: 'none' }}>
                📎 {t('shop.attachReceiptLabel')} ↗
              </a>
            ) : (
              <>
                <input
                  ref={el => { fileRef.current = el }}
                  type="file" accept="image/*,application/pdf"
                  style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadJustificatif(f) }}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  style={{ fontSize: 11, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  {uploading ? t('common.loading') : `+ ${t('shop.attachReceiptLabel')}`}
                </button>
              </>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#dc2626' }}>{fcfa(d.montant)}</span>
          <button onClick={() => setEditing(true)} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', borderRadius: 6, padding: '4px 7px', cursor: 'pointer', fontSize: 12 }} title={t('common.edit')}>✎</button>
          <button onClick={() => onDelete(d.id)} style={{ background: 'none', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }} title={t('common.delete')}>✕</button>
        </div>
      </div>
      )}
    </div>
  )
}

function DepensesView({ boutiqueId }: { boutiqueId: string }) {
  const { t } = useTranslation()
  const [depenses, setDepenses] = useState<Depense[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [montant, setMontant] = useState('')
  const [categorie, setCategorie] = useState('stock')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [fichier, setFichier] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // Scanner OCR Reçu / Dépense
  const [modalScannerTicket, setModalScannerTicket] = useState(false)
  const videoTicketRef = useRef<HTMLVideoElement | null>(null)
  const streamTicketRef = useRef<MediaStream | null>(null)
  const [ocrDetectionsTicket, setOcrDetectionsTicket] = useState<string[]>([])
  const [statusScannerTicket, setStatusScannerTicket] = useState('')
  const [ocrLoadingTicket, setOcrLoadingTicket] = useState(false)

  const demarrerScannerTicket = async () => {
    setModalScannerTicket(true)
    setOcrDetectionsTicket([])
    setStatusScannerTicket('📷 Cadrez le ticket ou la facturette…')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamTicketRef.current = stream
      if (videoTicketRef.current) {
        videoTicketRef.current.srcObject = stream
        await videoTicketRef.current.play().catch(() => {})
      }
    } catch (e) {
      setStatusScannerTicket('❌ Impossible d’accéder à la caméra.')
    }
  }

  const arreterScannerTicket = () => {
    if (streamTicketRef.current) {
      streamTicketRef.current.getTracks().forEach(t => t.stop())
      streamTicketRef.current = null
    }
    setModalScannerTicket(false)
  }

  const capturerTicketOCR = async () => {
    if (!videoTicketRef.current) return
    setOcrLoadingTicket(true)
    setStatusScannerTicket('🔍 Lecture OCR du ticket / facturette…')

    const imageBase64 = capturerZoneViseurExacte(videoTicketRef.current, {
      boxTopRatio: 0.15,
      boxLeftRatio: 0.05,
      boxWidthRatio: 0.90,
      boxHeightRatio: 0.70
    })

    if (!imageBase64) {
      setOcrLoadingTicket(false)
      setStatusScannerTicket('❌ Échec de la capture d’image.')
      return
    }

    try {
      const res = await fetch('/api/boutiques/scan-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 })
      })
      const data = await res.json()
      setOcrLoadingTicket(false)

      if (data.ok && data.nom) {
        setDescription(data.nom)
        if (data.detections && data.detections.length > 0) {
          setOcrDetectionsTicket(data.detections)
        }
        jouerBipEtVibrer('succes')
        setStatusScannerTicket(`✅ Texte extrait : "${data.nom}"`)
        setTimeout(() => arreterScannerTicket(), 1000)
      } else {
        jouerBipEtVibrer('alerte')
        setStatusScannerTicket(`⚠️ ${data.error || 'Aucun texte lisible détecté.'}`)
      }
    } catch (err) {
      setOcrLoadingTicket(false)
      jouerBipEtVibrer('alerte')
      setStatusScannerTicket('❌ Erreur de lecture OCR.')
    }
  }

  async function load() {
    const cacheKey = `nopalou_offline_compta_depenses_${boutiqueId}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) { try { setDepenses(JSON.parse(cached)) } catch(e) {} }

    try {
      const d = await listDepenses(boutiqueId)
      if (Array.isArray(d)) {
        setDepenses(d)
        localStorage.setItem(cacheKey, JSON.stringify(d))
      }
    } catch (err) {
      console.warn(`📊 [Comptabilité] Mode hors-ligne : utilisation du cache local dépenses (${cached ? 'disponible' : 'vide'}).`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [boutiqueId])

  function submit() {
    if (!montant || Number(montant) <= 0) { setError(t('errors.invalidAmount') || 'Montant invalide'); return }
    setError(null)
    startTransition(async () => {
      const res = await addDepense(boutiqueId, { montant: Number(montant), categorie, description: description || undefined, date_depense: date })
      if (res.error) { setError(res.error); return }
      if (fichier && res.id) {
        setUploading(true)
        const form = new FormData()
        form.append('justificatif', fichier)
        await fetch(`/api/compta-proxy/${boutiqueId}/depenses/${res.id}/justificatif`, { method: 'POST', body: form }).catch(() => null)
        setUploading(false)
      }
      setMontant(''); setDescription(''); setFichier(null); setShowForm(false)
      load()
    })
  }

  function remove(id: string) {
    if (!confirm(t('common.confirmDelete') || 'Supprimer cette dépense ?')) return
    startTransition(async () => { await deleteDepense(boutiqueId, id); load() })
  }

  const total = depenses.reduce((s, d) => s + Number(d.montant), 0)
  const now = new Date(); const mois = `${MOIS_NOMS[now.getMonth()]} ${now.getFullYear()}`

  function exportDepensesCSV() {
    const headers = ['Date', 'Catégorie', 'Description', 'Montant (FCFA)']
    const rows = depenses.map(d => [
      d.date_depense,
      d.categorie.toUpperCase(),
      d.description || '—',
      d.montant
    ])
    exportToCSV(`depenses_boutique_${boutiqueId}`, headers, rows)
  }

  function exportDepensesPDF() {
    const headers = ['Date', 'Catégorie', 'Description', 'Montant']
    const rows = depenses.map(d => [
      d.date_depense,
      d.categorie.toUpperCase(),
      d.description || '—',
      `${Number(d.montant).toLocaleString('fr-FR')} FCFA`
    ])
    const summaryHtml = `
      <div class="summary">
        <h3 style="margin:0 0 6px;">Registre des Dépenses</h3>
        <p style="margin:0; font-size:14px; font-weight:bold; color:#dc2626;">Total Dépenses : ${total.toLocaleString('fr-FR')} FCFA (${depenses.length} entrées)</p>
      </div>
    `
    printPDFReport('Registre des Dépenses', `Boutique ${boutiqueId}`, headers, rows, summaryHtml)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{t('shop.expenses')} : <strong style={{ color: '#dc2626' }}>{fcfa(total)}</strong></p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={exportDepensesCSV} style={{ fontSize: 12, color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '5px 12px', fontWeight: 700, cursor: 'pointer' }}>
            📥 {t('common.exportCsv')}
          </button>
          <button onClick={exportDepensesPDF} style={{ fontSize: 12, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '5px 12px', fontWeight: 700, cursor: 'pointer' }}>
            📄 {t('common.exportPdf')}
          </button>
          <button onClick={() => setShowForm(!showForm)} style={{ fontSize: 13, background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 700, cursor: 'pointer' }}>
            + {t('shop.declareExpenseBtn')}
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {error && <div style={{ background: '#fef2f2', borderRadius: 8, padding: '8px 12px', color: '#dc2626', fontSize: 13 }}>{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>{t('shop.expenseAmountLabel')}</label>
              <input type="number" min={1} value={montant} onChange={e => setMontant(e.target.value)} style={inputStyle} placeholder="Ex: 25000" />
            </div>
            <div>
              <label style={labelStyle}>{t('common.date') || 'Date'}</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>{t('shop.productCategory')}</label>
            <select value={categorie} onChange={e => setCategorie(e.target.value)} style={inputStyle}>
              {CAT_DEPENSES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label style={{ ...labelStyle, margin: 0 }}>{t('shop.expenseReasonLabel')}</label>
              <button
                type="button"
                onClick={demarrerScannerTicket}
                style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {t('shop.scanReceiptOcrBtn')}
              </button>
            </div>
            <input value={description} onChange={e => setDescription(e.target.value)} style={inputStyle} placeholder="Ex: Achat stock riz, Livraison DHL…" />
            {ocrDetectionsTicket.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                {ocrDetectionsTicket.map((txt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setDescription(txt)}
                    style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    {txt}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label style={labelStyle}>{t('shop.attachReceiptLabel')}</label>
            <input
              type="file" accept="image/*,application/pdf"
              onChange={e => setFichier(e.target.files?.[0] ?? null)}
              style={{ fontSize: 13, color: '#374151' }}
            />
            {fichier && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6b7280' }}>📎 {fichier.name}</p>}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={submit} disabled={uploading} style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 13, opacity: uploading ? 0.7 : 1 }}>
              {uploading ? t('common.loading') : t('common.save')}
            </button>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 13 }}>
              {t('common.cancel')}
            </button>
          </div>

          {/* Modal Scanner Ticket OCR */}
          {modalScannerTicket && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: 16 }}>
              <div style={{ background: '#fff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>{t('shop.scanReceiptOcrBtn')}</h4>
                  <button type="button" onClick={arreterScannerTicket} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: '#475569', fontWeight: 600 }}>{statusScannerTicket}</p>
                <div style={{ width: '100%', height: 240, background: '#000', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
                  <video ref={videoTicketRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: '15%', left: '5%', width: '90%', height: '70%', border: '2px dashed #38bdf8', borderRadius: 8, pointerEvents: 'none' }} />
                </div>
                <button
                  type="button"
                  disabled={ocrLoadingTicket}
                  onClick={capturerTicketOCR}
                  style={{ width: '100%', padding: '10px', background: ocrLoadingTicket ? '#94a3b8' : '#0284c7', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 13, cursor: ocrLoadingTicket ? 'not-allowed' : 'pointer' }}
                >
                  {ocrLoadingTicket ? t('common.loading') : t('shop.captureAndExtractNameBtn')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: 14 }}>{t('common.loading')}</p>
      ) : depenses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 20px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #d1d5db', color: '#9ca3af', fontSize: 14 }}>
          {t('shop.noExpensesRegistered')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {depenses.map(d => (
            <DepenseCard key={d.id} depense={d} boutiqueId={boutiqueId} onDelete={remove} onUpdated={load} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Stock ─────────────────────────────────────────────────────────────────────

export function StockView({ boutiqueId }: { boutiqueId: string }) {
  const { t } = useTranslation()
  const [produits, setProduits] = useState<Produit[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [stockVal, setStockVal] = useState<Record<string, string>>({})
  const [, startTransition] = useTransition()
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  async function load() {
    setLoading(true)
    try {
      const prods = await getBoutiqueProduits(boutiqueId)
      if (prods && prods.length > 0) {
        setProduits(prods)
      } else {
        // Fallback si vide + potentiellement hors ligne
        const cache = localStorage.getItem(`nopalou_pos_produits_${boutiqueId}`)
        if (cache) {
          try {
            const parsed = JSON.parse(cache)
            if (Array.isArray(parsed)) setProduits(parsed)
          } catch {}
        }
      }
    } catch (e) {
      console.warn("StockView offline fallback", e)
      const cache = localStorage.getItem(`nopalou_pos_produits_${boutiqueId}`)
      if (cache) {
        try {
          const parsed = JSON.parse(cache)
          if (Array.isArray(parsed)) setProduits(parsed)
        } catch {}
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [boutiqueId])

  function saveStock(produitId: string) {
    const val = stockVal[produitId]
    if (val === undefined || val === '') return
    startTransition(async () => {
      await updateStock(boutiqueId, produitId, Number(val))
      setEditing(null)
      load()
    })
  }

  function exportStockCSV() {
    const headers = ['ID Produit', 'Nom Produit', 'Prix (FCFA)', 'Quantité en Stock', 'Statut Stock']
    const rows = produits.map(p => [
      p.id,
      p.nom,
      p.prix || 0,
      (p.quantite_stock ?? p.stock_quantite) ?? 'Non suivi',
      (p.quantite_stock ?? p.stock_quantite) === null ? 'Non suivi' : (p.quantite_stock ?? p.stock_quantite)! <= 3 ? 'STOCK BAS' : 'DISPONIBLE'
    ])
    exportToCSV(`inventaire_stock_${boutiqueId}`, headers, rows)
  }

  function exportStockPDF() {
    const headers = ['ID', 'Nom Produit', 'Prix', 'Stock Restant', 'Statut']
    const rows = produits.map(p => [
      p.id.slice(0, 8),
      p.nom,
      p.prix ? `${p.prix.toLocaleString('fr-FR')} FCFA` : '—',
      (p.quantite_stock ?? p.stock_quantite) ?? 'Non suivi',
      (p.quantite_stock ?? p.stock_quantite) === null ? 'Non suivi' : (p.quantite_stock ?? p.stock_quantite)! <= 3 ? '⚠️ BAS' : '✅ OK'
    ])
    printPDFReport('Inventaire État des Stocks', `Boutique ${boutiqueId}`, headers, rows)
  }

  if (loading) return <p style={{ color: '#9ca3af', fontSize: 14 }}>{t('common.loading')}</p>

  if (produits.length === 0) return (
    <div style={{ textAlign: 'center', padding: '32px 20px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #d1d5db', color: '#9ca3af', fontSize: 14 }}>
      {t('shop.noProductsInInventory')}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{t('shop.inventoryRefTitle')} ({produits.length} {t('shop.catalog').toLowerCase()})</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportStockCSV} style={{ fontSize: 12, color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '5px 12px', fontWeight: 700, cursor: 'pointer' }}>
            📥 {t('common.exportCsv')}
          </button>
          <button onClick={exportStockPDF} style={{ fontSize: 12, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '5px 12px', fontWeight: 700, cursor: 'pointer' }}>
            📄 {t('common.exportPdf')}
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {produits.map(p => (
        <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ margin: 0, fontSize: 14, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nom}</h4>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>ID: {p.id.slice(0, 8)}</p>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
              {p.prix ? `${p.prix.toLocaleString('fr-FR')} FCFA` : '—'}
            </div>
          </div>
          {editing === p.id ? (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="number"
                value={stockVal[p.id] ?? ((p.quantite_stock ?? p.stock_quantite) ?? '')}
                onChange={e => setStockVal(prev => ({ ...prev, [p.id]: e.target.value }))}
                style={{ ...inputStyle, width: 80 }}
                autoFocus
              />
              <button onClick={() => saveStock(p.id)} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>✓</button>
              <button onClick={() => setEditing(null)} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}>✕</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{
                fontSize: 13, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: (p.quantite_stock ?? p.stock_quantite) === null ? '#f1f5f9' : (p.quantite_stock ?? p.stock_quantite)! <= 3 ? '#fef2f2' : '#dcfce7',
                color: (p.quantite_stock ?? p.stock_quantite) === null ? '#9ca3af' : (p.quantite_stock ?? p.stock_quantite)! <= 3 ? '#dc2626' : '#16a34a',
              }}>
                {(p.quantite_stock ?? p.stock_quantite) === null ? t('shop.notTrackedBadge') : `${(p.quantite_stock ?? p.stock_quantite)} ${t('shop.inStockLabel')}`}
              </span>
              <button onClick={() => { setEditing(p.id); setStockVal(prev => ({ ...prev, [p.id]: String((p.quantite_stock ?? p.stock_quantite) ?? '') })) }}
                style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12 }}>
                {t('common.edit')}
              </button>
            </div>
          )}
        </div>
      ))}
      </div>
    </div>
  )
}

// ── Saisie Express ───────────────────────────────────────────────────────────

export function SaisieExpressView({ boutiqueId }: { boutiqueId: string }) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'vente' | 'depense'>('vente')
  const [produits, setProduits] = useState<Produit[]>([])
  
  // Modes d'ajout Vente Express
  const [modeSaisie, setModeSaisie] = useState<'catalogue' | 'libre'>('catalogue')
  const [rechercheProduit, setRechercheProduit] = useState('')
  const [categorieFiltre, setCategorieFiltre] = useState('tous')

  // Panier Mixte Vente Express
  const [panierProduits, setPanierProduits] = useState<Record<string, number>>({}) // produitId -> qte
  const [itemsCustomPanier, setItemsCustomPanier] = useState<Array<{ id: string; nom: string; prix: number; quantite: number }>>([])

  // Saisie Libre
  const [libelleCustomInput, setLibelleCustomInput] = useState('')
  const [prixCustomInput, setPrixCustomInput] = useState('')
  const [qteCustomInput, setQteCustomInput] = useState(1)

  // Paramètres Vente
  const [methodePaiement, setMethodePaiement] = useState('especes')
  const [clientNom, setClientNom] = useState('')
  
  // Dépense
  const [montantDepense, setMontantDepense] = useState('')
  const [catDepense, setCatDepense] = useState('stock')
  const [descDepense, setDescDepense] = useState('')

  const [loading, setLoading] = useState(false)
  const [msgSuccess, setMsgSuccess] = useState('')

  // Scanner EAN Caméra
  const [modalScannerEan, setModalScannerEan] = useState(false)
  const [scannerEanStatus, setScannerEanStatus] = useState('Initialisation du scanner EAN…')
  const [scanContinu, setScanContinu] = useState(true)
  const html5ScannerRef = useRef<any>(null)

  // Scanner Nom OCR Caméra
  const [modalScannerNom, setModalScannerNom] = useState(false)
  const videoNomRef = useRef<HTMLVideoElement | null>(null)
  const streamNomRef = useRef<MediaStream | null>(null)
  const [ocrDetections, setOcrDetections] = useState<string[]>([])
  const [statusScannerNom, setStatusScannerNom] = useState('')
  const [ocrLoading, setOcrLoading] = useState(false)

  useEffect(() => {
    getBoutiqueProduits(boutiqueId).then(p => setProduits(p || [])).catch(() => {})
  }, [boutiqueId])

  const [imageFligeeComptaNom, setImageFligeeComptaNom] = useState<string | null>(null)
  const dernierScanComptaRef = useRef<{ code: string; time: number }>({ code: '', time: 0 })

  // ── Actions Panier Catalogue ──────────────────────────────────────────────
  const handleAjouterProduitCatalogue = (p: any, delta = 1) => {
    setPanierProduits(prev => {
      const current = prev[p.id] || 0
      const next = current + delta
      const copy = { ...prev }
      if (next <= 0) {
        delete copy[p.id]
      } else {
        copy[p.id] = next
      }
      return copy
    })
    jouerBipEtVibrer('succes')
  }

  // ── Actions Panier Saisie Libre ───────────────────────────────────────────
  const handleAjouterItemLibre = () => {
    const libelle = libelleCustomInput.trim()
    const prix = Number(prixCustomInput)
    const qte = Number(qteCustomInput) || 1

    if (!libelle) {
      alert('Veuillez saisir le nom ou libellé de l’article.')
      return
    }
    if (isNaN(prix) || prix <= 0) {
      alert('Veuillez saisir un prix unitaire valide (> 0).')
      return
    }

    setItemsCustomPanier(prev => [
      ...prev,
      {
        id: 'custom_' + Date.now(),
        nom: libelle,
        prix: prix,
        quantite: qte
      }
    ])

    jouerBipEtVibrer('succes')
    setLibelleCustomInput('')
    setPrixCustomInput('')
    setQteCustomInput(1)
  }

  const handleViderPanier = () => {
    if (Object.keys(panierProduits).length === 0 && itemsCustomPanier.length === 0) return
    if (confirm(t('shop.confirmEmptyCart') || 'Voulez-vous vider tous les articles de cette vente ?')) {
      setPanierProduits({})
      setItemsCustomPanier([])
    }
  }

  // ── Scanner EAN Caméra ───────────────────────────────────────────────────
  const demarrerScannerEan = async () => {
    setModalScannerEan(true)
    setScannerEanStatus('📷 Scanner EAN prêt (Mode Continu)…')
    dernierScanComptaRef.current = { code: '', time: 0 }

    setTimeout(async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
        if (html5ScannerRef.current) {
          try {
            await html5ScannerRef.current.stop()
            html5ScannerRef.current.clear()
          } catch (e) {}
          html5ScannerRef.current = null
        }

        const container = document.getElementById('compta-ean-scanner-reader')
        if (!container) return

        const scanner = new Html5Qrcode('compta-ean-scanner-reader')
        html5ScannerRef.current = scanner

        const config = CONFIG_SCANNER_EAN_PRO(Html5QrcodeSupportedFormats, { fps: 24 })

        const onScanSuccess = (decodedText: string) => {
          const code = decodedText.trim().toLowerCase()
          const now = Date.now()

          // Anti-rebond intelligent en mode continu : 1.2s
          if (scanContinu && dernierScanComptaRef.current.code === code && (now - dernierScanComptaRef.current.time < 1200)) {
            return
          }
          dernierScanComptaRef.current = { code, time: now }

          const prodTrouve = produits.find(
            (p: any) =>
              p.barcode?.trim().toLowerCase() === code ||
              p.sku?.trim().toLowerCase() === code ||
              p.id?.trim().toLowerCase() === code ||
              p.code_barre?.trim().toLowerCase() === code
          )

          if (prodTrouve) {
            handleAjouterProduitCatalogue(prodTrouve, 1)
            jouerBipEtVibrer('succes')
            setScannerEanStatus(`✅ +1 "${prodTrouve.nom}" (${fcfa(prodTrouve.prix_promo || prodTrouve.prix || 0)})`)
            if (!scanContinu) {
              setTimeout(() => arreterScannerEan(), 600)
            }
          } else {
            jouerBipEtVibrer('alerte')
            setScannerEanStatus(`⚠️ Code "${decodedText}" inconnu dans le catalogue.`)
            if (confirm(`Code-barres "${decodedText}" non trouvé. L'ajouter comme article libre ?`)) {
              setLibelleCustomInput(`Article EAN-${decodedText}`)
              setModeSaisie('libre')
              arreterScannerEan()
            }
          }
        }

        try {
          await scanner.start({ facingMode: 'environment' }, config, onScanSuccess, () => {})
          setScannerEanStatus('📷 Caméra active ! Placez le code-barres dans le cadre.')
        } catch (errEnv) {
          try {
            await scanner.start({ facingMode: 'user' }, config, onScanSuccess, () => {}).catch(() => {})
            setScannerEanStatus('📷 Caméra active ! Placez le code-barres dans le cadre.')
          } catch (errUser) {
            setScannerEanStatus('❌ Impossible d’accéder à la caméra.')
          }
        }
      } catch (err) {
        setScannerEanStatus('❌ Impossible d’accéder à la caméra.')
      }
    }, 200)
  }

  const arreterScannerEan = () => {
    if (html5ScannerRef.current) {
      try {
        html5ScannerRef.current.stop()
        html5ScannerRef.current.clear()
      } catch (e) {}
      html5ScannerRef.current = null
    }
    setModalScannerEan(false)
  }

  // ── Scanner Nom OCR Caméra ───────────────────────────────────────────────
  const demarrerScannerNom = async () => {
    setModalScannerNom(true)
    setOcrDetections([])
    setImageFligeeComptaNom(null)
    setStatusScannerNom('📷 Cadrez le nom sur l’emballage du produit…')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      })
      streamNomRef.current = stream
      if (videoNomRef.current) {
        videoNomRef.current.srcObject = stream
        await videoNomRef.current.play().catch(() => {})
      }
    } catch (e) {
      setStatusScannerNom('❌ Impossible d’accéder à la caméra.')
    }
  }

  const arreterScannerNom = () => {
    setImageFligeeComptaNom(null)
    if (streamNomRef.current) {
      streamNomRef.current.getTracks().forEach(t => t.stop())
      streamNomRef.current = null
    }
    setModalScannerNom(false)
  }

  const capturerNomOCR = async () => {
    if (!videoNomRef.current) return
    setOcrLoading(true)
    setStatusScannerNom('🔍 Analyse OCR en cours…')

    const imageBase64 = capturerZoneViseurExacte(videoNomRef.current, {
      boxTopRatio: 0.15,
      boxLeftRatio: 0.05,
      boxWidthRatio: 0.90,
      boxHeightRatio: 0.70
    })

    if (!imageBase64) {
      setOcrLoading(false)
      setStatusScannerNom('❌ Échec de la capture d’image.')
      return
    }

    // Freeze frame
    setImageFligeeComptaNom(imageBase64)

    try {
      const res = await fetch('/api/boutiques/scan-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 })
      })
      const data = await res.json()
      setOcrLoading(false)

      if (data.ok && data.nom) {
        setLibelleCustomInput(data.nom)
        if (data.detections && data.detections.length > 0) {
          setOcrDetections(data.detections)
        }
        jouerBipEtVibrer('succes')
        setStatusScannerNom(`✅ Nom capturé : "${data.nom}"`)
      } else {
        jouerBipEtVibrer('alerte')
        setStatusScannerNom(`⚠️ ${data.error || 'Aucun texte lisible détecté. Réessayez.'}`)
      }
    } catch (err) {
      setOcrLoading(false)
      jouerBipEtVibrer('alerte')
      setStatusScannerNom('❌ Erreur de lecture OCR. Réessayez.')
    }
  }

  // ── Calcul des Totaux Panier Mixte ────────────────────────────────────────
  const totalPanierCatalogue = Object.entries(panierProduits).reduce((sum, [pId, qte]) => {
    const p = produits.find(item => item.id === pId)
    const prixU = p ? Number(p.prix || 0) : 0
    return sum + (prixU * qte)
  }, 0)

  const totalPanierCustom = itemsCustomPanier.reduce((sum, item) => sum + (item.prix * item.quantite), 0)
  const totalVente = totalPanierCatalogue + totalPanierCustom
  const nbArticlesTotal = Object.values(panierProduits).reduce((a, b) => a + b, 0) + itemsCustomPanier.reduce((a, b) => a + b.quantite, 0)

  // ── Soumission de la Vente Express ────────────────────────────────────────
  const handleValiderVenteRapide = async (e: React.FormEvent) => {
    e.preventDefault()
    if (nbArticlesTotal === 0) {
      alert('Veuillez ajouter au moins un produit du catalogue ou un article libre au panier.')
      return
    }

    setLoading(true)
    let erreurs = 0

    // 1. Enregistrer les articles catalogue
    for (const [pId, qte] of Object.entries(panierProduits)) {
      if (qte <= 0) continue
      const prod = produits.find(p => p.id === pId)
      const res = await declarerVente(boutiqueId, {
        produit_id: pId,
        quantite: qte,
        prix_unitaire: Number(prod?.prix || 0),
        methode_paiement: methodePaiement,
        client_nom: clientNom.trim() || undefined,
      })
      if (!res.success) erreurs++
    }

    // 2. Enregistrer les articles libres
    for (const item of itemsCustomPanier) {
      const res = await declarerVente(boutiqueId, {
        nom_produit: item.nom,
        quantite: item.quantite,
        prix_unitaire: item.prix,
        methode_paiement: methodePaiement,
        client_nom: clientNom.trim() || undefined,
      })
      if (!res.success) erreurs++
    }

    setLoading(false)
    if (erreurs === 0) {
      setMsgSuccess(`⚡ Vente de ${nbArticlesTotal} article(s) (${fcfa(totalVente)}) enregistrée avec succès !`)
      setPanierProduits({})
      setItemsCustomPanier([])
      setClientNom('')
      setTimeout(() => setMsgSuccess(''), 3500)
    } else {
      alert('Certaines lignes de vente n’ont pas pu être enregistrées.')
    }
  }

  // ── Soumission Dépense ────────────────────────────────────────────────────
  const handleValiderDepenseRapide = async (e: React.FormEvent) => {
    e.preventDefault()
    const mNum = Number(montantDepense) || 0
    if (mNum <= 0) {
      alert('Veuillez saisir un montant valide.')
      return
    }

    setLoading(true)
    const res = await addDepense(boutiqueId, {
      montant: mNum,
      categorie: catDepense,
      description: descDepense.trim() || undefined,
    })

    setLoading(false)
    if (res.success) {
      setMsgSuccess('⚡ Dépense enregistrée avec succès !')
      setMontantDepense('')
      setDescDepense('')
      setTimeout(() => setMsgSuccess(''), 3000)
    } else {
      alert(res.error || 'Erreur lors de l’enregistrement')
    }
  }

  // Filtrage Catalogue
  const categoriesCatalogue = Array.from(new Set(produits.map((p: any) => p.categorie).filter(Boolean))) as string[]
  const qModal = rechercheProduit.trim().toLowerCase()
  const produitsFiltres = produits.filter((p: any) => {
    const matchCat = categorieFiltre === 'tous' || p.categorie === categorieFiltre
    const matchText = !qModal ||
      p.nom?.toLowerCase().includes(qModal) ||
      p.categorie?.toLowerCase().includes(qModal) ||
      p.barcode?.toLowerCase().includes(qModal) ||
      p.sku?.toLowerCase().includes(qModal)
    return matchCat && matchText
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Selector Mode Vente / Dépense */}
      <div style={{ display: 'flex', gap: 10, background: '#f1f5f9', padding: 6, borderRadius: 16, border: '1px solid #cbd5e1' }}>
        <button
          type="button"
          onClick={() => setMode('vente')}
          style={{
            flex: 1, padding: '14px 18px', borderRadius: 12, border: 'none',
            background: mode === 'vente' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
            color: mode === 'vente' ? '#ffffff' : '#475569',
            fontWeight: 900, fontSize: 14.5, cursor: 'pointer',
            boxShadow: mode === 'vente' ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s ease',
          }}
        >
          ⚡ + {t('shop.quickSaleEncashment')}
        </button>

        <button
          type="button"
          onClick={() => setMode('depense')}
          style={{
            flex: 1, padding: '14px 18px', borderRadius: 12, border: 'none',
            background: mode === 'depense' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'transparent',
            color: mode === 'depense' ? '#ffffff' : '#475569',
            fontWeight: 900, fontSize: 14.5, cursor: 'pointer',
            boxShadow: mode === 'depense' ? '0 4px 14px rgba(239, 68, 68, 0.35)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s ease',
          }}
        >
          ⚡ - {t('shop.quickExpenseCashOut')}
        </button>
      </div>

      {msgSuccess && (
        <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', color: '#15803d', padding: '14px 18px', borderRadius: 14, fontWeight: 800, fontSize: 14, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)' }}>
          {msgSuccess}
        </div>
      )}

      {mode === 'vente' ? (
        <form onSubmit={handleValiderVenteRapide} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 18, boxShadow: '0 8px 25px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                💰 {t('shop.quickSaleTitle')}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                {t('shop.quickSaleSubtitle')}
              </p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, background: '#f0fdf4', color: '#16a34a', padding: '4px 10px', borderRadius: 12, border: '1px solid #bbf7d0' }}>
              ⚡ {t('shop.expressEntryTitle')}
            </span>
          </div>

          {/* ── Onglets de Sélection : Catalogue vs Saisie Libre vs Scan EAN ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', padding: 4, borderRadius: 12, flex: 1 }}>
              <button
                type="button"
                onClick={() => setModeSaisie('catalogue')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: modeSaisie === 'catalogue' ? '#ffffff' : 'transparent',
                  fontWeight: modeSaisie === 'catalogue' ? 800 : 600,
                  color: modeSaisie === 'catalogue' ? '#0f172a' : '#64748b',
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: modeSaisie === 'catalogue' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                {t('shop.catalogModeTab')} ({produits.length})
              </button>
              <button
                type="button"
                onClick={() => setModeSaisie('libre')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: modeSaisie === 'libre' ? '#ffffff' : 'transparent',
                  fontWeight: modeSaisie === 'libre' ? 800 : 600,
                  color: modeSaisie === 'libre' ? '#0f172a' : '#64748b',
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: modeSaisie === 'libre' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                {t('shop.manualModeTab')}
              </button>
            </div>

            <button
              type="button"
              onClick={demarrerScannerEan}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '9px 14px',
                borderRadius: 10,
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(2,132,199,0.25)',
                whiteSpace: 'nowrap'
              }}
            >
              {t('shop.scanEanBtn')}
            </button>
          </div>

          {/* ── Mode 1 : Recherche & Grille Catalogue ──────────────────────── */}
          {modeSaisie === 'catalogue' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Barre de recherche */}
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={rechercheProduit}
                  onChange={e => setRechercheProduit(e.target.value)}
                  placeholder={t('shop.searchProductPrompt')}
                  style={{
                    width: '100%',
                    padding: '9px 36px 9px 12px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    fontSize: 13,
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                {rechercheProduit && (
                  <button
                    type="button"
                    onClick={() => setRechercheProduit('')}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Catégories */}
              {categoriesCatalogue.length > 0 && (
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                  <button
                    type="button"
                    onClick={() => setCategorieFiltre('tous')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 12,
                      fontSize: 11.5,
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      background: categorieFiltre === 'tous' ? '#0284c7' : '#f1f5f9',
                      color: categorieFiltre === 'tous' ? '#ffffff' : '#475569'
                    }}
                  >
                    {t('common.all')} ({produits.length})
                  </button>
                  {categoriesCatalogue.map(cat => {
                    const count = produits.filter((p: any) => p.categorie === cat).length
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategorieFiltre(cat)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 12,
                          fontSize: 11.5,
                          fontWeight: 700,
                          border: 'none',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          background: categorieFiltre === cat ? '#0284c7' : '#f1f5f9',
                          color: categorieFiltre === cat ? '#ffffff' : '#475569'
                        }}
                      >
                        {cat} ({count})
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Grille Produits */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 8,
                maxHeight: 220,
                overflowY: 'auto',
                padding: 2
              }}>
                {produitsFiltres.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', fontSize: 12.5, color: '#94a3b8', textAlign: 'center', padding: '24px 10px' }}>
                    {produits.length === 0
                      ? t('shop.noProductsInCatalog')
                      : t('shop.noProductsMatchSearch')}
                  </div>
                ) : (
                  produitsFiltres.map((p: any) => {
                    const qte = panierProduits[p.id] || 0
                    const prixAff = Number(p.prix_promo || p.prix || 0)
                    const stock = p.stock_quantite ?? p.quantite_stock

                    return (
                      <div
                        key={p.id}
                        style={{
                          background: qte > 0 ? '#f0f9ff' : '#f8fafc',
                          border: qte > 0 ? '2px solid #0284c7' : '1px solid #e2e8f0',
                          borderRadius: 10,
                          padding: '8px 8px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease-in-out'
                        }}
                      >
                        <div
                          onClick={() => handleAjouterProduitCatalogue(p, 1)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.nom}>
                            {p.nom}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
                            <span style={{ fontSize: 11.5, color: '#0284c7', fontWeight: 900 }}>
                              {fcfa(prixAff)}
                            </span>
                            {stock !== undefined && stock !== null && (
                              <span style={{ fontSize: 9.5, fontWeight: 700, color: stock > 0 ? '#10b981' : '#ef4444' }}>
                                {stock > 0 ? `${stock} ${t('shop.inStockLabel')}` : t('shop.outOfStockBadge')}
                              </span>
                            )}
                          </div>
                        </div>

                        {qte > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6, paddingTop: 4, borderTop: '1px dashed #bae6fd' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAjouterProduitCatalogue(p, -1)
                              }}
                              style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: '#fee2e2', color: '#ef4444', fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              title="-"
                            >
                              -
                            </button>
                            <span style={{ fontSize: 12, fontWeight: 900, color: '#0369a1', minWidth: 16, textAlign: 'center' }}>
                              {qte}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAjouterProduitCatalogue(p, 1)
                              }}
                              style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: '#e0f2fe', color: '#0284c7', fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              title="+"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAjouterProduitCatalogue(p, 1)}
                            style={{ marginTop: 6, padding: '3px 6px', fontSize: 11, fontWeight: 700, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6, color: '#475569', cursor: 'pointer' }}
                          >
                            ➕ {t('common.add')}
                          </button>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* ── Mode 2 : Saisie Libre (Hors Catalogue) ────────────────────── */}
          {modeSaisie === 'libre' && (
            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#0369a1', margin: 0 }}>
                  ✍️ {t('shop.customServicePrompt')} :
                </label>
                <button
                  type="button"
                  onClick={demarrerScannerNom}
                  style={{
                    background: '#e0f2fe',
                    color: '#0369a1',
                    border: '1px solid #bae6fd',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  {t('shop.scanNameOcrBtn')}
                </button>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  {t('shop.articleDesignationLabel')} *
                </label>
                <input
                  type="text"
                  placeholder={t('shop.articleDesignationPlaceholder')}
                  value={libelleCustomInput}
                  onChange={e => setLibelleCustomInput(e.target.value)}
                  style={{ ...inputStyle, borderRadius: 8, padding: 10 }}
                />
              </div>

              {ocrDetections.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: '#64748b' }}>{t('shop.ocrDetectionsLabel')}</span>
                  {ocrDetections.map((txt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setLibelleCustomInput(txt)}
                      style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                    >
                      {txt}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px auto', gap: 8, alignItems: 'flex-end' }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    {t('shop.unitPriceLabel')} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder={t('shop.unitPricePlaceholder')}
                    value={prixCustomInput}
                    onChange={e => setPrixCustomInput(e.target.value)}
                    style={{ ...inputStyle, borderRadius: 8, padding: 10, fontWeight: 700 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    {t('shop.quantityLabel')} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={qteCustomInput}
                    onChange={e => setQteCustomInput(Number(e.target.value))}
                    style={{ ...inputStyle, borderRadius: 8, padding: 10, fontWeight: 700 }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAjouterItemLibre}
                  style={{
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 14px',
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  ➕ {t('common.add')}
                </button>
              </div>
            </div>
          )}

          {/* ── Résumé du Panier Mixte de la Vente Directe ────────────────── */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0369a1' }}>
                🛒 {t('shop.articlesInSale')} ({nbArticlesTotal} {t('shop.catalog').toLowerCase()} • {t('shop.totalCollectedLabel')} : {fcfa(totalVente)}) :
              </span>
              {nbArticlesTotal > 0 && (
                <button
                  type="button"
                  onClick={handleViderPanier}
                  style={{ fontSize: 11, color: '#ef4444', background: '#fee2e2', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontWeight: 800 }}
                >
                  {t('shop.emptyCartBtn')}
                </button>
              )}
            </div>

            {nbArticlesTotal === 0 ? (
              <div style={{ padding: '16px 10px', textAlign: 'center', color: '#94a3b8', fontSize: 12.5 }}>
                {t('shop.addFirstCustomerPrompt')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
                {/* Articles Catalogue */}
                {Object.entries(panierProduits).filter(([_, qte]) => qte > 0).map(([pId, qte]) => {
                  const prodObj = produits.find((p: any) => p.id === pId)
                  if (!prodObj) return null
                  const unitPrice = Number(prodObj.prix || 0)
                  const subtotal = unitPrice * qte

                  return (
                    <div key={pId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '6px 10px', borderRadius: 8, border: '1px solid #e0f2fe', fontSize: 12.5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 9.5, background: '#f0fdf4', color: '#16a34a', fontWeight: 800, padding: '1px 5px', borderRadius: 4 }}>{t('shop.catalog')}</span>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{prodObj.nom}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ color: '#0284c7', fontWeight: 800 }}>
                          {qte} × {fcfa(unitPrice)} = {fcfa(subtotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAjouterProduitCatalogue(prodObj, -qte)}
                          style={{ background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: 4, width: 20, height: 20, cursor: 'pointer', fontWeight: 900, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title={t('shop.deleteItemTitle')}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )
                })}

                {/* Articles Libres */}
                {itemsCustomPanier.map((item, idx) => {
                  const subtotal = item.prix * item.quantite
                  return (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '6px 10px', borderRadius: 8, border: '1px dashed #0284c7', fontSize: 12.5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 9.5, background: '#e0f2fe', color: '#0369a1', fontWeight: 800, padding: '1px 5px', borderRadius: 4 }}>{t('shop.freeItemBadge')}</span>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{item.nom}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ color: '#0284c7', fontWeight: 800 }}>
                          {item.quantite} × {fcfa(item.prix)} = {fcfa(subtotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setItemsCustomPanier(prev => prev.filter((_, i) => i !== idx))}
                          style={{ background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: 4, width: 20, height: 20, cursor: 'pointer', fontWeight: 900, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title={t('shop.deleteItemTitle')}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Mode de Paiement & Client */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ ...labelStyle, fontSize: 12, fontWeight: 800, color: '#475569' }}>{t('shop.paymentModePrompt')}</label>
              <select
                value={methodePaiement}
                onChange={e => setMethodePaiement(e.target.value)}
                style={{ ...inputStyle, borderRadius: 12, padding: 12 }}
              >
                <option value="especes">💵 Espèces (Cash)</option>
                <option value="wave">🌊 Wave Senegal</option>
                <option value="orange_money">🍊 Orange Money</option>
                <option value="carte">💳 Carte Bancaire</option>
                <option value="cheque">📜 Chèque</option>
              </select>
            </div>

            <div>
              <label style={{ ...labelStyle, fontSize: 12, fontWeight: 800, color: '#475569' }}>{t('shop.customerFullNameLabel')} ({t('common.optional')})</label>
              <input
                type="text"
                placeholder="Ex: Client comptoir"
                value={clientNom}
                onChange={e => setClientNom(e.target.value)}
                style={{ ...inputStyle, borderRadius: 12, padding: 12 }}
              />
            </div>
          </div>

          {/* Total Calculé en Direct */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>{t('shop.totalCollectedLabel')} ({nbArticlesTotal} {t('shop.catalog').toLowerCase()})</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{fcfa(totalVente)}</span>
          </div>

          <button
            type="submit"
            disabled={loading || nbArticlesTotal === 0}
            style={{
              background: nbArticlesTotal === 0 ? '#94a3b8' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 14,
              padding: '14px 20px',
              fontWeight: 900,
              fontSize: 15,
              cursor: nbArticlesTotal === 0 ? 'not-allowed' : 'pointer',
              boxShadow: nbArticlesTotal === 0 ? 'none' : '0 6px 18px rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? t('common.loading') : `⚡ ${t('shop.validateCashInBtn')} (${fcfa(totalVente)})`}
          </button>
        </form>
      ) : (
        <form onSubmit={handleValiderDepenseRapide} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 18, boxShadow: '0 8px 25px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              💸 {t('shop.quickExpenseTitle')}
            </h3>
            <span style={{ fontSize: 11, fontWeight: 800, background: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: 12, border: '1px solid #fecaca' }}>
              ⚡ {t('shop.expressExpenseTitle')}
            </span>
          </div>

          <div>
            <label style={{ ...labelStyle, fontSize: 12, fontWeight: 800, color: '#475569' }}>{t('shop.expenseAmountLabel')}</label>
            <input
              type="number"
              required
              min="1"
              placeholder="Ex: 5000"
              value={montantDepense}
              onChange={e => setMontantDepense(e.target.value)}
              style={{ ...inputStyle, borderRadius: 12, padding: 14, fontSize: 18, fontWeight: 900, color: '#dc2626' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ ...labelStyle, fontSize: 12, fontWeight: 800, color: '#475569' }}>{t('shop.productCategory')}</label>
              <select
                value={catDepense}
                onChange={e => setCatDepense(e.target.value)}
                style={{ ...inputStyle, borderRadius: 12, padding: 12 }}
              >
                <option value="stock">📦 {t('shop.catStock')}</option>
                <option value="loyer">🏠 {t('shop.catRent')}</option>
                <option value="salaire">👥 {t('shop.catSalaries')}</option>
                <option value="transport">🚚 {t('shop.catTransport')}</option>
                <option value="marketing">📣 {t('shop.catMarketing')}</option>
                <option value="fournitures">📑 {t('shop.catOfficeSupplies')}</option>
                <option value="taxes">🏛️ {t('shop.catTaxes')}</option>
                <option value="autre">🔖 {t('shop.catOther')}</option>
              </select>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label style={{ ...labelStyle, fontSize: 12, fontWeight: 800, color: '#475569', margin: 0 }}>{t('shop.expenseReasonLabel')}</label>
                <button
                  type="button"
                  onClick={demarrerScannerNom}
                  style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  {t('shop.scanReceiptOcrBtn')}
                </button>
              </div>
              <input
                type="text"
                placeholder="Ex: Facture Senelec, Achat sacs plastique"
                value={descDepense}
                onChange={e => setDescDepense(e.target.value)}
                style={{ ...inputStyle, borderRadius: 12, padding: 12 }}
              />
              {ocrDetections.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                  {ocrDetections.map((txt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDescDepense(txt)}
                      style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                    >
                      {txt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 14,
              padding: '14px 20px',
              fontWeight: 900,
              fontSize: 15,
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(239, 68, 68, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? t('common.loading') : `⚡ ${t('shop.validateExpenseBtn')}`}
          </button>
        </form>
      )}

      {/* ── Modal Scanner EAN Caméra Compta ────────────────────────────── */}
      {modalScannerEan && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: 16 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{t('shop.scanBarcodeModalTitle')}</h4>
              <button type="button" onClick={arreterScannerEan} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: '#475569', fontWeight: 600 }}>{scannerEanStatus}</p>
            <div style={{ width: '100%', height: 260, background: '#000', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
              <div id="compta-ean-scanner-reader" style={{ width: '100%', height: '100%' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#475569' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 700 }}>
                <input type="checkbox" checked={scanContinu} onChange={e => setScanContinu(e.target.checked)} />
                {t('shop.continuousScanCheckbox')}
              </label>
              <button type="button" onClick={arreterScannerEan} style={{ background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 800, cursor: 'pointer' }}>
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Scanner Nom OCR Caméra Compta ──────────────────────────── */}
      {modalScannerNom && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: 16 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{t('shop.scanProductNameModalTitle')}</h4>
              <button type="button" onClick={arreterScannerNom} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: '#475569', fontWeight: 600 }}>{statusScannerNom}</p>
            <div style={{ width: '100%', height: 260, background: '#000', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
              {imageFligeeComptaNom ? (
                <img src={imageFligeeComptaNom} alt="Capture" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#0f172a' }} />
              ) : (
                <>
                  <video ref={videoNomRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: '15%', left: '5%', width: '90%', height: '70%', border: '2px dashed #38bdf8', borderRadius: 12, boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ background: 'rgba(15,23,42,0.75)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>
                      {t('shop.centerNamePrompt')}
                    </span>
                  </div>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                disabled={ocrLoading}
                onClick={capturerNomOCR}
                style={{ flex: 1, padding: '11px', background: ocrLoading ? '#94a3b8' : '#0284c7', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: ocrLoading ? 'not-allowed' : 'pointer' }}
              >
                {ocrLoading ? t('common.loading') : (imageFligeeComptaNom ? '🔄 Reprendre la photo' : t('shop.captureAndExtractNameBtn'))}
              </button>
              {imageFligeeComptaNom && (
                <button
                  type="button"
                  onClick={arreterScannerNom}
                  style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 16px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
                >
                  ✅ Valider
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function Comptabilite({
  boutiqueId,
  boutiqueNom = 'Ma Boutique',
  initialTab = 'bilan'
}: {
  boutiqueId: string
  boutiqueNom?: string
  initialTab?: 'dashboard' | 'bilan' | 'sessions' | 'inventaire' | 'caissiers' | 'express' | 'ventes' | 'depenses' | 'zones'
}) {
  const resolvedTab = (initialTab === 'dashboard' ? 'bilan' : initialTab) as 'bilan' | 'sessions' | 'inventaire' | 'caissiers' | 'express' | 'ventes' | 'depenses' | 'zones'
  const [tab, setTab] = useState<'bilan' | 'sessions' | 'inventaire' | 'caissiers' | 'express' | 'ventes' | 'depenses' | 'zones'>(resolvedTab)
  const { scrollRef: comptaTabRef, scrollToCenter: scrollComptaToCenter } = useScrollNudge()
  const { t } = useTranslation()

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab === 'dashboard' ? 'bilan' : (initialTab as any))
    }
  }, [initialTab])

  const tabBtn = (tId: typeof tab, label: string) => (
    <button
      type="button"
      onClick={(e) => {
        setTab(tId)
        scrollComptaToCenter(e.currentTarget)
      }}
      style={{
        padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
        fontSize: 13.5, fontWeight: tab === tId ? 800 : 600,
        color: tab === tId ? '#C75B00' : '#64748b',
        borderBottom: tab === tId ? '3px solid #C75B00' : '3px solid transparent',
        whiteSpace: 'nowrap',
        transition: 'all 0.15s ease',
      }}
    >
      {label}
    </button>
  )

  return (
    <div>
      <div ref={comptaTabRef} className="nopalou-scroll-tabs horizontal-scroll-fade" style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: 20, overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', gap: 4 }}>
        {tabBtn('bilan',      `📈 Bilan & Rentabilité`)}
        {tabBtn('ventes',     `💰 Journal des Ventes`)}
        {tabBtn('depenses',   `📉 Dépenses`)}
        {tabBtn('sessions',   `🧾 Clôtures Caisse (Rapport Z)`)}
        {(tab === 'inventaire' || tab === 'caissiers' || tab === 'zones') && (
          tabBtn(tab, tab === 'inventaire' ? '📦 Inventaire' : tab === 'caissiers' ? '👤 Caissiers' : '🚚 Zones de Livraison')
        )}
      </div>

      {tab === 'bilan'      && <BilanView boutiqueId={boutiqueId} boutiqueNom={boutiqueNom} />}
      {tab === 'ventes'     && <VentesView boutiqueId={boutiqueId} />}
      {tab === 'depenses'   && <DepensesView boutiqueId={boutiqueId} />}
      {tab === 'sessions'   && <RapportsZView boutiqueId={boutiqueId} boutiqueNom={boutiqueNom} />}
      {tab === 'inventaire' && <InventaireView boutiqueId={boutiqueId} boutiqueNom={boutiqueNom} />}
      {tab === 'caissiers'  && <PerformancesCaissiersView boutiqueId={boutiqueId} boutiqueNom={boutiqueNom} />}
      {tab === 'express'    && <SaisieExpressView boutiqueId={boutiqueId} />}
      {tab === 'zones'      && <ZonesView boutiqueId={boutiqueId} />}
    </div>
  )
}

// ── Zones de livraison ────────────────────────────────────────────────────────

export function ZonesView({ boutiqueId }: { boutiqueId: string }) {
  const { t } = useTranslation()
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [nom, setNom] = useState('')
  const [prix, setPrix] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [, startTransition] = useTransition()

  async function load() {
    setLoading(true)
    const cacheKeyZ = `nopalou_offline_compta_zones_${boutiqueId}`
    const cachedZ = typeof window !== 'undefined' ? localStorage.getItem(cacheKeyZ) : null
    if (cachedZ) {
      try {
        setZones(JSON.parse(cachedZ))
        setLoading(false)
      } catch (e) {}
    }

    try {
      const z = await listZones(boutiqueId)
      if (Array.isArray(z)) {
        setZones(z)
        if (typeof window !== 'undefined') {
          localStorage.setItem(cacheKeyZ, JSON.stringify(z))
        }
      }
    } catch (err) {
      console.warn('🚚 [Zones] Mode hors-ligne : utilisation du cache local.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [boutiqueId])

  function submit() {
    if (!nom.trim() || !prix) return
    startTransition(async () => {
      await createZone(boutiqueId, nom.trim(), Number(prix))
      setNom(''); setPrix(''); setShowForm(false); load()
    })
  }

  function remove(id: string) {
    if (!confirm('Supprimer cette zone ?')) return
    startTransition(async () => { await deleteZone(boutiqueId, id); load() })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{zones.length} {t('shop.deliveryZonesTitle')}</p>
        <button onClick={() => setShowForm(!showForm)} style={{ fontSize: 13, background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 700, cursor: 'pointer' }}>
          + {t('shop.addDeliveryZone')}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>{t('shop.zoneName')}</label>
            <input value={nom} onChange={e => setNom(e.target.value)} style={inputStyle} placeholder="Ex: Dakar Plateau, Banlieue…" />
          </div>
          <div style={{ width: 130 }}>
            <label style={labelStyle}>{t('shop.zoneFee')}</label>
            <input type="number" min={0} value={prix} onChange={e => setPrix(e.target.value)} style={inputStyle} placeholder="0" />
          </div>
          <button onClick={submit} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>{t('common.save')}</button>
        </div>
      )}

      {loading ? <p style={{ color: '#9ca3af', fontSize: 14 }}>{t('common.loading')}</p> : zones.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #d1d5db', color: '#9ca3af', fontSize: 14 }}>
          {t('common.noData')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {zones.map(z => (
            <div key={z.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{z.nom}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 14, color: '#374151' }}>{fcfa(z.prix)}</span>
                <button onClick={() => remove(z.id)} style={{ background: 'none', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
