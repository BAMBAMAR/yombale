'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import {
  Calendar,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Download
} from 'lucide-react'
import SectionDemandesVisite from './components/SectionDemandesVisite'
import ModalConfirmerVisite from './components/ModalConfirmerVisite'
import { ModalProgrammerVisite, OptionItem } from './components/ModalProgrammerVisite'
import VisitesTabs from './components/VisitesTabs'
import VisiteCardMobile from './components/VisiteCardMobile'
import TableVisitesDesktop, { Visite } from './components/TableVisitesDesktop'
import AgenceTableToolbar, { SortOption } from '@/app/agence/components/AgenceTableToolbar'
import AgenceBatchActionBar, { BatchAction } from '@/app/agence/components/AgenceBatchActionBar'
import { exportToCsv } from '@/lib/immo-csv-export'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

const SORT_OPTIONS: SortOption[] = [
  { value: 'date_visite', label: 'Date de visite' },
  { value: 'contact_nom', label: 'Prospect (A-Z)' },
  { value: 'bien_titre', label: 'Bien immobilier' },
  { value: 'statut', label: 'Statut' },
]

export default function VisitesPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [visites, setVisites] = useState<Visite[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDate, setFilterDate] = useState('tous')
  const [filterStatut, setFilterStatut] = useState('tous')
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('date_visite')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchLoading, setBatchLoading] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [ongletActif, setOngletActif] = useState<'agenda' | 'demandes'>('agenda')
  const [visiteAConfirmer, setVisiteAConfirmer] = useState<any | null>(null)

  // Options pour le formulaire
  const [biensOptions, setBiensOptions] = useState<OptionItem[]>([])
  const [contactsOptions, setContactsOptions] = useState<OptionItem[]>([])

  async function chargerVisites() {
    try {
      setLoading(true)
      let url = `/api/crm-immo/agence/${slug}/visites`
      if (filterDate !== 'tous') url += `?date=${filterDate}`
      const res = await fetch(url, { headers: getImmoAuthHeaders() })
      const data = await res.json()
      if (data.success) {
        setVisites(data.visites || [])
      }
    } catch (err) {
      console.error('[LOAD_VISITES_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  async function chargerOptions() {
    try {
      const [resBiens, resContacts] = await Promise.all([
        fetch(`/api/biens/agence/${slug}?statut=actif`, { headers: getImmoAuthHeaders() }),
        fetch(`/api/crm-immo/agence/${slug}/contacts`, { headers: getImmoAuthHeaders() }),
      ])
      const dataBiens = await resBiens.json()
      const dataContacts = await resContacts.json()
      if (dataBiens.success) setBiensOptions(dataBiens.biens || [])
      if (dataContacts.success) setContactsOptions(dataContacts.contacts || [])
    } catch (err) {
      console.error('[LOAD_OPTIONS_ERR]', err)
    }
  }

  useEffect(() => {
    if (slug) {
      chargerVisites()
      chargerOptions()
    }
  }, [slug, filterDate])

  async function updateStatut(visiteId: string, statut: string) {
    try {
      await fetch(`/api/crm-immo/agence/${slug}/visites/${visiteId}`, {
        method: 'PUT',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ statut }),
      })
      chargerVisites()
    } catch (err) {
      console.error('[UPDATE_VISITE_ERR]', err)
    }
  }

  // Filtrage et Tri
  const filteredVisites = useMemo(() => {
    let list = visites.filter((v) => v.statut !== 'demande')

    if (filterStatut !== 'tous') {
      list = list.filter((v) => v.statut === filterStatut)
    }

    if (search.trim()) {
      const s = search.toLowerCase()
      list = list.filter(
        (v) =>
          v.contact_nom?.toLowerCase().includes(s) ||
          v.contact_prenom?.toLowerCase().includes(s) ||
          v.contact_tel?.toLowerCase().includes(s) ||
          v.bien_titre?.toLowerCase().includes(s) ||
          v.bien_ville?.toLowerCase().includes(s) ||
          v.bien_quartier?.toLowerCase().includes(s) ||
          v.agent_nom?.toLowerCase().includes(s)
      )
    }

    return [...list].sort((a, b) => {
      let valA: any = a[sortField as keyof Visite] || ''
      let valB: any = b[sortField as keyof Visite] || ''
      if (sortField === 'date_visite') {
        valA = new Date(valA).getTime() || 0
        valB = new Date(valB).getTime() || 0
      } else {
        valA = String(valA).toLowerCase()
        valB = String(valB).toLowerCase()
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [visites, filterStatut, search, sortField, sortOrder])

  // Sélection
  function toggleSelect(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  function toggleSelectAll() {
    if (filteredVisites.length > 0 && filteredVisites.every((v) => selectedIds.has(v.id))) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredVisites.map((v) => v.id)))
    }
  }

  // Actions groupées
  async function handleBatchStatut(statut: 'realisee' | 'annulee') {
    if (selectedIds.size === 0) return
    const count = selectedIds.size
    const actionLabel = statut === 'realisee' ? 'marquer comme réalisée(s)' : 'annuler'
    if (!confirm(`Voulez-vous ${actionLabel} ${count} visite(s) sélectionnée(s) ?`)) return

    try {
      setBatchLoading(true)
      const res = await fetch(`/api/crm-immo/agence/${slug}/visites/batch-statut`, {
        method: 'PUT',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ visiteIds: Array.from(selectedIds), statut }),
      })
      const data = await res.json()
      if (data.success) {
        setSelectedIds(new Set())
        chargerVisites()
      } else {
        alert(data.error || 'Erreur lors de la mise à jour groupée.')
      }
    } catch (err) {
      console.error('[BATCH_VISITES_ERR]', err)
      alert('Erreur réseau lors de la mise à jour.')
    } finally {
      setBatchLoading(false)
    }
  }

  function handleExportCsv() {
    const dataToExport = visites.filter((v) => selectedIds.has(v.id))
    exportToCsv(
      dataToExport.map((v) => ({
        'Date & Heure': v.date_visite,
        'Durée (min)': v.duree_min,
        'Bien': v.bien_titre,
        'Ville': v.bien_ville,
        'Quartier': v.bien_quartier || '',
        'Prospect': `${v.contact_nom} ${v.contact_prenom || ''}`.trim(),
        'Téléphone': v.contact_tel || '',
        'Statut': v.statut,
        'Agent': v.agent_nom || '',
      })),
      `visites-${slug}-${new Date().toISOString().slice(0, 10)}.csv`
    )
  }

  const batchActions: BatchAction[] = [
    {
      id: 'realisee',
      label: 'Marquer réalisée(s)',
      icon: <CheckCircle2 size={15} />,
      variant: 'primary',
      onClick: () => handleBatchStatut('realisee'),
    },
    {
      id: 'annulee',
      label: 'Annuler',
      icon: <XCircle size={15} />,
      variant: 'danger',
      onClick: () => handleBatchStatut('annulee'),
    },
    {
      id: 'export',
      label: 'Exporter CSV',
      icon: <Download size={15} />,
      variant: 'secondary',
      onClick: handleExportCsv,
    },
  ]

  const activeFiltersCount = (filterStatut !== 'tous' ? 1 : 0) + (filterDate !== 'tous' ? 1 : 0)

  return (
    <div>
      {/* ── En-tête ── */}
      <div className="agence-header">
        <div>
          <h1 className="agence-title">Agenda des Visites</h1>
          <p className="agence-subtitle">Planifiez et suivez les visites des biens avec vos prospects.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="btn-npl"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 8,
            background: 'var(--accent, #C75B00)',
            color: '#FFFFFF',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Plus size={18} />
          Programmer une visite
        </button>
      </div>

      {/* ── Onglets Principaux ── */}
      <VisitesTabs
        ongletActif={ongletActif}
        onSelectOnglet={setOngletActif}
        totalAgenda={visites.filter((v) => v.statut !== 'demande').length}
        totalDemandes={visites.filter((v) => v.statut === 'demande').length}
      />


      {ongletActif === 'demandes' ? (
        <SectionDemandesVisite
          demandes={visites.filter((v) => v.statut === 'demande') as any}
          onConfirmer={(v) => setVisiteAConfirmer(v)}
          onDecliner={(id) => updateStatut(id, 'annulee')}
        />
      ) : (
        <>
          {/* ── Toolbar Recherche, Tri & Filtres ── */}
          <AgenceTableToolbar
            searchPlaceholder="Rechercher par prospect, bien, quartier, agent..."
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
              setFilterDate('tous')
            }}
            totalResults={filteredVisites.length}
            resultsLabel="visite"
            filterSlot={
              <>
                <select
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border, #E8DDD2)',
                    fontSize: 13,
                    background: '#FFFFFF',
                    color: 'var(--navy, #1C2B4A)',
                  }}
                >
                  <option value="tous">Période : Toutes</option>
                  <option value="aujourdhui">Aujourd'hui</option>
                  <option value="a_venir">À venir</option>
                </select>

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
                  <option value="confirmee">Confirmée</option>
                  <option value="realisee">Réalisée</option>
                  <option value="annulee">Annulée</option>
                </select>
              </>
            }
          />

          {/* ── Liste des Visites ── */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
              <p>Chargement des visites...</p>
            </div>
          ) : filteredVisites.length === 0 ? (
            <div className="agence-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
              <Calendar size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontSize: 16 }}>Aucune visite trouvée</p>
              <p style={{ fontSize: 13.5 }}>Modifiez vos filtres ou programmez votre premier rendez-vous.</p>
            </div>
          ) : (
            <>
              {/* ── Vue Mobile : Cartes Tactiles (< 768px) ── */}
              <div className="immo-mobile-only" style={{ flexDirection: 'column', gap: 10 }}>
                {filteredVisites.map((v) => (
                  <VisiteCardMobile
                    key={v.id}
                    visite={v}
                    onUpdateStatut={updateStatut}
                    isSelected={selectedIds.has(v.id)}
                    onToggleSelect={toggleSelect}
                  />
                ))}
              </div>

              {/* ── Vue Desktop : Tableau Complet (>= 768px) ── */}
              <TableVisitesDesktop
                visites={filteredVisites}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={toggleSelectAll}
                onUpdateStatut={updateStatut}
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
            </>
          )}
        </>
      )}

      {/* ── Barre d'actions groupées flottante ── */}
      <AgenceBatchActionBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        actions={batchActions}
        loading={batchLoading}
      />

      {/* ── Modale Confirmation de Visite ── */}
      {visiteAConfirmer && (
        <ModalConfirmerVisite
          slug={slug}
          visite={visiteAConfirmer}
          onClose={() => setVisiteAConfirmer(null)}
          onSuccess={() => {
            setVisiteAConfirmer(null)
            chargerVisites()
          }}
        />
      )}

      {/* ── Modale Programmation Visite (Modulaire) ── */}
      <ModalProgrammerVisite
        slug={slug}
        isOpen={showModal}
        biensOptions={biensOptions}
        contactsOptions={contactsOptions}
        onClose={() => setShowModal(false)}
        onSuccess={() => chargerVisites()}
      />
    </div>
  )
}
