'use client'

import React, { useState, useEffect, useMemo, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Plus, DollarSign, CheckCircle2, Download, CheckCheck, MessageCircle } from 'lucide-react'

import LocatifModals from './components/LocatifModals'
import TableBauxImmo, { BailItem } from './components/TableBauxImmo'
import TableLoyersDesktop from './components/TableLoyersDesktop'
import LoyerCardMobile, { LoyerEcheance } from './components/LoyerCardMobile'
import ExportCsvButton from '../../components/ExportCsvButton'
import { AgenceTableToolbar, SortOption } from '../../components/AgenceTableToolbar'
import { AgenceTableTh } from '../../components/AgenceTableTh'
import { AgenceBatchActionBar, BatchActionItem } from '../../components/AgenceBatchActionBar'
import { exportDataToCsv } from '@/lib/immo-csv-export'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

const SORT_LOYERS: SortOption[] = [
  { value: 'date_asc', label: 'Échéance la plus proche' },
  { value: 'date_desc', label: 'Échéance la plus lointaine' },
  { value: 'montant_desc', label: 'Montant dû le plus élevé' },
  { value: 'locataire_asc', label: 'Locataire (A - Z)' },
]

export default function LocatifPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params?.slug as string
  const tabParam = searchParams?.get('tab')

  const [tab, setTab] = useState<'loyers' | 'baux'>(tabParam === 'baux' ? 'baux' : 'loyers')

  useEffect(() => {
    if (tabParam === 'baux' || tabParam === 'loyers') {
      setTab(tabParam)
    }
  }, [tabParam])

  const [baux, setBaux] = useState<BailItem[]>([])
  const [loyers, setLoyers] = useState<LoyerEcheance[]>([])
  const [loading, setLoading] = useState(true)

  // Modales
  const [showCreerBail, setShowCreerBail] = useState(false)
  const [selectedLoyer, setSelectedLoyer] = useState<LoyerEcheance | null>(null)
  const [loyerAEditer, setLoyerAEditer] = useState<LoyerEcheance | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Filtres, Recherche, Tri (Loyers)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState('tous')
  const [currentSort, setCurrentSort] = useState('date_asc')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Sélections & Batch (Loyers)
  const [selectedLoyerIds, setSelectedLoyerIds] = useState<string[]>([])
  const [isExecutingBatch, setIsExecutingBatch] = useState(false)

  async function chargerDonnees() {
    try {
      setLoading(true)
      const headers = getImmoAuthHeaders()
      const [resBaux, resLoyers] = await Promise.all([
        fetch(`/api/locatif-immo/agence/${slug}/baux`, { headers }),
        fetch(`/api/locatif-immo/agence/${slug}/loyers`, { headers }),
      ])
      const dataBaux = await resBaux.json()
      const dataLoyers = await resLoyers.json()
      if (dataBaux.success) setBaux(dataBaux.baux || [])
      if (dataLoyers.success) setLoyers(dataLoyers.loyers || [])
    } catch (err) {
      console.error('[LOAD_LOCATIF_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) chargerDonnees()
  }, [slug])

  async function handleRelance(loyerId: string) {
    try {
      const res = await fetch(`/api/locatif-immo/agence/${slug}/loyers/${loyerId}/relance`, {
        method: 'POST',
        headers: getImmoAuthHeaders(),
      })
      const data = await res.json()
      if (data.success) {
        setToastMsg('Rappel et relance de loyer enregistrés avec succès.')
        chargerDonnees()
        setTimeout(() => setToastMsg(null), 4000)
      }
    } catch (err) {
      console.error('[RELANCE_ERR]', err)
    }
  }

  // Filtrage et Tri des Loyers
  const loyersFiltres = useMemo(() => {
    let list = [...loyers]

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      list = list.filter(
        l =>
          l.locataire_nom.toLowerCase().includes(q) ||
          (l.locataire_prenom && l.locataire_prenom.toLowerCase().includes(q)) ||
          l.bien_titre.toLowerCase().includes(q) ||
          l.periode.toLowerCase().includes(q)
      )
    }

    if (filterStatut !== 'tous') {
      list = list.filter(l => l.statut === filterStatut)
    }

    list.sort((a, b) => {
      let cmp = 0
      if (currentSort.startsWith('date')) {
        const dA = new Date(a.date_echeance).getTime()
        const dB = new Date(b.date_echeance).getTime()
        cmp = dA - dB
        if (currentSort === 'date_desc' || sortDirection === 'desc') cmp = -cmp
      } else if (currentSort.startsWith('montant')) {
        cmp = Number(b.montant_du || 0) - Number(a.montant_du || 0)
        if (sortDirection === 'asc') cmp = -cmp
      } else if (currentSort.startsWith('locataire')) {
        cmp = a.locataire_nom.localeCompare(b.locataire_nom)
        if (sortDirection === 'desc') cmp = -cmp
      }
      return cmp
    })

    return list
  }, [loyers, searchTerm, filterStatut, currentSort, sortDirection])

  function handleToggleSelectLoyer(id: string) {
    setSelectedLoyerIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]))
  }

  function handleSelectAllLoyers() {
    if (selectedLoyerIds.length === loyersFiltres.length) {
      setSelectedLoyerIds([])
    } else {
      setSelectedLoyerIds(loyersFiltres.map(l => l.id))
    }
  }

  function handleSortColumn(key: string) {
    if (currentSort === key) {
      setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setCurrentSort(key)
      setSortDirection('asc')
    }
  }

  // Batch actions Loyers
  async function handleBatchEncaisserLoyers() {
    if (!confirm(`Confirmez-vous l'encaissement groupé de ces ${selectedLoyerIds.length} loyers ?`)) return
    try {
      setIsExecutingBatch(true)
      const res = await fetch(`/api/locatif-immo/agence/${slug}/loyers/batch-encaisser`, {
        method: 'POST',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ loyerIds: selectedLoyerIds }),
      })
      const data = await res.json()
      if (data.success) {
        setToastMsg(data.message || 'Loyers encaissés avec succès.')
        setSelectedLoyerIds([])
        chargerDonnees()
        setTimeout(() => setToastMsg(null), 3500)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsExecutingBatch(false)
    }
  }

  async function handleBatchRelanceLoyers() {
    try {
      setIsExecutingBatch(true)
      const res = await fetch(`/api/locatif-immo/agence/${slug}/loyers/batch-relance`, {
        method: 'POST',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ loyerIds: selectedLoyerIds }),
      })
      const data = await res.json()
      if (data.success) {
        setToastMsg(data.message || 'Relances WhatsApp envoyées.')
        setSelectedLoyerIds([])
        setTimeout(() => setToastMsg(null), 3500)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsExecutingBatch(false)
    }
  }

  function handleBatchExportLoyers() {
    const items = selectedLoyerIds.length > 0 ? loyers.filter(l => selectedLoyerIds.includes(l.id)) : loyersFiltres
    exportDataToCsv('loyers-echeances', [
      { header: 'Période', key: 'periode' },
      { header: 'Date Échéance', key: 'date_echeance' },
      { header: 'Bien', key: 'bien_titre' },
      { header: 'Locataire', key: 'locataire_nom' },
      { header: 'Téléphone', key: 'locataire_tel' },
      { header: 'Montant Dû FCFA', key: 'montant_du' },
      { header: 'Montant Payé FCFA', key: 'montant_paye' },
      { header: 'Statut', key: 'statut' },
    ], items)
  }

  const batchActionsLoyers: BatchActionItem[] = [
    {
      id: 'encaisser',
      label: 'Encaisser en lot',
      icon: CheckCheck,
      onClick: handleBatchEncaisserLoyers,
      variant: 'primary',
    },
    {
      id: 'relance',
      label: 'Relance WhatsApp',
      icon: MessageCircle,
      onClick: handleBatchRelanceLoyers,
      variant: 'success',
    },
    {
      id: 'export_csv',
      label: 'Exporter CSV',
      icon: Download,
      onClick: handleBatchExportLoyers,
    },
  ]

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* ── En-tête avec actions ── */}
      <div className="agence-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="agence-title">Gestion Locative & Loyers</h1>
          <p className="agence-subtitle">Suivi des baux actifs, encaissement des loyers et quittances certifiées.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <ExportCsvButton slug={slug} type={tab === 'loyers' ? 'loyers' : 'baux'} label={`Exporter ${tab === 'loyers' ? 'Loyers' : 'Baux'} CSV`} />
          <button
            type="button"
            onClick={() => setShowCreerBail(true)}
            className="agence-btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={16} />
            <span>Nouveau Bail</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div style={{ padding: '12px 16px', background: '#DCFCE7', color: '#166534', borderRadius: 8, fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <CheckCircle2 size={18} />
          {toastMsg}
        </div>
      )}

      {/* ── Onglets de bascule ── */}
      <div className="immo-chips-scroller" style={{ display: 'flex', flexWrap: 'nowrap', gap: 10, marginBottom: 16, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {(['loyers', 'baux'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              fontSize: 13.5,
              fontWeight: 750,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: tab === t ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)',
              background: tab === t ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
              color: tab === t ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {t === 'loyers' ? `Échéances & Encaissements (${loyers.length})` : `Baux Sous Gestion (${baux.length})`}
          </button>
        ))}
      </div>


      {/* ── Onglet Loyers ── */}
      {tab === 'loyers' && (
        <div>
          <AgenceTableToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Rechercher par locataire, bien, période..."
            sortOptions={SORT_LOYERS}
            currentSort={currentSort}
            onSortChange={setCurrentSort}
            sortDirection={sortDirection}
            onToggleSortDirection={() => setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'))}
            totalCount={loyers.length}
            filteredCount={loyersFiltres.length}
            hasActiveFilters={Boolean(searchTerm || filterStatut !== 'tous')}
            onResetFilters={() => {
              setSearchTerm('')
              setFilterStatut('tous')
            }}
          >
            <select
              value={filterStatut}
              onChange={e => setFilterStatut(e.target.value)}
              className="form-select"
              style={{ width: 'auto', padding: '6px 10px', fontSize: 12.5 }}
            >
              <option value="tous">Tous les statuts de loyers</option>
              <option value="en_attente">En attente de paiement</option>
              <option value="retard">En retard / Impayé</option>
              <option value="paye">Payé & Quittance délivrée</option>
            </select>

            {loyersFiltres.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllLoyers}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border, #E8DDD2)',
                  background: selectedLoyerIds.length === loyersFiltres.length ? 'var(--navy, #1C2B4A)' : '#fff',
                  color: selectedLoyerIds.length === loyersFiltres.length ? '#fff' : 'var(--navy, #1C2B4A)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {selectedLoyerIds.length === loyersFiltres.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
            )}
          </AgenceTableToolbar>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
              <p>Chargement des échéances de loyers...</p>
            </div>
          ) : loyersFiltres.length === 0 ? (
            <div className="agence-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
              <DollarSign size={36} style={{ margin: '0 auto 12px', opacity: 0.5, color: 'var(--accent, #C75B00)' }} />
              <p style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 16 }}>Aucune échéance trouvée</p>
              <p style={{ fontSize: 13.5 }}>Modifiez vos filtres de recherche ou créez un nouveau contrat de bail.</p>
            </div>
          ) : (
            <>
              {/* Version Mobile */}
              <div className="immo-mobile-only">
                {loyersFiltres.map(l => (
                  <LoyerCardMobile
                    key={l.id}
                    slug={slug}
                    loyer={l}
                    onEncaisser={loyer => setSelectedLoyer(loyer)}
                    onRelancer={id => handleRelance(id)}
                    onEditer={loyer => setLoyerAEditer(loyer)}
                    isSelected={selectedLoyerIds.includes(l.id)}
                    onToggleSelect={handleToggleSelectLoyer}
                  />
                ))}
              </div>

              {/* Version Desktop Table */}
              <TableLoyersDesktop
                loyers={loyersFiltres}
                slug={slug}
                selectedIds={selectedLoyerIds}
                currentSort={currentSort}
                sortDirection={sortDirection}
                onSortColumn={handleSortColumn}
                onToggleSelect={handleToggleSelectLoyer}
                onSelectAll={handleSelectAllLoyers}
                onEncaisser={(l) => setSelectedLoyer(l)}
                onRelance={(id) => handleRelance(id)}
                onEditer={(l) => setLoyerAEditer(l)}
              />
            </>
          )}


          {/* Barre d'Actions par Lot Loyers */}
          <AgenceBatchActionBar
            selectedCount={selectedLoyerIds.length}
            totalCount={loyersFiltres.length}
            onClearSelection={() => setSelectedLoyerIds([])}
            actions={batchActionsLoyers}
            isExecuting={isExecutingBatch}
            labelSingulier="loyer sélectionné"
            labelPluriel="loyers sélectionnés"
          />
        </div>
      )}

      {/* ── Onglet Baux ── */}
      {tab === 'baux' && (
        <TableBauxImmo
          slug={slug}
          baux={baux}
          onNouveauBail={() => setShowCreerBail(true)}
          onRefresh={chargerDonnees}
        />
      )}

      {/* Modales */}
      <LocatifModals
        slug={slug}
        showCreerBail={showCreerBail}
        selectedLoyer={selectedLoyer}
        loyerAEditer={loyerAEditer}
        onCloseCreerBail={() => setShowCreerBail(false)}
        onSuccessCreerBail={() => {
          setShowCreerBail(false)
          setToastMsg('Bail créé avec succès !')
          chargerDonnees()
          setTimeout(() => setToastMsg(null), 4000)
        }}
        onCloseEncaisserLoyer={() => setSelectedLoyer(null)}
        onSuccessEncaisserLoyer={() => {
          setSelectedLoyer(null)
          setToastMsg('Loyer encaissé et quittance générée avec succès.')
          chargerDonnees()
          setTimeout(() => setToastMsg(null), 4000)
        }}
        onCloseEditerLoyer={() => setLoyerAEditer(null)}
        onSuccessEditerLoyer={() => {
          setLoyerAEditer(null)
          setToastMsg('Quittance mise à jour.')
          chargerDonnees()
          setTimeout(() => setToastMsg(null), 4000)
        }}
      />
    </div>
  )
}

