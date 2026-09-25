'use client'

import React, { useState, useMemo } from 'react'
import { Key, Plus, FileText, XCircle, AlertTriangle, Download, Trash2, Edit2 } from 'lucide-react'
import { getImmoAuthToken, getImmoAuthHeaders } from '@/lib/immo-auth'
import BailCardMobile from './BailCardMobile'
import BailTableRow from './BailTableRow'
import ModalResilierBail from './ModalResilierBail'
import ModalEditerBail from './ModalEditerBail'
import SignaturePadModal from '@/components/immo/SignaturePadModal'
import DossierPiecesModal, { PieceJointeItem } from '@/components/immo/DossierPiecesModal'
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
  duree_mois?: number
  jour_echeance?: number
  date_debut: string
  date_fin?: string
  statut: string
  nb_impayes?: number
  conditions?: string
  document_url?: string
  clauses_personnalisees?: Record<string, string>
  pieces_jointes?: PieceJointeItem[]
  signature_locataire?: string | null
  cachet_locataire?: string | null
  date_signature_locataire?: string | null
  nom_signataire_locataire?: string | null
  signature_bailleur?: string | null
  cachet_bailleur?: string | null
  date_signature_bailleur?: string | null
  nom_signataire_bailleur?: string | null
  statut_signature?: string
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
  const [bailAEditer, setBailAEditer] = useState<BailItem | null>(null)
  const [bailASigner, setBailASigner] = useState<BailItem | null>(null)
  const [bailPieces, setBailPieces] = useState<BailItem | null>(null)
  const [motif, setMotif] = useState('')
  const [loadingResiliation, setLoadingResiliation] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSaveSignatureAgence(signatureDataUrl: string, signerName: string, cachetDataUrl?: string | null) {
    if (!bailASigner) return
    const res = await fetch(`/api/locatif-immo/agence/${slug}/baux/${bailASigner.id}/signer`, {
      method: 'POST',
      headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        signature: signatureDataUrl,
        cachet: cachetDataUrl || null,
        nom_signataire: signerName,
      }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Erreur lors de la signature du contrat.')
    }
    setBailASigner(null)
    if (onRefresh) onRefresh()
  }

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
            onEditer={item => setBailAEditer(item)}
            onResilier={item => {
              setBailAResilier(item)
              setMotif('')
              setErrorMsg(null)
            }}
            onSigner={item => setBailASigner(item)}
            onPieces={item => setBailPieces(item)}
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
            {bauxFiltres.map(b => (
              <BailTableRow
                key={b.id}
                bail={b}
                isSelected={selectedIds.includes(b.id)}
                slug={slug}
                token={token}
                onToggleSelect={handleToggleSelect}
                onEditer={item => setBailAEditer(item)}
                onResilier={item => {
                  setBailAResilier(item)
                  setMotif('')
                  setErrorMsg(null)
                }}
                onSigner={item => setBailASigner(item)}
                onPieces={item => setBailPieces(item)}
              />
            ))}
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

      {/* Modale Édition / Personnalisation de bail */}
      {bailAEditer && (
        <ModalEditerBail
          slug={slug}
          bail={bailAEditer}
          onClose={() => setBailAEditer(null)}
          onSuccess={() => onRefresh && onRefresh()}
        />
      )}

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

      {/* Modale Signature Numérique Agence / Mandataire */}
      <SignaturePadModal
        isOpen={Boolean(bailASigner)}
        signerRole="agence"
        title="Signature Électronique Mandataire / Bailleur"
        subtitle="Signez à l'écran ou à la souris pour valider et certifier le contrat de bail."
        onClose={() => setBailASigner(null)}
        onSaveSignature={handleSaveSignatureAgence}
      />

      {/* Modale Dossier & Pièces Justificatives Agence */}
      {bailPieces && (
        <DossierPiecesModal
          isOpen={Boolean(bailPieces)}
          bailId={bailPieces.id}
          pieces={bailPieces.pieces_jointes || []}
          isAgency={true}
          agencySlug={slug}
          onClose={() => setBailPieces(null)}
          onRefresh={() => {
            if (onRefresh) onRefresh()
          }}
        />
      )}
    </>
  )
}

