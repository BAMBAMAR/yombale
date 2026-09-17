'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import {
  FileSignature,
  Plus,
  Sparkles,
  Download,
  XCircle,
  Archive
} from 'lucide-react'
import { ModalCreerMandat } from './components/ModalCreerMandat'
import TableMandatsDesktop, { MandatItem } from './components/TableMandatsDesktop'
import AgenceTableToolbar, { SortOption } from '@/app/agence/components/AgenceTableToolbar'
import AgenceBatchActionBar, { BatchAction } from '@/app/agence/components/AgenceBatchActionBar'
import { exportToCsv } from '@/lib/immo-csv-export'
import { getImmoAuthHeaders, getImmoAuthToken } from '@/lib/immo-auth'

const SORT_OPTIONS: SortOption[] = [
  { value: 'date_fin', label: 'Date d’expiration' },
  { value: 'date_debut', label: 'Date de début' },
  { value: 'bien_titre', label: 'Bien immobilier' },
  { value: 'proprietaire_nom', label: 'Propriétaire' },
  { value: 'taux_commission', label: 'Commission' },
]

export default function AgenceMandatsPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [mandats, setMandats] = useState<MandatItem[]>([])
  const [stats, setStats] = useState<any>({})
  const [biens, setBiens] = useState<any[]>([])
  const [proprietaires, setProprietaires] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const [filterStatut, setFilterStatut] = useState('tous')
  const [filterType, setFilterType] = useState('tous')
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('date_fin')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchLoading, setBatchLoading] = useState(false)

  const token = getImmoAuthToken()

  async function chargerDonnees() {
    try {
      setLoading(true)
      const headers = getImmoAuthHeaders()

      const [resMandats, resStats, resBiens, resProps] = await Promise.all([
        fetch(`/api/mandats-immo/agence/${slug}?statut=tous&type_mandat=tous`, { headers }),
        fetch(`/api/mandats-immo/agence/${slug}/stats`, { headers }),
        fetch(`/api/biens/agence/${slug}?statut=actif`, { headers }),
        fetch(`/api/crm-immo/agence/${slug}/proprietaires`, { headers }),
      ])

      const [dM, dS, dB, dP] = await Promise.all([
        resMandats.json(),
        resStats.json(),
        resBiens.json(),
        resProps.json(),
      ])

      if (dM.success) setMandats(dM.mandats || [])
      if (dS.success) setStats(dS.stats || {})
      if (dB.success) setBiens(dB.biens || [])
      if (dP.success) setProprietaires(dP.proprietaires || [])
    } catch (err) {
      console.error('[LOAD_MANDATS_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) chargerDonnees()
  }, [slug])

  // Filtrage et Tri
  const filteredMandats = useMemo(() => {
    let list = mandats

    if (filterStatut !== 'tous') {
      list = list.filter((m) => m.statut === filterStatut)
    }

    if (filterType !== 'tous') {
      list = list.filter((m) => m.type_mandat === filterType)
    }

    if (search.trim()) {
      const s = search.toLowerCase()
      list = list.filter(
        (m) =>
          m.bien_titre?.toLowerCase().includes(s) ||
          m.proprietaire_nom?.toLowerCase().includes(s) ||
          m.proprietaire_telephone?.toLowerCase().includes(s) ||
          m.bien_ville?.toLowerCase().includes(s) ||
          m.bien_quartier?.toLowerCase().includes(s)
      )
    }

    return [...list].sort((a, b) => {
      let valA: any = a[sortField as keyof MandatItem] || ''
      let valB: any = b[sortField as keyof MandatItem] || ''

      if (sortField === 'date_fin' || sortField === 'date_debut') {
        valA = valA ? new Date(valA).getTime() : 0
        valB = valB ? new Date(valB).getTime() : 0
      } else if (sortField === 'taux_commission') {
        valA = Number(valA) || 0
        valB = Number(valB) || 0
      } else {
        valA = String(valA).toLowerCase()
        valB = String(valB).toLowerCase()
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [mandats, filterStatut, filterType, search, sortField, sortOrder])

  // Sélection
  function toggleSelect(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  function toggleSelectAll() {
    if (filteredMandats.length > 0 && filteredMandats.every((m) => selectedIds.has(m.id))) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredMandats.map((m) => m.id)))
    }
  }

  // Actions groupées
  async function handleBatchAction(action: 'resilier' | 'archiver') {
    if (selectedIds.size === 0) return
    const count = selectedIds.size
    const label = action === 'resilier' ? 'résilier' : 'archiver'
    if (!confirm(`Voulez-vous ${label} ${count} mandat(s) sélectionné(s) ?`)) return

    try {
      setBatchLoading(true)
      const res = await fetch(`/api/mandats-immo/agence/${slug}/batch`, {
        method: 'POST',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ ids: Array.from(selectedIds), action }),
      })
      const data = await res.json()
      if (data.success) {
        setSelectedIds(new Set())
        chargerDonnees()
      } else {
        alert(data.error || 'Erreur lors de l’action groupée.')
      }
    } catch (err) {
      console.error('[BATCH_MANDATS_ERR]', err)
      alert('Erreur réseau lors de l’action groupée.')
    } finally {
      setBatchLoading(false)
    }
  }

  function handleExportCsv() {
    const dataToExport = mandats.filter((m) => selectedIds.has(m.id))
    exportToCsv(
      dataToExport.map((m) => ({
        'Bien': m.bien_titre,
        'Type Opération': m.type_operation,
        'Ville': m.bien_ville || '',
        'Quartier': m.bien_quartier || '',
        'Propriétaire': m.proprietaire_nom,
        'Téléphone': m.proprietaire_telephone || '',
        'Type Mandat': m.type_mandat,
        'Date Début': m.date_debut,
        'Date Fin': m.date_fin || 'Indéterminée',
        'Commission (%)': m.taux_commission || '',
        'Commission Fixe (FCFA)': m.montant_commission_fixe || '',
        'Statut': m.statut,
      })),
      `mandats-${slug}-${new Date().toISOString().slice(0, 10)}.csv`
    )
  }

  const batchActions: BatchAction[] = [
    {
      id: 'resilier',
      label: 'Résilier mandats',
      icon: <XCircle size={14} />,
      variant: 'danger',
      onClick: () => handleBatchAction('resilier'),
    },
    {
      id: 'archiver',
      label: 'Archiver mandats',
      icon: <Archive size={14} />,
      variant: 'secondary',
      onClick: () => handleBatchAction('archiver'),
    },
    {
      id: 'export',
      label: 'Exporter CSV',
      icon: <Download size={14} />,
      variant: 'secondary',
      onClick: handleExportCsv,
    },
  ]

  const activeFiltersCount = (filterStatut !== 'tous' ? 1 : 0) + (filterType !== 'tous' ? 1 : 0)

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileSignature size={24} color="var(--accent, #C75B00)" />
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--navy, #1C2B4A)' }}>
              Mandats de Gestion & Vente
            </h1>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0' }}>
            Gestion légale des mandats, exclusivités, honoraires et alertes d&apos;expiration
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--accent, #C75B00)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '9px 16px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          <span>Nouveau Mandat</span>
        </button>
      </div>

      {/* Grille KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={{ background: '#fff', padding: '14px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Mandats Actifs</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            {stats.total_actifs || 0}
          </div>
        </div>

        <div style={{ background: '#fff', padding: '14px 16px', borderRadius: 10, border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: 12, color: '#15803d', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Sparkles size={14} color="#15803d" />
            <span>Mandats Exclusifs</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#15803d' }}>
            {stats.total_exclusifs || 0}
          </div>
        </div>

        <div style={{ background: '#fff', padding: '14px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Vente / Location</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#334155', marginTop: 4 }}>
            {stats.total_vente || 0} vente · {stats.total_location || 0} loc.
          </div>
        </div>

        <div style={{ background: stats.expirant_30j > 0 ? '#fffbeb' : '#fff', padding: '14px 16px', borderRadius: 10, border: stats.expirant_30j > 0 ? '1px solid #fde68a' : '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, color: stats.expirant_30j > 0 ? '#b45309' : '#64748b', fontWeight: 600, marginBottom: 4 }}>
            Expirant sous 30j
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: stats.expirant_30j > 0 ? '#b45309' : '#334155' }}>
            {stats.expirant_30j || 0}
          </div>
        </div>
      </div>

      {/* Barre d'outils Recherche, Tri, Filtres */}
      <AgenceTableToolbar
        searchPlaceholder="Rechercher par bien, propriétaire, ville..."
        searchValue={search}
        onSearchChange={setSearch}
        sortOptions={SORT_OPTIONS}
        sortField={sortField}
        sortOrder={sortOrder}
        onSortFieldChange={setSortField}
        onSortOrderToggle={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
        activeFiltersCount={activeFiltersCount}
        onResetFilters={() => {
          setSearch('')
          setFilterStatut('tous')
          setFilterType('tous')
        }}
        totalResults={filteredMandats.length}
        resultsLabel="mandat"
        filterSlot={
          <>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
                fontSize: 13,
                background: '#FFFFFF',
                color: 'var(--navy, #1C2B4A)',
              }}
            >
              <option value="tous">Statut : Tous</option>
              <option value="actif">En vigueur</option>
              <option value="expire">Expirés</option>
              <option value="resilie">Résiliés</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
                fontSize: 13,
                background: '#FFFFFF',
                color: 'var(--navy, #1C2B4A)',
              }}
            >
              <option value="tous">Type : Tous</option>
              <option value="simple">Mandats Simples</option>
              <option value="exclusif">Mandats Exclusifs</option>
              <option value="co_exclusif">Co-exclusifs</option>
            </select>
          </>
        }
      />

      {/* Tableau des mandats */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
            Chargement des mandats…
          </div>
        ) : filteredMandats.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <FileSignature size={40} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#334155', margin: 0 }}>Aucun mandat trouvé</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 16px' }}>
              Modifiez vos critères ou enregistrez vos mandats de vente et de gestion.
            </p>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--accent, #C75B00)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Plus size={14} />
              <span>Créer le premier mandat</span>
            </button>
          </div>
        ) : (
          <TableMandatsDesktop
            mandats={filteredMandats}
            slug={slug}
            token={token}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            sortField={sortField}
            sortOrder={sortOrder}
            onSortChange={(field) => {
              if (sortField === field) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
              else {
                setSortField(field)
                setSortOrder('asc')
              }
            }}
          />
        )}
      </div>

      {/* Barre d'actions groupées */}
      <AgenceBatchActionBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        actions={batchActions}
        loading={batchLoading}
      />

      {showModal && (
        <ModalCreerMandat
          slug={slug}
          biens={biens}
          proprietaires={proprietaires}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            chargerDonnees()
          }}
        />
      )}
    </div>
  )
}
