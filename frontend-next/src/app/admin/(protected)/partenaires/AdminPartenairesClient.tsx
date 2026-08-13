'use client'

import { useState, useTransition } from 'react'
import { modererPartenaire, supprimerPartenaire, batchModererPartenaires } from '@/app/actions/admin'
import BatchActionBar, { BatchActionConfig } from '@/components/admin/BatchActionBar'

interface Partenaire {
  id: string
  nom_entreprise: string
  secteur: string | null
  contact_nom: string | null
  contact_tel: string | null
  email: string | null
  description: string | null
  statut: string
  created_at: string
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('fr-SN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function PartenaireRow({
  demande,
  isSelected,
  onToggleSelect,
  onAction
}: {
  demande: Partenaire
  isSelected: boolean
  onToggleSelect: () => void
  onAction: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(false)

  function handleAction(statut: 'approuve' | 'rejete') {
    startTransition(async () => {
      await modererPartenaire(demande.id, statut)
      onAction()
    })
  }

  function handleSupprimer() {
    if (!window.confirm('Supprimer cette demande de partenariat ?')) return
    startTransition(async () => {
      await supprimerPartenaire(demande.id)
      onAction()
    })
  }

  return (
    <div className={`admin-annonce-row${pending ? ' admin-annonce-row--loading' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ padding: '0 0 0 12px', display: 'flex', alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }}
        />
      </div>
      <div className="admin-annonce-thumb">
        <div className="admin-annonce-img admin-annonce-img--vide" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
          🤝
        </div>
      </div>
      <div className="admin-annonce-info" style={{ flex: 1 }}>
        <p className="admin-annonce-titre">{demande.nom_entreprise}</p>
        <p className="admin-annonce-meta">
          {demande.secteur || 'Secteur non précisé'}
          {demande.contact_nom ? ` · ${demande.contact_nom}` : ''}
          {demande.contact_tel ? ` · ${demande.contact_tel}` : ''}
        </p>
        {demande.email && (
          <p className="admin-annonce-meta">
            <a href={`mailto:${demande.email}`} style={{ color: 'var(--accent)' }}>{demande.email}</a>
          </p>
        )}
        <p className="admin-annonce-date">{formatDate(demande.created_at)}</p>
        {demande.description && (
          <>
            <button
              type="button"
              className="admin-annonce-voir-btn"
              onClick={() => setExpanded(e => !e)}
            >
              {expanded ? '▲ Masquer' : '▼ Voir description'}
            </button>
            {expanded && (
              <div className="admin-annonce-details">
                <p className="admin-annonce-desc">{demande.description}</p>
              </div>
            )}
          </>
        )}
      </div>
      <div className="admin-annonce-statut-col">
        <span className="admin-annonce-statut admin-annonce-statut--attente">En attente</span>
      </div>
      <div className="admin-annonce-actions" style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => handleAction('approuve')}
          disabled={pending}
          className="admin-btn admin-btn--approuver"
        >
          Approuver
        </button>
        <button
          onClick={() => handleAction('rejete')}
          disabled={pending}
          className="admin-btn admin-btn--rejeter"
        >
          Rejeter
        </button>
        <button
          onClick={handleSupprimer}
          disabled={pending}
          className="admin-btn admin-btn--rejeter"
          style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}
        >
          🗑️ Supprimer
        </button>
      </div>
    </div>
  )
}

export default function AdminPartenairesClient({ demandes }: { demandes: Partenaire[] }) {
  const [, startTransition] = useTransition()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loadingBatch, setLoadingBatch] = useState(false)

  function refresh() {
    startTransition(() => { window.location.reload() })
  }

  const allIds = demandes.map(d => d.id)
  const allSelected = allIds.length > 0 && selectedIds.length === allIds.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(allIds)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleBatchApprouver = async () => {
    setLoadingBatch(true)
    try {
      await batchModererPartenaires(selectedIds, 'approuver')
      setSelectedIds([])
      refresh()
    } finally {
      setLoadingBatch(false)
    }
  }

  const handleBatchRejeter = async () => {
    setLoadingBatch(true)
    try {
      await batchModererPartenaires(selectedIds, 'rejeter')
      setSelectedIds([])
      refresh()
    } finally {
      setLoadingBatch(false)
    }
  }

  const handleBatchSupprimer = async () => {
    setLoadingBatch(true)
    try {
      await batchModererPartenaires(selectedIds, 'supprimer')
      setSelectedIds([])
      refresh()
    } finally {
      setLoadingBatch(false)
    }
  }

  const batchActions: BatchActionConfig[] = [
    {
      key: 'approuver',
      label: 'Approuver les demandes',
      icon: '🟢',
      color: 'green',
      onClick: handleBatchApprouver,
    },
    {
      key: 'rejeter',
      label: 'Rejeter les demandes',
      icon: '🔴',
      color: 'amber',
      onClick: handleBatchRejeter,
    },
    {
      key: 'supprimer',
      label: 'Supprimer définitivement',
      icon: '🗑️',
      color: 'red',
      confirmMsg: 'Êtes-vous sûr de vouloir supprimer définitivement ces demandes de partenariat ?',
      onClick: handleBatchSupprimer,
    },
  ]

  if (demandes.length === 0) {
    return <p className="admin-empty">Aucune demande de partenariat en attente. ✓</p>
  }

  return (
    <div className="admin-annonces-sections">
      <BatchActionBar
        selectedCount={selectedIds.length}
        totalCount={demandes.length}
        allSelected={allSelected}
        onToggleSelectAll={toggleSelectAll}
        onClearSelection={() => setSelectedIds([])}
        actions={batchActions}
        loading={loadingBatch}
        itemLabel="demande(s)"
      />

      <section className="admin-annonces-section">
        <h2 className="admin-section-titre admin-section-titre--orange">
          Demandes à traiter
          <span className="admin-section-count">{demandes.length}</span>
        </h2>
        <div className="admin-annonces-list">
          {demandes.map(d => (
            <PartenaireRow
              key={d.id}
              demande={d}
              isSelected={selectedIds.includes(d.id)}
              onToggleSelect={() => toggleSelect(d.id)}
              onAction={refresh}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
