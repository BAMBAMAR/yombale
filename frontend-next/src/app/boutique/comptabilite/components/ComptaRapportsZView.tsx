'use client'

import React, { useState, useEffect } from 'react'
import { Printer, Eye, Download, RefreshCw } from 'lucide-react'
import { getPosSessions, getPosSessionDetail } from '../../actions'
import { exportToCSV, printPosSessionRapportZ_PDF } from '@/lib/export'
import { useTranslation } from '@/i18n/context'
import { useScrollNudge } from '@/hooks/useScrollNudge'
import { PosSessionItem, DatePreset } from '../types'
import { fcfa, getDateRangeForPreset, KpiCard } from '../utils'
import { ComptaModalSessionVentesDetail } from './ComptaModalSessionVentesDetail'
import { ComptaRapportsZTable } from './ComptaRapportsZTable'

interface ComptaRapportsZViewProps {
  boutiqueId: string
  boutiqueNom?: string
}

export function ComptaRapportsZView({ boutiqueId, boutiqueNom = 'Ma Boutique' }: ComptaRapportsZViewProps) {
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
      } catch (e) { console.warn('[Nopalou:Comptabilite:RapportsZ]', e) }
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
      console.warn(`[Clôtures Z] Mode hors-ligne : utilisation du cache (${cached ? 'disponible' : 'vide'}).`)
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
    { id: 'today', label: 'Aujourd\'hui' },
    { id: 'yesterday', label: 'Hier' },
    { id: '7d', label: '7 derniers jours' },
    { id: '30d', label: '30 derniers jours' },
    { id: 'this_month', label: 'Ce mois-ci' },
    { id: 'last_month', label: 'Mois dernier' },
    { id: 'this_year', label: 'Cette année' },
    { id: 'custom', label: 'Période libre' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Barre de Contrôle : Périodes & Filtres ── */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              Historique des Sessions & Rapports Z
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
              <Download size={14} /> Export CSV Synthèse
            </button>
            <button
              type="button"
              onClick={loadSessions}
              style={{
                padding: '8px 12px', borderRadius: 10, background: '#f1f5f9', border: '1px solid #cbd5e1',
                color: '#0f172a', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
              }}
              title="Actualiser les données"
            >
              <RefreshCw size={14} /> Actualiser
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
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Caissier :</span>
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
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Statut :</span>
            <select
              value={selectedStatut}
              onChange={e => setSelectedStatut(e.target.value as any)}
              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 600 }}
            >
              <option value="tous">Tous les statuts</option>
              <option value="cloturee">Clôturées Z</option>
              <option value="ouverte">En cours</option>
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
      <ComptaRapportsZTable
        loading={loading}
        sessions={sessions}
        printingId={printingId}
        onPrintRapportZ={handlePrintRapportZ}
        onOpenVentesModal={handleOpenVentesModal}
        onExportSessionCSV={handleExportSessionCSV}
      />

      {/* ── Modal Détail des Ventes d'une Session ── */}
      <ComptaModalSessionVentesDetail
        modalSessionVentes={modalSessionVentes}
        loadingVentes={loadingVentes}
        onClose={() => setModalSessionVentes(null)}
        onExportCSV={handleExportSessionCSV}
        onPrintRapportZ={handlePrintRapportZ}
      />
    </div>
  )
}
