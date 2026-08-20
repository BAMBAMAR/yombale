'use client'

import React, { useState, useMemo, useTransition } from 'react'
import { modererAnnonce, supprimerAnnonce, batchModererAnnonces, batchSupprimerAnnonces, boosterAnnonce } from '@/app/actions/admin'
import BatchActionBar, { BatchActionConfig } from '@/components/admin/BatchActionBar'

interface Annonce {
  id: string
  titre: string
  description: string | null
  categorie_slug: string
  prix: number | null
  ville: string | null
  actif: boolean
  payee: boolean
  rejete: boolean
  boost_until?: string | null
  auteur_nom: string | null
  auteur_email: string | null
  contact_tel: string
  photos: string[]
  created_at: string
}

type TabStatus = 'toutes' | 'attente' | 'actives' | 'boostees' | 'rejetees'
type TriOption = 'recent' | 'ancien' | 'prix_asc' | 'prix_desc'

const CATEGORIES_LABELS: Record<string, string> = {
  smartphones: '📱 Smartphones & Tablettes',
  informatique: '💻 Informatique & Laptops',
  'tv-electro': '📺 TV & Électroménager',
  mode: '👗 Mode & Vetements',
  maison: '🏠 Maison & Déco',
  'auto-moto': '🚗 Auto & Moto',
  jeux: '🎮 Jeux vidéo & Consoles',
  services: '🛠️ Services & Prestations',
  immo: '🏢 Immobilier',
  beaute: '✨ Beauté & Cosmétiques',
  emploi: '💼 Emploi & Recrutement',
  divers: '📦 Divers',
}

const VILLES_POPULAIRES = [
  'Dakar', 'Thiès', 'Saint-Louis', 'Rufisque', 'Ziguinchor', 'Mbour', 'Kaolack', 'Touba', 'Louga', 'Diourbel'
]

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('fr-SN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatPrix(p: number | null) {
  if (!p) return null
  return new Intl.NumberFormat('fr-SN').format(p) + ' FCFA'
}

function statutClass(annonce: Annonce) {
  if (annonce.rejete) return 'admin-annonce-row--rejete'
  if (annonce.actif)  return 'admin-annonce-row--active'
  return 'admin-annonce-row--attente'
}

function StatutBadge({ annonce }: { annonce: Annonce }) {
  const isBooste = Boolean(annonce.boost_until && new Date(annonce.boost_until) > new Date())
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
      {annonce.rejete ? (
        <span className="admin-annonce-statut admin-annonce-statut--rejete">Rejetée</span>
      ) : annonce.actif ? (
        <span className="admin-annonce-statut admin-annonce-statut--active">Active</span>
      ) : (
        <span className="admin-annonce-statut admin-annonce-statut--attente">En attente</span>
      )}
      {isBooste && (
        <span style={{
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: '#fff',
          fontSize: 11,
          fontWeight: 800,
          padding: '2px 8px',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}>
          ⚡ Boosté ({new Date(annonce.boost_until!).toLocaleDateString('fr-FR')})
        </span>
      )}
    </div>
  )
}

function AnnonceRow({
  annonce,
  isSelected,
  onToggleSelect,
  onAction
}: {
  annonce: Annonce
  isSelected: boolean
  onToggleSelect: () => void
  onAction: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(false)

  function handleAction(action: 'approuver' | 'rejeter') {
    startTransition(async () => {
      await modererAnnonce(annonce.id, action)
      onAction()
    })
  }

  function handleBoost(jours = 7) {
    startTransition(async () => {
      await boosterAnnonce(annonce.id, jours)
      onAction()
    })
  }

  function handleSupprimer() {
    if (!window.confirm('Supprimer définitivement cette annonce ?')) return
    startTransition(async () => {
      await supprimerAnnonce(annonce.id)
      onAction()
    })
  }

  const allPhotos = Array.isArray(annonce.photos) ? annonce.photos : []
  const photo = allPhotos[0] ?? null
  const prix = formatPrix(annonce.prix)
  const isBooste = Boolean(annonce.boost_until && new Date(annonce.boost_until) > new Date())

  return (
    <div className={`admin-annonce-row ${statutClass(annonce)}${pending ? ' admin-annonce-row--loading' : ''}`} style={{ position: 'relative' }}>
      {/* Checkbox de sélection */}
      <div style={{ padding: '12px 0 0 16px', display: 'flex', alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }}
        />
      </div>

      {/* Corps principal */}
      <div className="admin-annonce-body">
        {/* Photo */}
        <div className="admin-annonce-thumb">
          {photo
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={photo} alt="" className="admin-annonce-img" />
            : <div className="admin-annonce-img--vide" />
          }
        </div>

        {/* Infos */}
        <div className="admin-annonce-info">
          <div className="admin-annonce-header-row">
            <p className="admin-annonce-titre">{annonce.titre}</p>
            {prix && <span className="admin-annonce-prix">{prix}</span>}
          </div>

          <div className="admin-annonce-badges">
            <StatutBadge annonce={annonce} />
            {annonce.payee && <span className="admin-annonce-payee">Payée</span>}
          </div>

          <div className="admin-annonce-meta">
            <span style={{ fontWeight: 600, color: '#1e3a5f' }}>
              {CATEGORIES_LABELS[annonce.categorie_slug] || annonce.categorie_slug}
            </span>
            <span className="admin-annonce-meta-sep">·</span>
            <span>📍 {annonce.ville || 'Dakar'}</span>
          </div>

          <div className="admin-annonce-meta">
            <span>👤 {annonce.auteur_nom || 'Anonyme'}</span>
            <span className="admin-annonce-meta-sep">·</span>
            <span>✉️ {annonce.auteur_email || '—'}</span>
            <span className="admin-annonce-meta-sep">·</span>
            <span>📞 {annonce.contact_tel}</span>
          </div>

          <p className="admin-annonce-date">Déposée le {formatDate(annonce.created_at)}</p>
        </div>

        {/* Actions */}
        <div className="admin-annonce-actions-col">
          {!annonce.actif && !annonce.rejete && (
            <>
              <button
                onClick={() => handleAction('approuver')}
                disabled={pending}
                className="admin-btn admin-btn--approuver"
              >
                ✓ Approuver
              </button>
              <button
                onClick={() => handleAction('rejeter')}
                disabled={pending}
                className="admin-btn admin-btn--rejeter"
              >
                ✕ Rejeter
              </button>
            </>
          )}
          {annonce.actif && (
            <button
              onClick={() => handleAction('rejeter')}
              disabled={pending}
              className="admin-btn admin-btn--desactiver"
            >
              ⏸ Désactiver
            </button>
          )}
          {!annonce.actif && annonce.rejete && (
            <button
              onClick={() => handleAction('approuver')}
              disabled={pending}
              className="admin-btn admin-btn--reactiver"
            >
              ↩ Réactiver
            </button>
          )}

          {/* Action Booster / Prolonger Boost */}
          <button
            onClick={() => handleBoost(7)}
            disabled={pending}
            className="admin-btn"
            style={{
              background: isBooste ? '#fef3c7' : '#fffbeb',
              color: '#b45309',
              border: '1px solid #fcd34d',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            {isBooste ? '⚡ +7j Boost' : '⚡ Booster 7j'}
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

      {/* Toggle détails */}
      <button
        type="button"
        className="admin-annonce-toggle"
        onClick={() => setExpanded(e => !e)}
      >
        {expanded ? '▲ Masquer les détails' : '▼ Voir détails & photos'}
      </button>

      {/* Détails dépliés */}
      {expanded && (
        <div className="admin-annonce-details">
          {annonce.description
            ? <p className="admin-annonce-desc">{annonce.description}</p>
            : <p className="admin-annonce-no-detail">Aucune description.</p>
          }
          {allPhotos.length > 0 && (
            <div className="admin-annonce-photos">
              {allPhotos.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <a key={i} href={src} target="_blank" rel="noreferrer">
                  <img src={src} alt={`Photo ${i + 1}`} className="admin-annonce-photo-thumb" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminAnnoncesClient({
  annonces: initial,
}: {
  annonces: Annonce[]
}) {
  const [, startTransition] = useTransition()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loadingBatch, setLoadingBatch] = useState(false)

  // Filtres & Recherche
  const [q, setQ] = useState('')
  const [activeTab, setActiveTab] = useState<TabStatus>('attente')
  const [categorieFilter, setCategorieFilter] = useState<string>('')
  const [villeFilter, setVilleFilter] = useState<string>('')
  const [payeeFilter, setPayeeFilter] = useState<string>('')
  const [triOption, setTriOption] = useState<TriOption>('recent')

  function refresh() {
    startTransition(() => {
      window.location.reload()
    })
  }

  // Filtrage combiné réactif
  const annoncesFiltrees = useMemo(() => {
    let list = [...initial]

    // 1. Onglet Statut
    if (activeTab === 'attente') {
      list = list.filter(a => !a.actif && !a.rejete)
    } else if (activeTab === 'actives') {
      list = list.filter(a => a.actif)
    } else if (activeTab === 'boostees') {
      list = list.filter(a => Boolean(a.boost_until && new Date(a.boost_until) > new Date()))
    } else if (activeTab === 'rejetees') {
      list = list.filter(a => a.rejete)
    }

    // 2. Recherche textuelle
    if (q.trim()) {
      const term = q.trim().toLowerCase()
      list = list.filter(a => {
        return (
          a.titre?.toLowerCase().includes(term) ||
          a.description?.toLowerCase().includes(term) ||
          a.auteur_nom?.toLowerCase().includes(term) ||
          a.auteur_email?.toLowerCase().includes(term) ||
          a.contact_tel?.includes(term) ||
          a.ville?.toLowerCase().includes(term) ||
          a.categorie_slug?.toLowerCase().includes(term) ||
          a.id.toLowerCase().includes(term)
        )
      })
    }

    // 3. Filtre Catégorie
    if (categorieFilter) {
      list = list.filter(a => a.categorie_slug === categorieFilter)
    }

    // 4. Filtre Ville
    if (villeFilter) {
      list = list.filter(a => (a.ville || '').toLowerCase().includes(villeFilter.toLowerCase()))
    }

    // 5. Filtre Paiement
    if (payeeFilter === 'payee') {
      list = list.filter(a => a.payee)
    } else if (payeeFilter === 'gratuite') {
      list = list.filter(a => !a.payee)
    }

    // 6. Tri
    list.sort((a, b) => {
      if (triOption === 'ancien') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      if (triOption === 'prix_asc') {
        return (a.prix ?? Infinity) - (b.prix ?? Infinity)
      }
      if (triOption === 'prix_desc') {
        return (b.prix ?? -Infinity) - (a.prix ?? -Infinity)
      }
      // recent (par défaut)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return list
  }, [initial, activeTab, q, categorieFilter, villeFilter, payeeFilter, triOption])

  // Compteurs dynamiques par onglet
  const counts = useMemo(() => {
    return {
      attente: initial.filter(a => !a.actif && !a.rejete).length,
      actives: initial.filter(a => a.actif).length,
      boostees: initial.filter(a => Boolean(a.boost_until && new Date(a.boost_until) > new Date())).length,
      rejetees: initial.filter(a => a.rejete).length,
      toutes: initial.length,
    }
  }, [initial])

  const hasActiveFilters = Boolean(q || categorieFilter || villeFilter || payeeFilter || triOption !== 'recent')

  const resetFilters = () => {
    setQ('')
    setCategorieFilter('')
    setVilleFilter('')
    setPayeeFilter('')
    setTriOption('recent')
  }

  const allIds = annoncesFiltrees.map(a => a.id)
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
      await batchModererAnnonces(selectedIds, 'approuver')
      setSelectedIds([])
      refresh()
    } finally {
      setLoadingBatch(false)
    }
  }

  const handleBatchBoost = async () => {
    setLoadingBatch(true)
    try {
      for (const id of selectedIds) {
        await boosterAnnonce(id, 7)
      }
      setSelectedIds([])
      refresh()
    } finally {
      setLoadingBatch(false)
    }
  }

  const handleBatchDesactiver = async () => {
    setLoadingBatch(true)
    try {
      await batchModererAnnonces(selectedIds, 'rejeter')
      setSelectedIds([])
      refresh()
    } finally {
      setLoadingBatch(false)
    }
  }

  const handleBatchSupprimer = async () => {
    setLoadingBatch(true)
    try {
      await batchSupprimerAnnonces(selectedIds)
      setSelectedIds([])
      refresh()
    } finally {
      setLoadingBatch(false)
    }
  }

  const batchActions: BatchActionConfig[] = [
    {
      key: 'approuver',
      label: 'Approuver les sélectionnées',
      icon: '✅',
      color: 'green',
      onClick: handleBatchApprouver,
    },
    {
      key: 'booster',
      label: '⚡ Booster 7 jours',
      icon: '⚡',
      color: 'amber',
      onClick: handleBatchBoost,
    },
    {
      key: 'desactiver',
      label: 'Désactiver / Rejeter',
      icon: '⏸️',
      color: 'amber',
      onClick: handleBatchDesactiver,
    },
    {
      key: 'supprimer',
      label: 'Supprimer définitivement',
      icon: '🗑️',
      color: 'red',
      confirmMsg: 'Êtes-vous sûr de vouloir supprimer définitivement ces annonces ?',
      onClick: handleBatchSupprimer,
    },
  ]

  // Extraire les villes uniques de la liste initiale
  const villesDisponibles = useMemo(() => {
    const set = new Set<string>()
    initial.forEach(a => {
      if (a.ville && a.ville.trim()) set.add(a.ville.trim())
    })
    VILLES_POPULAIRES.forEach(v => set.add(v))
    return Array.from(set).sort()
  }, [initial])

  return (
    <div className="admin-annonces-container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── BARRE DE RECHERCHE & FILTRES SUPERIEURS ──────────────── */}
      <div style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 14,
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}>
        {/* Champ de recherche principal */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#94a3b8' }}>🔍</span>
            <input
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Rechercher par titre, description, auteur, e-mail, téléphone, ville..."
              style={{
                width: '100%',
                padding: '11px 40px 11px 42px',
                borderRadius: 10,
                border: '1px solid #cbd5e1',
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                fontFamily: 'system-ui, sans-serif'
              }}
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#94a3b8', fontSize: 16, cursor: 'pointer', padding: 4
                }}
              >
                ✕
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              style={{
                padding: '10px 14px',
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              🔄 Réinitialiser
            </button>
          )}
        </div>

        {/* Ligne de filtres déroulants */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Filtre Catégorie */}
          <div style={{ flex: '1 1 200px', minWidth: 180 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
              Catégorie
            </label>
            <select
              value={categorieFilter}
              onChange={e => setCategorieFilter(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1',
                fontSize: 13, background: '#fff', color: '#1e293b', cursor: 'pointer'
              }}
            >
              <option value="">Toutes les catégories</option>
              {Object.entries(CATEGORIES_LABELS).map(([slug, label]) => (
                <option key={slug} value={slug}>{label}</option>
              ))}
            </select>
          </div>

          {/* Filtre Ville */}
          <div style={{ flex: '1 1 160px', minWidth: 150 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
              Ville / Zone
            </label>
            <select
              value={villeFilter}
              onChange={e => setVilleFilter(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1',
                fontSize: 13, background: '#fff', color: '#1e293b', cursor: 'pointer'
              }}
            >
              <option value="">Toutes les villes</option>
              {villesDisponibles.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* Filtre Paiement */}
          <div style={{ flex: '1 1 150px', minWidth: 140 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
              Statut Paiement
            </label>
            <select
              value={payeeFilter}
              onChange={e => setPayeeFilter(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1',
                fontSize: 13, background: '#fff', color: '#1e293b', cursor: 'pointer'
              }}
            >
              <option value="">Tous les types</option>
              <option value="payee">💎 Payée</option>
              <option value="gratuite">🆓 Gratuite / Quota</option>
            </select>
          </div>

          {/* Trier par */}
          <div style={{ flex: '1 1 170px', minWidth: 160 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
              Trier par
            </label>
            <select
              value={triOption}
              onChange={e => setTriOption(e.target.value as TriOption)}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1',
                fontSize: 13, background: '#fff', color: '#1e293b', cursor: 'pointer'
              }}
            >
              <option value="recent">📅 Les plus récentes</option>
              <option value="ancien">⏳ Les plus anciennes</option>
              <option value="prix_asc">🏷️ Prix croissant</option>
              <option value="prix_desc">🏷️ Prix décroissant</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── ONGLETS DE STATUT (EN ATTENTE, ACTIVES, REJETEES, TOUTES) ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '2px solid #e2e8f0', paddingBottom: 4 }}>
        <button
          type="button"
          onClick={() => setActiveTab('attente')}
          style={{
            padding: '10px 18px',
            borderRadius: '10px 10px 0 0',
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'attente' ? '#f59e0b' : '#f8fafc',
            color: activeTab === 'attente' ? '#fff' : '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: activeTab === 'attente' ? '0 4px 12px rgba(245, 158, 11, 0.25)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          ⏳ En attente
          <span style={{
            background: activeTab === 'attente' ? 'rgba(255,255,255,0.3)' : '#e2e8f0',
            padding: '2px 8px', borderRadius: 12, fontSize: 12
          }}>
            {counts.attente}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('actives')}
          style={{
            padding: '10px 18px',
            borderRadius: '10px 10px 0 0',
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'actives' ? '#16a34a' : '#f8fafc',
            color: activeTab === 'actives' ? '#fff' : '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: activeTab === 'actives' ? '0 4px 12px rgba(22, 163, 74, 0.25)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          ✅ Actives
          <span style={{
            background: activeTab === 'actives' ? 'rgba(255,255,255,0.3)' : '#e2e8f0',
            padding: '2px 8px', borderRadius: 12, fontSize: 12
          }}>
            {counts.actives}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('boostees')}
          style={{
            padding: '10px 18px',
            borderRadius: '10px 10px 0 0',
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'boostees' ? '#d97706' : '#f8fafc',
            color: activeTab === 'boostees' ? '#fff' : '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: activeTab === 'boostees' ? '0 4px 12px rgba(217, 119, 6, 0.25)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          ⚡ Boostées
          <span style={{
            background: activeTab === 'boostees' ? 'rgba(255,255,255,0.3)' : '#e2e8f0',
            padding: '2px 8px', borderRadius: 12, fontSize: 12
          }}>
            {counts.boostees}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rejetees')}
          style={{
            padding: '10px 18px',
            borderRadius: '10px 10px 0 0',
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'rejetees' ? '#dc2626' : '#f8fafc',
            color: activeTab === 'rejetees' ? '#fff' : '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: activeTab === 'rejetees' ? '0 4px 12px rgba(220, 38, 38, 0.25)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          ❌ Rejetées
          <span style={{
            background: activeTab === 'rejetees' ? 'rgba(255,255,255,0.3)' : '#e2e8f0',
            padding: '2px 8px', borderRadius: 12, fontSize: 12
          }}>
            {counts.rejetees}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('toutes')}
          style={{
            padding: '10px 18px',
            borderRadius: '10px 10px 0 0',
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'toutes' ? '#1d4ed8' : '#f8fafc',
            color: activeTab === 'toutes' ? '#fff' : '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: activeTab === 'toutes' ? '0 4px 12px rgba(29, 78, 216, 0.25)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          📋 Toutes
          <span style={{
            background: activeTab === 'toutes' ? 'rgba(255,255,255,0.3)' : '#e2e8f0',
            padding: '2px 8px', borderRadius: 12, fontSize: 12
          }}>
            {counts.toutes}
          </span>
        </button>
      </div>

      {/* ── BARRE D'ACTIONS PAR LOT & RESULTATS ────────────────────── */}
      <BatchActionBar
        selectedCount={selectedIds.length}
        totalCount={annoncesFiltrees.length}
        allSelected={allSelected}
        onToggleSelectAll={toggleSelectAll}
        onClearSelection={() => setSelectedIds([])}
        actions={batchActions}
        loading={loadingBatch}
        itemLabel="annonce(s)"
      />

      {/* ── LISTE DE MODERATION ───────────────────────────────────── */}
      <div className="admin-annonces-list" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {annoncesFiltrees.map(a => (
          <AnnonceRow
            key={a.id}
            annonce={a}
            isSelected={selectedIds.includes(a.id)}
            onToggleSelect={() => toggleSelect(a.id)}
            onAction={refresh}
          />
        ))}

        {annoncesFiltrees.length === 0 && (
          <div style={{
            padding: '48px 24px',
            textAlign: 'center',
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            color: '#64748b'
          }}>
            <p style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0', color: '#1e293b' }}>
              Aucune annonce ne correspond aux critères
            </p>
            <p style={{ fontSize: 14, margin: 0 }}>
              {hasActiveFilters ? 'Essayez de modifier votre recherche ou de réinitialiser vos filtres.' : 'Aucune annonce trouvée dans cette section.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                style={{
                  marginTop: 16,
                  padding: '8px 16px',
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

