'use client'

import React, { useState, useEffect } from 'react'
import { Building2, FileSpreadsheet, FileText, Database, ChevronDown, Download } from 'lucide-react'
import { getBilanComptable, listVentes, listDepenses } from '../actions'
import { fcfa } from '@/lib/format'
import { exportToCSV, printBilanComptablePDF } from '@/lib/export'
import {
  exportSageCSV,
  exportFEC,
  exportOdooJSON,
  genererEcrituresSyscohada,
  type TransactionComptable
} from '@/lib/syscohada-export'

export interface BilanData {
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

export type DatePreset = 'today' | 'yesterday' | '7d' | '30d' | 'this_month' | 'last_month' | 'this_year' | 'custom'

export function getDateRangeForPreset(preset: DatePreset): { from: string; to: string; label: string } {
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  if (preset === 'today') {
    return { from: todayStr + 'T00:00:00.000Z', to: todayStr + 'T23:59:59.999Z', label: "Aujourd'hui" }
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

const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  fontSize: 14,
  width: '100%',
  background: '#fff',
  boxSizing: 'border-box',
}

function KpiCard({ label, value, sub, color, bg }: { label: string; value: string; sub?: string; color?: string; bg?: string }) {
  return (
    <div style={{ background: bg || '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px', flex: '1 1 140px', minWidth: 130, boxSizing: 'border-box', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
      <p style={{ margin: '0 0 4px', fontSize: 11.5, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: color ?? '#111827' }}>{value}</p>
      {sub && <p style={{ margin: '3px 0 0', fontSize: 11, color: '#94a3b8' }}>{sub}</p>}
    </div>
  )
}

export default function ComptaBilanView({
  boutiqueId,
  boutiqueNom = 'Ma Boutique',
}: {
  boutiqueId: string
  boutiqueNom?: string
}) {
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
      } catch (e) {
        console.warn('[Nopalou:Comptabilite:BilanView:Cache]', e)
      }
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
      ["Chiffre d'Affaires Total", bilan.financier.ca_total, 'FCFA'],
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

  const [menuErpOuvert, setMenuErpOuvert] = useState(false)
  const [exportantErp, setExportantErp] = useState(false)

  const handleExportErp = async (format: 'sage' | 'fec' | 'odoo') => {
    setExportantErp(true)
    try {
      const [ventesRes, depensesRes] = await Promise.all([
        listVentes(boutiqueId),
        listDepenses(boutiqueId)
      ])
      const ventesList = Array.isArray(ventesRes) ? ventesRes : []
      const depensesList = Array.isArray(depensesRes) ? depensesRes : []

      const transactions: TransactionComptable[] = [
        ...ventesList.map((v: any) => ({
          id: String(v.id || v.reference || Math.random()),
          date: v.created_at || new Date().toISOString(),
          reference: v.reference,
          clientNom: v.client_nom,
          montantTotal: Number(v.montant_total) || 0,
          modePaiement: v.methode_paiement || 'cash',
          type: 'vente' as const,
          libelle: `Vente ${v.nom_produit || 'Marchandise'} x${v.quantite || 1}`,
        })),
        ...depensesList.map((d: any) => ({
          id: String(d.id || Math.random()),
          date: d.date_depense || new Date().toISOString(),
          montantTotal: Number(d.montant) || 0,
          modePaiement: 'cash',
          type: 'depense' as const,
          libelle: d.description || `Dépense ${d.categorie || 'exploitation'}`,
        }))
      ]

      const ecritures = genererEcrituresSyscohada(transactions, 'simplifie')
      const baseFilename = `SYSCOHADA_${boutiqueNom.replace(/\s+/g, '_')}`

      if (format === 'sage') {
        exportSageCSV(ecritures, `${baseFilename}_SAGE`)
      } else if (format === 'fec') {
        exportFEC(ecritures, `${baseFilename}_FEC`)
      } else if (format === 'odoo') {
        exportOdooJSON(ecritures, boutiqueNom)
      }
    } catch (err) {
      console.error('[Comptabilite] Erreur export ERP:', err)
      alert("Erreur lors de la génération de l'export ERP.")
    } finally {
      setExportantErp(false)
      setMenuErpOuvert(false)
    }
  }

  const presetsList: { id: DatePreset; label: string }[] = [
    { id: 'today', label: "Aujourd'hui" },
    { id: 'yesterday', label: 'Hier' },
    { id: '7d', label: '7 jours' },
    { id: '30d', label: '30 jours' },
    { id: 'this_month', label: 'Ce mois-ci' },
    { id: 'last_month', label: 'Mois dernier' },
    { id: 'this_year', label: 'Cette année' },
    { id: 'custom', label: 'Période libre' },
  ]

  const modeLabels: Record<string, string> = {
    wave: 'Wave',
    orange_money: 'Orange Money',
    cash: 'Espèces',
    virement: 'Virement bancaire',
    carte: 'Carte bancaire',
  }
  const modeColors: Record<string, string> = {
    wave: '#00c3e3',
    orange_money: '#ff7900',
    cash: '#16a34a',
    virement: '#1e3a8a',
    carte: '#9333ea',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Barre Universelle de Période & Filtres ── */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
              <Download size={14} />
              <span>Bilan PDF</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={loading || !bilan}
              style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #16a34a', background: '#f0fdf4', color: '#15803d', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <FileSpreadsheet size={14} />
              <span>Export CSV</span>
            </button>

            {/* Menu Déroulant Exports ERP SYSCOHADA (Sage / FEC / Odoo) */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setMenuErpOuvert(!menuErpOuvert)}
                disabled={exportantErp}
                style={{
                  padding: '8px 14px', borderRadius: 8,
                  border: '1.5px solid #1d4ed8', background: '#eff6ff',
                  color: '#1d4ed8', fontSize: 12.5, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 1px 3px rgba(29,78,216,0.1)'
                }}
              >
                <Building2 size={15} color="#1d4ed8" />
                <span>{exportantErp ? 'Export...' : 'Exports ERP (OHADA)'}</span>
                <ChevronDown size={14} color="#1d4ed8" />
              </button>

              {menuErpOuvert && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 6,
                  background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10,
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)', zIndex: 50,
                  minWidth: 260, overflow: 'hidden', display: 'flex', flexDirection: 'column'
                }}>
                  <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Norme SYSCOHADA Révisée
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExportErp('sage')}
                    style={{ padding: '10px 14px', border: 'none', background: 'transparent', textAlign: 'left', fontSize: 12.5, color: '#0f172a', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 10 }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <FileSpreadsheet size={16} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700 }}>Sage Saari (.csv)</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Grand Livre &amp; Journal des ventes</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportErp('fec')}
                    style={{ padding: '10px 14px', border: 'none', background: 'transparent', textAlign: 'left', fontSize: 12.5, color: '#0f172a', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 10, borderTop: '1px solid #f1f5f9' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <FileText size={16} color="#d97706" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700 }}>Fichier FEC / DGI (.txt)</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Conforme fiscalité &amp; audit OHADA</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportErp('odoo')}
                    style={{ padding: '10px 14px', border: 'none', background: 'transparent', textAlign: 'left', fontSize: 12.5, color: '#0f172a', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 10, borderTop: '1px solid #f1f5f9' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Database size={16} color="#7c3aed" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700 }}>Odoo Accounting (.json)</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Import écritures account.move</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
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
              <option value="wave">Wave</option>
              <option value="orange_money">Orange Money</option>
              <option value="cash">Espèces</option>
              <option value="carte">Carte Bancaire</option>
              <option value="virement">Virement bancaire</option>
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
            {errorMessage || 'Impossible de charger le bilan comptable pour le moment.'}
          </p>
          <button
            type="button"
            onClick={loadBilan}
            style={{ padding: '6px 14px', borderRadius: 8, background: '#dc2626', color: '#fff', border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
          >
            Réessayer
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

          {/* ── Grille Intermédiaire : Règlements & Top Articles ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            {/* Répartition des encaissements */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: '#1e293b' }}>Modes de Règlement</p>
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
              <p style={{ margin: '0 0 14px', fontSize: 13.5, fontWeight: 800, color: '#1e293b' }}>Top Articles sur la période</p>
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
