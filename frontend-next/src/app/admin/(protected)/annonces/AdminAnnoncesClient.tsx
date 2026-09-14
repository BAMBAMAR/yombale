'use client'

import React, { useState, useMemo, useTransition } from 'react'
import {
  batchModererAnnonces,
  batchSupprimerAnnonces,
  boosterAnnonce
} from '@/app/actions/admin'
import BatchActionBar, { BatchActionConfig } from '@/components/admin/BatchActionBar'
import {
  Annonce,
  TabStatus,
  TriOption,
  VILLES_POPULAIRES,
  AdminAnnonceRow,
  AdminAnnoncesFilterBar,
  AdminAnnoncesTabs
} from './components'

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
      icon: '',
      color: 'green',
      onClick: handleBatchApprouver,
    },
    {
      key: 'booster',
      label: 'Booster 7 jours',
      icon: '',
      color: 'amber',
      onClick: handleBatchBoost,
    },
    {
      key: 'desactiver',
      label: 'Désactiver / Rejeter',
      icon: '',
      color: 'amber',
      onClick: handleBatchDesactiver,
    },
    {
      key: 'supprimer',
      label: 'Supprimer définitivement',
      icon: '',
      color: 'red',
      confirmMsg: 'Êtes-vous sûr de vouloir supprimer définitivement ces annonces ?',
      onClick: handleBatchSupprimer,
    },
  ]

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
      {/* Barre de recherche & filtres */}
      <AdminAnnoncesFilterBar
        q={q}
        onQChange={setQ}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetFilters}
        categorieFilter={categorieFilter}
        onCategorieFilterChange={setCategorieFilter}
        villeFilter={villeFilter}
        onVilleFilterChange={setVilleFilter}
        villesDisponibles={villesDisponibles}
        payeeFilter={payeeFilter}
        onPayeeFilterChange={setPayeeFilter}
        triOption={triOption}
        onTriOptionChange={setTriOption}
      />

      {/* Onglets de Statut */}
      <AdminAnnoncesTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={counts}
      />

      {/* Barre d'actions par lot */}
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

      {/* Liste de modération */}
      <div className="admin-annonces-list" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {annoncesFiltrees.map(a => (
          <AdminAnnonceRow
            key={a.id}
            annonce={a}
            isSelected={selectedIds.includes(a.id)}
            onToggleSelect={() => toggleSelect(a.id)}
            onAction={refresh}
          />
        ))}

        {annoncesFiltrees.length === 0 && (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              color: '#64748b'
            }}
          >
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
