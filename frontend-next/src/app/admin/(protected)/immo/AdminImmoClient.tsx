'use client'

import React, { useMemo, useState, useTransition } from 'react'
import { modererImmo, activerSponsoring, supprimerImmo, batchModererImmo } from '@/app/actions/admin'
import BatchActionBar, { BatchActionConfig } from '@/components/admin/BatchActionBar'
import ExternalImg from '@/components/ExternalImg'

interface AnnonceImmo {
  id: number
  titre: string
  type_bien: string | null
  transaction: string
  prix: number | null
  ville: string | null
  quartier: string | null
  surface_m2: number | null
  nb_pieces: number | null
  contact_tel: string
  contact_nom: string | null
  compte_nom?: string | null
  compte_email?: string | null
  actif: boolean
  rejete?: boolean
  motif_rejet?: string | null
  source: string
  demande_sponsorisation?: boolean
  created_at: string
  updated_at?: string
  photos?: string[] | null
}

type Tri = 'recent' | 'ancien' | 'prix_asc' | 'prix_desc'

function formatPrix(p: number | null) {
  if (!p) return '—'
  return new Intl.NumberFormat('fr-SN').format(p) + ' FCFA'
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('fr-SN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function statutClass(annonce: AnnonceImmo) {
  if (annonce.rejete) return 'admin-annonce-row--rejete'
  if (annonce.actif)  return 'admin-annonce-row--active'
  return 'admin-annonce-row--attente'
}

function StatutBadge({ annonce }: { annonce: AnnonceImmo }) {
  if (annonce.rejete) return <span className="admin-annonce-statut admin-annonce-statut--rejete">Rejetée</span>
  if (annonce.actif)  return <span className="admin-annonce-statut admin-annonce-statut--active">Active</span>
  return <span className="admin-annonce-statut admin-annonce-statut--attente">En attente</span>
}

function correspond(annonce: AnnonceImmo, q: string) {
  if (!q) return true
  const s = q.toLowerCase()
  return [
    annonce.titre, annonce.ville, annonce.quartier, annonce.contact_nom,
    annonce.contact_tel, annonce.compte_nom, annonce.compte_email,
  ].some(v => v && v.toLowerCase().includes(s))
}

function trier(annonces: AnnonceImmo[], tri: Tri) {
  const copie = [...annonces]
  switch (tri) {
    case 'ancien':    return copie.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    case 'prix_asc':  return copie.sort((a, b) => (a.prix ?? Infinity) - (b.prix ?? Infinity))
    case 'prix_desc': return copie.sort((a, b) => (b.prix ?? -Infinity) - (a.prix ?? -Infinity))
    case 'recent':
    default:          return copie.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
}

function ImmoRow({
  annonce,
  isSelected,
  onToggleSelect,
  onAction
}: {
  annonce: AnnonceImmo
  isSelected: boolean
  onToggleSelect: () => void
  onAction: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [showRejet, setShowRejet] = React.useState(false)
  const [motif, setMotif] = React.useState('')
  const [expanded, setExpanded] = React.useState(false)

  function handleValider() {
    startTransition(async () => {
      await modererImmo(annonce.id, true)
      onAction()
    })
  }

  function handleRejeter() {
    if (!motif.trim()) return
    startTransition(async () => {
      await modererImmo(annonce.id, false, motif.trim())
      onAction()
    })
  }

  function handleDesactiver() {
    startTransition(async () => {
      await modererImmo(annonce.id, false)
      onAction()
    })
  }

  function handleSupprimer() {
    if (!window.confirm('Supprimer définitivement cette annonce immobilière ?')) return
    startTransition(async () => {
      await supprimerImmo(annonce.id)
      onAction()
    })
  }

  return (
    <div className={`admin-annonce-row ${statutClass(annonce)}${pending ? ' admin-annonce-row--loading' : ''}`}>
      <div style={{ padding: '12px 0 0 16px', display: 'flex', alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }}
        />
      </div>

      <div className="admin-annonce-body">
        <div className="admin-annonce-thumb">
          {annonce.photos?.[0]
            ? <ExternalImg src={annonce.photos[0]} alt={annonce.titre} className="admin-annonce-img" fallback={<div className="admin-annonce-img--vide" />} />
            : <div className="admin-annonce-img--vide" />
          }
        </div>
        <div className="admin-annonce-info">
          <div className="admin-annonce-header-row">
            <p className="admin-annonce-titre">{annonce.titre}</p>
            <span className="admin-annonce-prix">{formatPrix(annonce.prix)}</span>
          </div>

          <div className="admin-annonce-badges">
            <StatutBadge annonce={annonce} />
          </div>

          <p className="admin-annonce-meta">
            {annonce.type_bien || '—'} · {annonce.transaction} · {annonce.ville || 'Dakar'}
            {annonce.surface_m2 ? ` · ${annonce.surface_m2} m²` : ''}
            {annonce.nb_pieces ? ` · ${annonce.nb_pieces} pièces` : ''}
          </p>
          <div className="admin-annonce-meta">
            <span>{annonce.compte_nom || annonce.contact_nom || '—'}</span>
            <span className="admin-annonce-meta-sep">·</span>
            <span>{annonce.compte_email || '—'}</span>
            <span className="admin-annonce-meta-sep">·</span>
            <span>{annonce.contact_tel}</span>
            <span className="admin-annonce-meta-sep">·</span>
            <span>source: {annonce.source}</span>
          </div>
          {annonce.rejete && annonce.motif_rejet && (
            <p className="admin-annonce-meta">Motif : {annonce.motif_rejet}</p>
          )}
          <p className="admin-annonce-date">{formatDate(annonce.created_at)}</p>

          {showRejet && (
            <div style={{ marginTop: 8 }}>
              <textarea
                value={motif}
                onChange={e => setMotif(e.target.value)}
                placeholder="Motif de rejet (obligatoire)…"
                rows={2}
                style={{
                  width: '100%', padding: '6px 10px', borderRadius: 6,
                  border: '1px solid #fca5a5', fontSize: 13, resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <button
                  onClick={handleRejeter}
                  disabled={pending || !motif.trim()}
                  className="admin-btn admin-btn--rejeter"
                >
                  {pending ? '…' : 'Confirmer le rejet'}
                </button>
                <button
                  onClick={() => { setShowRejet(false); setMotif('') }}
                  disabled={pending}
                  className="admin-btn"
                  style={{ background: '#f1f5f9', color: '#374151' }}
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="admin-annonce-actions-col">
          {!annonce.actif && !showRejet && (
            <>
              <button
                onClick={handleValider}
                disabled={pending}
                className="admin-btn admin-btn--approuver"
              >
                ✓ Valider
              </button>
              <button
                onClick={() => setShowRejet(true)}
                disabled={pending}
                className="admin-btn admin-btn--rejeter"
              >
                ✕ Rejeter
              </button>
            </>
          )}
          {annonce.actif && (
            <button
              onClick={handleDesactiver}
              disabled={pending}
              className="admin-btn admin-btn--desactiver"
            >
              ⏸ Désactiver
            </button>
          )}
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

      <button
        type="button"
        className="admin-annonce-toggle"
        onClick={() => setExpanded(e => !e)}
      >
        {expanded ? '▲ Masquer les détails' : '▼ Voir détails'}
      </button>

      {expanded && (
        <div className="admin-annonce-details">
          <p className="admin-annonce-desc">{annonce.quartier || 'Quartier non précisé'}</p>
        </div>
      )}
    </div>
  )
}

function SponsoringRow({
  annonce,
  isSelected,
  onToggleSelect,
  onAction
}: {
  annonce: AnnonceImmo
  isSelected: boolean
  onToggleSelect: () => void
  onAction: () => void
}) {
  const [pending, startTransition] = useTransition()

  function handleActiver() {
    startTransition(async () => {
      await activerSponsoring(annonce.id)
      onAction()
    })
  }

  function handleSupprimer() {
    if (!window.confirm('Supprimer définitivement cette annonce immobilière ?')) return
    startTransition(async () => {
      await supprimerImmo(annonce.id)
      onAction()
    })
  }

  return (
    <div className="admin-annonce-row">
      <div style={{ padding: '12px 0 0 16px', display: 'flex', alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }}
        />
      </div>
      <div className="admin-annonce-body">
        <div className="admin-annonce-thumb">
          {annonce.photos?.[0]
            ? <ExternalImg src={annonce.photos[0]} alt={annonce.titre} className="admin-annonce-img" fallback={<div className="admin-annonce-img--vide" />} />
            : <div className="admin-annonce-img--vide" />
          }
        </div>
        <div className="admin-annonce-info">
          <p className="admin-annonce-titre">{annonce.titre}</p>
          <p className="admin-annonce-meta">
            {annonce.type_bien || '—'} · {annonce.ville || 'Dakar'}
            {annonce.prix ? ` · ${formatPrix(annonce.prix)}` : ''}
          </p>
          <p className="admin-annonce-meta">{annonce.contact_nom || '—'} · {annonce.contact_tel}</p>
          <p className="admin-annonce-date">Demande: {formatDate(annonce.created_at)}</p>
        </div>
        <div className="admin-annonce-actions-col">
          <button
            onClick={handleActiver}
            disabled={pending}
            className="admin-btn admin-btn--approuver"
          >
            {pending ? '…' : 'Activer 30 jours'}
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
    </div>
  )
}

const TABS = [
  { key: 'attente',     label: 'En attente',  accent: 'orange' },
  { key: 'validees',    label: 'Validées',    accent: 'green'  },
  { key: 'rejetees',    label: 'Rejetées',    accent: 'red'    },
  { key: 'sponsoring',  label: 'Sponsoring',  accent: 'orange' },
] as const

type TabKey = typeof TABS[number]['key']

export default function AdminImmoClient({
  annonces: initial,
  demandesSponsoring: initialSponsoring,
}: {
  annonces: AnnonceImmo[]
  demandesSponsoring: AnnonceImmo[]
}) {
  const [, startTransition] = useTransition()
  const [tab, setTab] = useState<TabKey>('attente')
  const [q, setQ] = useState('')
  const [tri, setTri] = useState<Tri>('recent')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [loadingBatch, setLoadingBatch] = useState(false)

  function refresh() {
    startTransition(() => { window.location.reload() })
  }

  const enAttente = useMemo(() => initial.filter(a => !a.actif && !a.rejete), [initial])
  const validees  = useMemo(() => initial.filter(a => a.actif), [initial])
  const rejetees  = useMemo(() => initial.filter(a => a.rejete), [initial])

  const counts: Record<TabKey, number> = {
    attente: enAttente.length,
    validees: validees.length,
    rejetees: rejetees.length,
    sponsoring: initialSponsoring.length,
  }

  const source = tab === 'attente' ? enAttente
    : tab === 'validees' ? validees
    : tab === 'rejetees' ? rejetees
    : initialSponsoring

  const filtres = useMemo(() => trier(source.filter(a => correspond(a, q)), tri), [source, q, tri])

  const allIds = filtres.map(a => a.id)
  const allSelected = allIds.length > 0 && selectedIds.length === allIds.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(allIds)
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleBatchValider = async () => {
    setLoadingBatch(true)
    try {
      await batchModererImmo(selectedIds, 'valider')
      setSelectedIds([])
      refresh()
    } finally {
      setLoadingBatch(false)
    }
  }

  const handleBatchDesactiver = async () => {
    setLoadingBatch(true)
    try {
      await batchModererImmo(selectedIds, 'desactiver')
      setSelectedIds([])
      refresh()
    } finally {
      setLoadingBatch(false)
    }
  }

  const handleBatchSponsoriser = async () => {
    setLoadingBatch(true)
    try {
      await batchModererImmo(selectedIds, 'sponsoriser')
      setSelectedIds([])
      refresh()
    } finally {
      setLoadingBatch(false)
    }
  }

  const handleBatchSupprimer = async () => {
    setLoadingBatch(true)
    try {
      await batchModererImmo(selectedIds, 'supprimer')
      setSelectedIds([])
      refresh()
    } finally {
      setLoadingBatch(false)
    }
  }

  const batchActions: BatchActionConfig[] = [
    {
      key: 'valider',
      label: 'Valider les sélectionnées',
      icon: '✅',
      color: 'green',
      onClick: handleBatchValider,
    },
    {
      key: 'desactiver',
      label: 'Désactiver / Rejeter',
      icon: '⏸️',
      color: 'amber',
      onClick: handleBatchDesactiver,
    },
    {
      key: 'sponsoriser',
      label: 'Sponsoriser 30 jours',
      icon: '⭐',
      color: 'blue',
      onClick: handleBatchSponsoriser,
    },
    {
      key: 'supprimer',
      label: 'Supprimer définitivement',
      icon: '🗑️',
      color: 'red',
      confirmMsg: 'Êtes-vous sûr de vouloir supprimer définitivement ces annonces immobilières ?',
      onClick: handleBatchSupprimer,
    },
  ]

  return (
    <div className="admin-annonces-sections">
      <div className="admin-tabs" style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSelectedIds([]) }}
            className="admin-btn"
            style={{
              background: tab === t.key ? '#1e293b' : '#f1f5f9',
              color: tab === t.key ? '#fff' : '#374151',
            }}
          >
            {t.label} ({counts[t.key]})
          </button>
        ))}
      </div>

      <div className="admin-filters" style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Rechercher par titre, ville, contact, compte, email…"
          style={{
            flex: '1 1 280px', padding: '8px 12px', borderRadius: 6,
            border: '1px solid var(--border, #d1d5db)', fontSize: 14,
          }}
        />
        <select
          value={tri}
          onChange={e => setTri(e.target.value as Tri)}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border, #d1d5db)', fontSize: 14 }}
        >
          <option value="recent">Plus récent</option>
          <option value="ancien">Plus ancien</option>
          <option value="prix_asc">Prix croissant</option>
          <option value="prix_desc">Prix décroissant</option>
        </select>
      </div>

      <BatchActionBar
        selectedCount={selectedIds.length}
        totalCount={filtres.length}
        allSelected={allSelected}
        onToggleSelectAll={toggleSelectAll}
        onClearSelection={() => setSelectedIds([])}
        actions={batchActions}
        loading={loadingBatch}
        itemLabel="annonce(s) immo"
      />

      {filtres.length === 0 ? (
        <p className="admin-empty">Aucune annonce dans cette section.</p>
      ) : (
        <div className="admin-annonces-list">
          {tab === 'sponsoring'
            ? filtres.map(a => (
                <SponsoringRow
                  key={a.id}
                  annonce={a}
                  isSelected={selectedIds.includes(a.id)}
                  onToggleSelect={() => toggleSelect(a.id)}
                  onAction={refresh}
                />
              ))
            : filtres.map(a => (
                <ImmoRow
                  key={a.id}
                  annonce={a}
                  isSelected={selectedIds.includes(a.id)}
                  onToggleSelect={() => toggleSelect(a.id)}
                  onAction={refresh}
                />
              ))
          }
        </div>
      )}
    </div>
  )
}
