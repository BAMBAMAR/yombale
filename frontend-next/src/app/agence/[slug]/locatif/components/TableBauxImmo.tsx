'use client'

import React, { useState, useMemo } from 'react'
import { Key, Plus, FileText, XCircle, AlertTriangle, Download, Trash2 } from 'lucide-react'
import { getImmoAuthToken, getImmoAuthHeaders } from '@/lib/immo-auth'
import BailCardMobile from './BailCardMobile'
import ModalResilierBail from './ModalResilierBail'
import { AgenceTableToolbar, SortOption } from '../../../components/AgenceTableToolbar'
import { AgenceTableTh } from '../../../components/AgenceTableTh'
import { AgenceBatchActionBar, BatchActionItem } from '../../../components/AgenceBatchActionBar'
import { exportDataToCsv } from '@/lib/immo-csv-export'

export interface BailItem {
  id: string
  bien_titre: string
  locataire_nom: string
  locataire_prenom?: string
  locataire_tel?: string
  loyer_mensuel: number
  charges: number
  depot_garantie?: number
  date_debut: string
  date_fin?: string
  statut: string
  nb_impayes?: number
}

interface TableBauxImmoProps {
  slug: string
  baux: BailItem[]
  onNouveauBail: () => void
  onRefresh?: () => void
}

const SORT_OPTIONS: SortOption[] = [
  { value: 'date_desc', label: 'Plus récents en premier' },
  { value: 'date_asc', label: 'Plus anciens en premier' },
  { value: 'loyer_desc', label: 'Loyer le plus élevé' },
  { value: 'locataire_asc', label: 'Locataire (A - Z)' },
]

export default function TableBauxImmo({ slug, baux, onNouveauBail, onRefresh }: TableBauxImmoProps) {
  const [bailAResilier, setBailAResilier] = useState<BailItem | null>(null)
  const [motif, setMotif] = useState('')
  const [loadingResiliation, setLoadingResiliation] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Filtres, Recherche, Tri
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState('tous')
  const [currentSort, setCurrentSort] = useState('date_desc')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Sélections & Batch
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isExecutingBatch, setIsExecutingBatch] = useState(false)

  const token = getImmoAuthToken()

  // Filtrage et Tri
  const bauxFiltres = useMemo(() => {
    let list = [...baux]

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      list = list.filter(
        b =>
          b.bien_titre.toLowerCase().includes(q) ||
          b.locataire_nom.toLowerCase().includes(q) ||
          (b.locataire_prenom && b.locataire_prenom.toLowerCase().includes(q)) ||
          (b.locataire_tel && b.locataire_tel.includes(q))
      )
    }

    if (filterStatut !== 'tous') {
      list = list.filter(b => b.statut === filterStatut)
    }

    list.sort((a, b) => {
      let cmp = 0
      if (currentSort.startsWith('date')) {
        const dA = new Date(a.date_debut).getTime()
        const dB = new Date(b.date_debut).getTime()
        cmp = dB - dA
        if (currentSort === 'date_asc' || sortDirection === 'asc') cmp = -cmp
      } else if (currentSort.startsWith('loyer')) {
        cmp = Number(b.loyer_mensuel || 0) - Number(a.loyer_mensuel || 0)
        if (sortDirection === 'asc') cmp = -cmp
      } else if (currentSort.startsWith('locataire')) {
        cmp = a.locataire_nom.localeCompare(b.locataire_nom)
        if (sortDirection === 'desc') cmp = -cmp
      }
      return cmp
    })

    return list
  }, [baux, searchTerm, filterStatut, currentSort, sortDirection])

  function handleToggleSelect(id: string) {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]))
  }

  function handleSelectAll() {
    if (selectedIds.length === bauxFiltres.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(bauxFiltres.map(b => b.id))
    }
  }

  function handleSortColumn(key: string) {
    if (currentSort === key) {
      setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setCurrentSort(key)
      setSortDirection('desc')
    }
  }

  async function handleBatchResilier() {
    if (!confirm(`Confirmez-vous la résiliation groupée de ces ${selectedIds.length} baux ? Les biens associés seront libérés.`)) return
    try {
      setIsExecutingBatch(true)
      const res = await fetch(`/api/locatif-immo/agence/${slug}/baux/batch-resilier`, {
        method: 'POST',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ bailIds: selectedIds, motif: 'Résiliation groupée' }),
      })
      const data = await res.json()
      if (data.success) {
        setSelectedIds([])
        if (onRefresh) onRefresh()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsExecutingBatch(false)
    }
  }

  function handleBatchExportCsv() {
    const items = selectedIds.length > 0 ? baux.filter(b => selectedIds.includes(b.id)) : bauxFiltres
    exportDataToCsv('baux-sous-gestion', [
      { header: 'Bien', key: 'bien_titre' },
      { header: 'Locataire', key: 'locataire_nom' },
      { header: 'Téléphone', key: 'locataire_tel' },
      { header: 'Loyer Mensuel FCFA', key: 'loyer_mensuel' },
      { header: 'Charges FCFA', key: 'charges' },
      { header: 'Date Début', key: 'date_debut' },
      { header: 'Statut', key: 'statut' },
    ], items)
  }

  async function handleConfirmerResiliation(e: React.FormEvent) {
    e.preventDefault()
    if (!bailAResilier) return
    try {
      setLoadingResiliation(true)
      setErrorMsg(null)
      const res = await fetch(`/api/locatif-immo/agence/${slug}/baux/${bailAResilier.id}/resilier`, {
        method: 'POST',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ motif: motif.trim() || 'Fin de bail ou résiliation amiable' }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la résiliation du bail.')
      }
      setBailAResilier(null)
      setMotif('')
      if (onRefresh) onRefresh()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoadingResiliation(false)
    }
  }

  const batchActions: BatchActionItem[] = [
    {
      id: 'resilier',
      label: 'Résilier les baux',
      icon: XCircle,
      onClick: handleBatchResilier,
      variant: 'danger',
    },
    {
      id: 'export_csv',
      label: 'Exporter CSV',
      icon: Download,
      onClick: handleBatchExportCsv,
    },
  ]

  if (baux.length === 0) {
    return (
      <div className="agence-card" style={{ textAlign: 'center', padding: '50px 20px', color: '#64748B' }}>
        <Key size={36} style={{ margin: '0 auto 12px', opacity: 0.5, color: 'var(--accent, #C75B00)' }} />
        <p style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 17 }}>Aucun bail enregistré</p>
        <p style={{ fontSize: 13.5, maxWidth: 450, margin: '6px auto 16px' }}>
          Associez un locataire à un bien immobilier pour créer votre premier contrat de bail locatif.
        </p>
        <button
          type="button"
          onClick={onNouveauBail}
          className="agence-btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: '0 auto' }}
        >
          <Plus size={16} />
          <span>Nouveau Contrat de Bail</span>
        </button>
      </div>
    )
  }

  return (
    <>
      {/* ── Toolbar : Recherche, Tri & Filtres Baux ── */}
      <AgenceTableToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Rechercher par bien, locataire, téléphone..."
        sortOptions={SORT_OPTIONS}
        currentSort={currentSort}
        onSortChange={setCurrentSort}
        sortDirection={sortDirection}
        onToggleSortDirection={() => setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'))}
        totalCount={baux.length}
        filteredCount={bauxFiltres.length}
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
          <option value="tous">Tous les baux</option>
          <option value="actif">Baux actifs</option>
          <option value="resilie">Baux résiliés</option>
        </select>

        {bauxFiltres.length > 0 && (
          <button
            type="button"
            onClick={handleSelectAll}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid var(--border, #E8DDD2)',
              background: selectedIds.length === bauxFiltres.length ? 'var(--navy, #1C2B4A)' : '#fff',
              color: selectedIds.length === bauxFiltres.length ? '#fff' : 'var(--navy, #1C2B4A)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {selectedIds.length === bauxFiltres.length ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
        )}
      </AgenceTableToolbar>

      {/* ── Version Mobile : Cartes tactiles ── */}
      <div className="immo-mobile-only">
        {bauxFiltres.map(b => (
          <BailCardMobile
            key={b.id}
            slug={slug}
            bail={b}
            onResilier={item => {
              setBailAResilier(item)
              setMotif('')
              setErrorMsg(null)
            }}
            isSelected={selectedIds.includes(b.id)}
            onToggleSelect={handleToggleSelect}
          />
        ))}
      </div>

      {/* ── Version Desktop : Table complète ── */}
      <div className="immo-desktop-only agence-table-wrapper">
        <table className="agence-table">
          <thead>
            <tr>
              <th style={{ width: 42, textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={bauxFiltres.length > 0 && selectedIds.length === bauxFiltres.length}
                  onChange={handleSelectAll}
                  className="immo-checkbox"
                  title="Tout sélectionner"
                />
              </th>
              <AgenceTableTh label="Bien Immobilier" sortKey="locataire_asc" currentSort={currentSort} sortDirection={sortDirection} onSort={handleSortColumn} />
              <AgenceTableTh label="Locataire" />
              <AgenceTableTh label="Loyer & Charges" sortKey="loyer_desc" currentSort={currentSort} sortDirection={sortDirection} onSort={handleSortColumn} />
              <AgenceTableTh label="Période & Début" sortKey="date_desc" currentSort={currentSort} sortDirection={sortDirection} onSort={handleSortColumn} />
              <AgenceTableTh label="Statut" />
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bauxFiltres.map(b => {
              const isSelected = selectedIds.includes(b.id)
              const isActif = b.statut === 'actif'
              const bailPdfUrl = `/api/agences/agence/${slug}/documents/bail/${b.id}.pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`

              return (
                <tr key={b.id} className={isSelected ? 'selected' : ''}>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(b.id)}
                      className="immo-checkbox"
                    />
                  </td>
                  <td>
                    <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>{b.bien_titre}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                      {b.locataire_nom} {b.locataire_prenom || ''}
                    </div>
                    {b.locataire_tel && (
                      <div style={{ fontSize: 11.5, color: '#64748B' }}>{b.locataire_tel}</div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                      {Number(b.loyer_mensuel).toLocaleString('fr-FR')} FCFA
                    </div>
                    {Number(b.charges) > 0 && (
                      <div style={{ fontSize: 11.5, color: '#64748B' }}>
                        + {Number(b.charges).toLocaleString('fr-FR')} FCFA charges
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                      Début : {new Date(b.date_debut).toLocaleDateString('fr-FR')}
                    </div>
                    {b.date_fin && (
                      <div style={{ fontSize: 11.5, color: '#64748B' }}>
                        Fin : {new Date(b.date_fin).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${b.statut}`}>
                      {b.statut === 'actif' ? 'En cours' : b.statut === 'resilie' ? 'Résilié' : b.statut}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                      <a
                        href={bailPdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '5px 10px',
                          borderRadius: 6,
                          background: '#F1F5F9',
                          color: 'var(--navy, #1C2B4A)',
                          border: '1px solid #CBD5E1',
                          fontSize: 12,
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                      >
                        <FileText size={13} />
                        <span>Contrat</span>
                      </a>

                      {isActif && (
                        <button
                          type="button"
                          onClick={() => {
                            setBailAResilier(b)
                            setMotif('')
                            setErrorMsg(null)
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '5px 10px',
                            borderRadius: 6,
                            background: '#FFF1F2',
                            color: '#E11D48',
                            border: '1px solid #FECDD3',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          <XCircle size={13} />
                          <span>Résilier</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Barre d'Actions par Lot Baux */}
      <AgenceBatchActionBar
        selectedCount={selectedIds.length}
        totalCount={bauxFiltres.length}
        onClearSelection={() => setSelectedIds([])}
        actions={batchActions}
        isExecuting={isExecutingBatch}
        labelSingulier="bail sélectionné"
        labelPluriel="baux sélectionnés"
      />

      {/* Modale Résiliation individuelle */}
      <ModalResilierBail
        bail={bailAResilier}
        motif={motif}
        onMotifChange={setMotif}
        loading={loadingResiliation}
        errorMsg={errorMsg}
        onClose={() => setBailAResilier(null)}
        onConfirm={handleConfirmerResiliation}
      />
    </>
  )
}

