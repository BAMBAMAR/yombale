'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import {
  Wrench,
  Plus,
  CheckCircle2,
  Check,
  Download,
  Play
} from 'lucide-react'
import ModalNouveauTicket, { BienOption } from './components/ModalNouveauTicket'
import TicketMaintenanceCard, { TicketItem } from './components/TicketMaintenanceCard'
import AgenceTableToolbar, { SortOption } from '@/app/agence/components/AgenceTableToolbar'
import AgenceBatchActionBar, { BatchAction } from '@/app/agence/components/AgenceBatchActionBar'
import { exportToCsv } from '@/lib/immo-csv-export'
import { getImmoAuthHeaders } from '@/lib/immo-auth'
import { showToast } from '@/context/ToastContext'

const SORT_OPTIONS: SortOption[] = [
  { value: 'date_signal', label: 'Date de signalement' },
  { value: 'priorite', label: 'Priorité' },
  { value: 'cout_estime', label: 'Coût estimé' },
  { value: 'bien_titre', label: 'Bien immobilier' },
]

export default function AgenceMaintenancePage() {
  const params = useParams()
  const slug = params?.slug as string

  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [biens, setBiens] = useState<BienOption[]>([])
  const [loading, setLoading] = useState(true)
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [filtrePriorite, setFiltrePriorite] = useState('tous')
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('date_signal')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchLoading, setBatchLoading] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  async function chargerDonnees() {
    try {
      setLoading(true)
      const [resTickets, resBiens] = await Promise.all([
        fetch(`/api/locatif-immo/agence/${slug}/maintenance`, { headers: getImmoAuthHeaders() }),
        fetch(`/api/biens/agence/${slug}?statut=actif`, { headers: getImmoAuthHeaders() }),
      ])
      const dataT = await resTickets.json()
      const dataB = await resBiens.json()

      if (dataT.success) setTickets(dataT.tickets || [])
      if (dataB.success && dataB.biens) setBiens(dataB.biens)
    } catch (err) {
      console.error('[LOAD_MAINTENANCE_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) chargerDonnees()
  }, [slug])

  async function handleChangerStatut(ticketId: string, nouveauStatut: string) {
    try {
      const res = await fetch(`/api/locatif-immo/agence/${slug}/maintenance/${ticketId}`, {
        method: 'PATCH',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ statut: nouveauStatut }),
      })
      const data = await res.json()
      if (data.success) {
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, statut: nouveauStatut } : t))
        )
      }
    } catch (err) {
      console.error('[UPDATE_TICKET_STATUS_ERR]', err)
    }
  }

  // Filtrage et Tri
  const ticketsFiltres = useMemo(() => {
    let list = tickets

    if (filtreStatut !== 'tous') {
      list = list.filter((t) => t.statut === filtreStatut)
    }

    if (filtrePriorite !== 'tous') {
      list = list.filter((t) => t.priorite === filtrePriorite)
    }

    if (search.trim()) {
      const s = search.toLowerCase()
      list = list.filter(
        (t) =>
          t.bien_titre?.toLowerCase().includes(s) ||
          t.bien_ville?.toLowerCase().includes(s) ||
          t.bien_quartier?.toLowerCase().includes(s) ||
          t.description?.toLowerCase().includes(s) ||
          t.type?.toLowerCase().includes(s) ||
          t.technicien?.toLowerCase().includes(s) ||
          t.demandeur?.toLowerCase().includes(s)
      )
    }

    return [...list].sort((a, b) => {
      let valA: any = a[sortField as keyof TicketItem] || ''
      let valB: any = b[sortField as keyof TicketItem] || ''

      if (sortField === 'date_signal') {
        valA = new Date(valA).getTime() || 0
        valB = new Date(valB).getTime() || 0
      } else if (sortField === 'cout_estime') {
        valA = Number(valA) || 0
        valB = Number(valB) || 0
      } else if (sortField === 'priorite') {
        const orderMap: Record<string, number> = { urgente: 3, normale: 2, basse: 1 }
        valA = orderMap[valA] || 0
        valB = orderMap[valB] || 0
      } else {
        valA = String(valA).toLowerCase()
        valB = String(valB).toLowerCase()
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [tickets, filtreStatut, filtrePriorite, search, sortField, sortOrder])

  // Sélection
  function toggleSelect(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  function toggleSelectAll() {
    if (ticketsFiltres.length > 0 && ticketsFiltres.every((t) => selectedIds.has(t.id))) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(ticketsFiltres.map((t) => t.id)))
    }
  }

  // Actions groupées
  async function handleBatchStatut(nouveauStatut: 'resolu' | 'en_cours') {
    if (selectedIds.size === 0) return
    const count = selectedIds.size
    const label = nouveauStatut === 'resolu' ? 'marquer comme résolu(s)' : 'démarrer les travaux pour'
    if (!confirm(`Voulez-vous ${label} ${count} ticket(s) sélectionné(s) ?`)) return

    try {
      setBatchLoading(true)
      const res = await fetch(`/api/locatif-immo/agence/${slug}/maintenance/batch-statut`, {
        method: 'PATCH',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ ticketIds: Array.from(selectedIds), statut: nouveauStatut }),
      })
      const data = await res.json()
      if (data.success) {
        setSelectedIds(new Set())
        chargerDonnees()
        showToast(`${count} ticket(s) mis à jour vers "${nouveauStatut}".`, 'success', 'Maintenance')
        setToastMsg(`${count} ticket(s) mis à jour vers "${nouveauStatut}".`)
        setTimeout(() => setToastMsg(null), 4000)
      } else {
        showToast(data.error || 'Erreur lors de la mise à jour groupée.', 'error', 'Maintenance')
      }
    } catch (err) {
      console.error('[BATCH_MAINTENANCE_ERR]', err)
      showToast('Erreur réseau lors de la mise à jour groupée.', 'error', 'Réseau')
    } finally {
      setBatchLoading(false)
    }
  }

  function handleExportCsv() {
    const dataToExport = tickets.filter((t) => selectedIds.has(t.id))
    exportToCsv(
      dataToExport.map((t) => ({
        'Bien': t.bien_titre,
        'Ville': t.bien_ville || '',
        'Quartier': t.bien_quartier || '',
        'Type': t.type,
        'Priorité': t.priorite,
        'Statut': t.statut,
        'Description': t.description,
        'Demandeur': t.demandeur,
        'Prise en charge': t.a_charge_de,
        'Coût estimé (FCFA)': t.cout_estime || 0,
        'Prestataire': t.technicien || '',
        'Date signalement': t.date_signal,
      })),
      `maintenance-${slug}-${new Date().toISOString().slice(0, 10)}.csv`
    )
  }

  const batchActions: BatchAction[] = [
    {
      id: 'en_cours',
      label: 'Démarrer travaux',
      icon: <Play size={14} />,
      variant: 'secondary',
      onClick: () => handleBatchStatut('en_cours'),
    },
    {
      id: 'resolu',
      label: 'Marquer résolu(s)',
      icon: <Check size={14} />,
      variant: 'primary',
      onClick: () => handleBatchStatut('resolu'),
    },
    {
      id: 'export',
      label: 'Exporter CSV',
      icon: <Download size={14} />,
      variant: 'secondary',
      onClick: handleExportCsv,
    },
  ]

  const allSelected = ticketsFiltres.length > 0 && ticketsFiltres.every((t) => selectedIds.has(t.id))
  const someSelected = ticketsFiltres.some((t) => selectedIds.has(t.id))
  const activeFiltersCount = (filtreStatut !== 'tous' ? 1 : 0) + (filtrePriorite !== 'tous' ? 1 : 0)

  return (
    <div>
      {/* ── En-tête ── */}
      <div className="agence-header">
        <div>
          <h1 className="agence-title">Maintenance & Travaux</h1>
          <p className="agence-subtitle">Gestion des incidents locatifs, réparations, artisans et imputations de coûts.</p>
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
          Signaler un incident
        </button>
      </div>

      {toastMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#DCFCE7',
            color: '#166534',
            borderRadius: 8,
            fontSize: 13.5,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <CheckCircle2 size={18} />
          {toastMsg}
        </div>
      )}

      {/* ── Barre d'outils (Recherche, Tri, Filtres) ── */}
      <AgenceTableToolbar
        searchPlaceholder="Rechercher incident, bien, technicien, quartier..."
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
          setFiltreStatut('tous')
          setFiltrePriorite('tous')
        }}
        totalResults={ticketsFiltres.length}
        resultsLabel="ticket"
        filterSlot={
          <>
            <select
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
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
              <option value="signale">Signalé</option>
              <option value="en_cours">En cours</option>
              <option value="resolu">Résolu</option>
            </select>

            <select
              value={filtrePriorite}
              onChange={(e) => setFiltrePriorite(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
                fontSize: 13,
                background: '#FFFFFF',
                color: 'var(--navy, #1C2B4A)',
              }}
            >
              <option value="tous">Priorité : Toutes</option>
              <option value="urgente">Urgente</option>
              <option value="normale">Normale</option>
              <option value="basse">Basse</option>
            </select>
          </>
        }
      />

      {/* ── Option Sélection Rapide ── */}
      {ticketsFiltres.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', color: 'var(--navy, #1C2B4A)' }}>
            <input
              type="checkbox"
              className="immo-checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = !allSelected && someSelected
              }}
              onChange={toggleSelectAll}
            />
            <span>Tout sélectionner ({ticketsFiltres.length})</span>
          </label>
        </div>
      )}

      {/* ── Grille des Tickets ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
          <p>Chargement des incidents...</p>
        </div>
      ) : ticketsFiltres.length === 0 ? (
        <div className="agence-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
          <Wrench size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontSize: 16 }}>Aucun incident trouvé</p>
          <p style={{ fontSize: 13.5 }}>Modifiez vos critères de recherche ou signalez un nouvel incident.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {ticketsFiltres.map((ticket) => (
            <TicketMaintenanceCard
              key={ticket.id}
              ticket={ticket}
              isSelected={selectedIds.has(ticket.id)}
              onToggleSelect={toggleSelect}
              onChangerStatut={handleChangerStatut}
            />
          ))}
        </div>
      )}

      {/* ── Barre d'actions groupées ── */}
      <AgenceBatchActionBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        actions={batchActions}
        loading={batchLoading}
      />

      {/* ── Modale Nouveau Ticket (Modulaire) ── */}
      <ModalNouveauTicket
        slug={slug}
        isOpen={showModal}
        biens={biens}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          setShowModal(false)
          setToastMsg('Incident / Travail enregistré avec succès.')
          chargerDonnees()
          setTimeout(() => setToastMsg(null), 4000)
        }}
      />
    </div>
  )
}
