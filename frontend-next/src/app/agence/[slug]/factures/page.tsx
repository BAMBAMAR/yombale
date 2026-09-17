'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import {
  FileText,
  Plus,
  CheckCircle2,
  DollarSign,
  Check,
  Building2,
  Eye,
  Pencil,
  ExternalLink,
  Download,
  CheckCheck
} from 'lucide-react'
import ModalCreerFactureImmo from './components/ModalCreerFactureImmo'
import TableFacturesDesktop from './components/TableFacturesDesktop'
import ModalApercuFactureImmo from './components/ModalApercuFactureImmo'
import ModalEditerFactureImmo from './components/ModalEditerFactureImmo'
import { AgenceTableToolbar, SortOption } from '../../components/AgenceTableToolbar'
import { AgenceTableTh } from '../../components/AgenceTableTh'
import { AgenceBatchActionBar, BatchActionItem } from '../../components/AgenceBatchActionBar'
import { exportDataToCsv } from '@/lib/immo-csv-export'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

interface FactureItem {
  id: string
  numero_facture: string
  type_facture: string
  client_nom: string
  client_tel?: string
  client_email?: string
  bien_titre?: string
  montant_ht: number
  taux_tva: number
  montant_tva: number
  timbre_fiscal: number
  montant_ttc: number
  statut: string
  date_emission: string
  date_echeance?: string
  mode_paiement?: string
  notes?: string
}

interface BienOption {
  id: string
  titre: string
  prix_vente?: number
  prix_location?: number
}

const SORT_OPTIONS: SortOption[] = [
  { value: 'date_desc', label: 'Date d\'émission (récent)' },
  { value: 'date_asc', label: 'Date d\'émission (ancien)' },
  { value: 'montant_desc', label: 'Montant TTC le plus élevé' },
  { value: 'client_asc', label: 'Client (A - Z)' },
]

export default function AgenceFacturesPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [factures, setFactures] = useState<FactureItem[]>([])
  const [biens, setBiens] = useState<BienOption[]>([])
  const [loading, setLoading] = useState(true)

  // Filtres, Recherche, Tri
  const [searchTerm, setSearchTerm] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [filtreType, setFiltreType] = useState('tous')
  const [currentSort, setCurrentSort] = useState('date_desc')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Sélections & Batch
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isExecutingBatch, setIsExecutingBatch] = useState(false)

  // Modales
  const [showModalCreer, setShowModalCreer] = useState(false)
  const [selectedFacture, setSelectedFacture] = useState<FactureItem | null>(null)
  const [factureAEditer, setFactureAEditer] = useState<FactureItem | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  async function chargerDonnees() {
    try {
      setLoading(true)
      const headers = getImmoAuthHeaders()
      const [resFactures, resBiens] = await Promise.all([
        fetch(`/api/factures-immo/agence/${slug}`, { headers }),
        fetch(`/api/biens/agence/${slug}?statut=actif`, { headers }),
      ])
      const dataF = await resFactures.json()
      const dataB = await resBiens.json()
      if (dataF.success) setFactures(dataF.factures || [])
      if (dataB.success) setBiens(dataB.biens || [])
    } catch (err) {
      console.error('[LOAD_FACTURES_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) chargerDonnees()
  }, [slug])

  async function handleEncaisserFacture(factureId: string) {
    try {
      const res = await fetch(`/api/factures-immo/agence/${slug}/${factureId}/encaisser`, {
        method: 'PATCH',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ mode_paiement: 'wave' }),
      })
      const data = await res.json()
      if (data.success) {
        setToastMsg('Facture d\'honoraires marquée comme payée avec succès.')
        chargerDonnees()
        setTimeout(() => setToastMsg(null), 3000)
      }
    } catch (err) {
      console.error('[ENCAISSER_FACTURE_ERR]', err)
    }
  }

  // Filtrage et Tri
  const facturesFiltrees = useMemo(() => {
    let list = [...factures]

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      list = list.filter(
        f =>
          f.numero_facture.toLowerCase().includes(q) ||
          f.client_nom.toLowerCase().includes(q) ||
          (f.bien_titre && f.bien_titre.toLowerCase().includes(q))
      )
    }

    if (filtreStatut !== 'tous') {
      list = list.filter(f => f.statut === filtreStatut)
    }

    if (filtreType !== 'tous') {
      list = list.filter(f => f.type_facture === filtreType)
    }

    list.sort((a, b) => {
      let cmp = 0
      if (currentSort.startsWith('date')) {
        const dA = new Date(a.date_emission).getTime()
        const dB = new Date(b.date_emission).getTime()
        cmp = dB - dA
        if (currentSort === 'date_asc' || sortDirection === 'asc') cmp = -cmp
      } else if (currentSort.startsWith('montant')) {
        cmp = Number(b.montant_ttc || 0) - Number(a.montant_ttc || 0)
        if (sortDirection === 'asc') cmp = -cmp
      } else if (currentSort.startsWith('client')) {
        cmp = a.client_nom.localeCompare(b.client_nom)
        if (sortDirection === 'desc') cmp = -cmp
      }
      return cmp
    })

    return list
  }, [factures, searchTerm, filtreStatut, filtreType, currentSort, sortDirection])

  function handleToggleSelect(id: string) {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]))
  }

  function handleSelectAll() {
    if (selectedIds.length === facturesFiltrees.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(facturesFiltrees.map(f => f.id))
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

  async function handleBatchEncaisser() {
    if (!confirm(`Marquer payées les ${selectedIds.length} factures sélectionnées ?`)) return
    try {
      setIsExecutingBatch(true)
      const res = await fetch(`/api/factures-immo/agence/${slug}/batch-encaisser`, {
        method: 'PATCH',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ factureIds: selectedIds, mode_paiement: 'wave' }),
      })
      const data = await res.json()
      if (data.success) {
        setToastMsg(data.message || 'Factures encaissées.')
        setSelectedIds([])
        chargerDonnees()
        setTimeout(() => setToastMsg(null), 3500)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsExecutingBatch(false)
    }
  }

  function handleBatchExportCsv() {
    const items = selectedIds.length > 0 ? factures.filter(f => selectedIds.includes(f.id)) : facturesFiltrees
    exportDataToCsv('factures-honoraires-agence', [
      { header: 'N° Facture', key: 'numero_facture' },
      { header: 'Date Émission', key: 'date_emission' },
      { header: 'Client', key: 'client_nom' },
      { header: 'Bien Rattaché', key: 'bien_titre' },
      { header: 'Type Facture', key: 'type_facture' },
      { header: 'Montant HT FCFA', key: 'montant_ht' },
      { header: 'TVA FCFA', key: 'montant_tva' },
      { header: 'Montant TTC FCFA', key: 'montant_ttc' },
      { header: 'Statut', key: 'statut' },
    ], items)
  }

  const batchActions: BatchActionItem[] = [
    {
      id: 'encaisser',
      label: 'Marquer Payée(s)',
      icon: CheckCheck,
      onClick: handleBatchEncaisser,
      variant: 'primary',
    },
    {
      id: 'export_csv',
      label: 'Exporter CSV',
      icon: Download,
      onClick: handleBatchExportCsv,
    },
  ]

  const totalFacture = factures.reduce((sum, f) => sum + Number(f.montant_ttc || 0), 0)
  const totalEncaisse = factures.filter(f => f.statut === 'payee').reduce((sum, f) => sum + Number(f.montant_ttc || 0), 0)

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* ── En-tête ── */}
      <div className="agence-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="agence-title">Facturation & Honoraires d&apos;Agence</h1>
          <p className="agence-subtitle">
            Émission des factures professionnelles pour transactions, gestion, débours et expertises.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModalCreer(true)}
          className="agence-btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={16} />
          <span>Nouvelle Facture</span>
        </button>
      </div>

      {toastMsg && (
        <div style={{ padding: '12px 16px', background: '#DCFCE7', color: '#166534', borderRadius: 8, fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <CheckCircle2 size={18} />
          {toastMsg}
        </div>
      )}

      {/* ── KPIs ── */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div className="kpi-card">
          <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>Total Facturé (TTC)</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            {Number(totalFacture).toLocaleString('fr-FR')} FCFA
          </div>
          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>{factures.length} facture(s) émise(s)</div>
        </div>

        <div className="kpi-card" style={{ border: '1px solid #BBF7D0' }}>
          <div style={{ fontSize: 12, color: '#166534', fontWeight: 600, marginBottom: 4 }}>Total Encaissé</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#166534' }}>
            {Number(totalEncaisse).toLocaleString('fr-FR')} FCFA
          </div>
          <div style={{ fontSize: 11.5, color: '#166534', marginTop: 2 }}>
            {factures.filter(f => f.statut === 'payee').length} facture(s) réglée(s)
          </div>
        </div>
      </div>

      {/* ── Toolbar : Recherche, Tri & Filtres ── */}
      <AgenceTableToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Rechercher par n° facture, nom client, bien..."
        sortOptions={SORT_OPTIONS}
        currentSort={currentSort}
        onSortChange={setCurrentSort}
        sortDirection={sortDirection}
        onToggleSortDirection={() => setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'))}
        totalCount={factures.length}
        filteredCount={facturesFiltrees.length}
        hasActiveFilters={Boolean(searchTerm || filtreStatut !== 'tous' || filtreType !== 'tous')}
        onResetFilters={() => {
          setSearchTerm('')
          setFiltreStatut('tous')
          setFiltreType('tous')
        }}
      >
        <select
          value={filtreStatut}
          onChange={e => setFiltreStatut(e.target.value)}
          className="form-select"
          style={{ width: 'auto', padding: '6px 10px', fontSize: 12.5 }}
        >
          <option value="tous">Tous statuts de paiement</option>
          <option value="payee">Payée</option>
          <option value="emise">Émise (en attente)</option>
          <option value="annulee">Annulée</option>
        </select>

        <select
          value={filtreType}
          onChange={e => setFiltreType(e.target.value)}
          className="form-select"
          style={{ width: 'auto', padding: '6px 10px', fontSize: 12.5 }}
        >
          <option value="tous">Toutes les natures de facture</option>
          <option value="honoraires_vente">Honoraires Vente</option>
          <option value="gestion_locative">Gestion Locative</option>
          <option value="honoraires_location">Rédaction Bail</option>
          <option value="debours_travaux">Débours Travaux</option>
        </select>

        {facturesFiltrees.length > 0 && (
          <button
            type="button"
            onClick={handleSelectAll}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid var(--border, #E8DDD2)',
              background: selectedIds.length === facturesFiltrees.length ? 'var(--navy, #1C2B4A)' : '#fff',
              color: selectedIds.length === facturesFiltrees.length ? '#fff' : 'var(--navy, #1C2B4A)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {selectedIds.length === facturesFiltrees.length ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
        )}
      </AgenceTableToolbar>

      {/* ── Tableau des Factures ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
          <p>Chargement des factures...</p>
        </div>
      ) : facturesFiltrees.length === 0 ? (
        <div className="agence-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
          <FileText size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontSize: 16 }}>Aucune facture trouvée</p>
          <p style={{ fontSize: 13.5 }}>Modifiez votre recherche ou émettez une nouvelle facture d&apos;honoraires.</p>
        </div>
      ) : (
        <TableFacturesDesktop
          factures={facturesFiltrees}
          slug={slug}
          selectedIds={selectedIds}
          currentSort={currentSort}
          sortDirection={sortDirection}
          onSortColumn={handleSortColumn}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onSelectFacture={setSelectedFacture}
          onEncaisserFacture={handleEncaisserFacture}
        />
      )}


      {/* ── Barre d'Actions par Lot ── */}
      <AgenceBatchActionBar
        selectedCount={selectedIds.length}
        totalCount={facturesFiltrees.length}
        onClearSelection={() => setSelectedIds([])}
        actions={batchActions}
        isExecuting={isExecutingBatch}
        labelSingulier="facture sélectionnée"
        labelPluriel="factures sélectionnées"
      />

      {/* Modales */}
      {showModalCreer && (
        <ModalCreerFactureImmo
          slug={slug}
          biens={biens}
          onClose={() => setShowModalCreer(false)}
          onSuccess={() => {
            setShowModalCreer(false)
            setToastMsg('Facture créée avec succès.')
            chargerDonnees()
            setTimeout(() => setToastMsg(null), 3000)
          }}
        />
      )}

      {selectedFacture && (
        <ModalApercuFactureImmo
          slug={slug}
          facture={selectedFacture}
          onClose={() => setSelectedFacture(null)}
          onEncaisser={handleEncaisserFacture}
        />
      )}
    </div>
  )
}
