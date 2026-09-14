'use client'

import React, { useState, useMemo, useTransition } from 'react'
import {
  batchModererBoutiques,
  batchSupprimerBoutiques,
} from '@/app/actions/admin'
import BatchActionBar, { BatchActionConfig } from '@/components/admin/BatchActionBar'
import {
  Boutique,
  RelanceConfig,
  AdminBoutiquesClientProps,
  isSponsorActif,
  BoutiqueRow,
  BoutiquesFilterBar,
  ModalGestionMarchand,
  ModalRelanceCatalogue,
  ModalConfigAutomatisation,
} from './components'

export default function AdminBoutiquesClient({
  boutiques,
  initialRelanceConfig,
  initialRelanceStats,
  initialRelanceEligibles,
}: AdminBoutiquesClientProps) {
  const [, startTransition] = useTransition()
  const [selectedBoutique, setSelectedBoutique] = useState<Boutique | null>(null)
  const [relanceModalBoutiques, setRelanceModalBoutiques] = useState<Boutique[] | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loadingBatch, setLoadingBatch] = useState(false)

  // Configuration relance
  const [relanceConfig] = useState<RelanceConfig>(
    initialRelanceConfig || {
      actif: false,
      seuil: 1,
      delai_heures: 24,
      intervalle_jours: 7,
      titre: 'Nopalou — Ajoutez vos produits',
      template: '',
    }
  )

  // Filtres et recherche
  const [q, setQ] = useState('')
  const [activeTab, setActiveTab] = useState<'toutes' | 'abonnees' | 'sponsorisees' | 'inactives'>('toutes')
  const [seuilProduits, setSeuilProduits] = useState<'tous' | '0' | '1' | '2' | '3' | '5'>('tous')

  function refresh() {
    startTransition(() => {
      window.location.reload()
    })
  }

  // Filtrage combiné réactif
  const boutiquesFiltrees = useMemo(() => {
    let list = [...boutiques]

    // 1. Onglet
    if (activeTab === 'abonnees') {
      list = list.filter(b => b.plan_actif)
    } else if (activeTab === 'sponsorisees') {
      list = list.filter(b => isSponsorActif(b))
    } else if (activeTab === 'inactives') {
      list = list.filter(b => !b.actif)
    }

    // 2. Seuil de produits
    if (seuilProduits === '0') {
      list = list.filter(b => (b.nb_produits ?? 0) === 0)
    } else if (seuilProduits === '1') {
      list = list.filter(b => (b.nb_produits ?? 0) <= 1)
    } else if (seuilProduits === '2') {
      list = list.filter(b => (b.nb_produits ?? 0) <= 2)
    } else if (seuilProduits === '3') {
      list = list.filter(b => (b.nb_produits ?? 0) <= 3)
    } else if (seuilProduits === '5') {
      list = list.filter(b => (b.nb_produits ?? 0) <= 5)
    }

    // 3. Recherche textuelle
    if (q.trim()) {
      const term = q.trim().toLowerCase()
      list = list.filter(b => {
        return (
          b.nom?.toLowerCase().includes(term) ||
          b.description?.toLowerCase().includes(term) ||
          b.categorie?.toLowerCase().includes(term) ||
          b.proprietaire_nom?.toLowerCase().includes(term) ||
          b.proprietaire_email?.toLowerCase().includes(term) ||
          b.telephone?.includes(term) ||
          b.whatsapp?.includes(term) ||
          b.ville?.toLowerCase().includes(term) ||
          b.adresse?.toLowerCase().includes(term) ||
          b.id.toLowerCase().includes(term)
        )
      })
    }

    return list
  }, [boutiques, activeTab, seuilProduits, q])

  // Compteurs
  const counts = useMemo(
    () => ({
      toutes: boutiques.length,
      abonnees: boutiques.filter(b => b.plan_actif).length,
      sponsorisees: boutiques.filter(b => isSponsorActif(b)).length,
      inactives: boutiques.filter(b => !b.actif).length,
      zeroProduit: boutiques.filter(b => (b.nb_produits ?? 0) === 0).length,
      max1Produit: boutiques.filter(b => (b.nb_produits ?? 0) <= 1).length,
    }),
    [boutiques]
  )

  const allIds = boutiquesFiltrees.map(b => b.id)
  const allSelected = allIds.length > 0 && selectedIds.length === allIds.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(allIds)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  }

  const handleBatchActiver = async () => {
    setLoadingBatch(true)
    try {
      await batchModererBoutiques(selectedIds, true)
      setSelectedIds([])
      refresh()
    } finally {
      setLoadingBatch(false)
    }
  }

  const handleBatchDesactiver = async () => {
    setLoadingBatch(true)
    try {
      await batchModererBoutiques(selectedIds, false)
      setSelectedIds([])
      refresh()
    } finally {
      setLoadingBatch(false)
    }
  }

  const handleBatchSupprimer = async () => {
    setLoadingBatch(true)
    try {
      await batchSupprimerBoutiques(selectedIds)
      setSelectedIds([])
      refresh()
    } finally {
      setLoadingBatch(false)
    }
  }

  const handleBatchRelancer = () => {
    const targets = boutiques.filter(b => selectedIds.includes(b.id))
    if (targets.length > 0) {
      setRelanceModalBoutiques(targets)
    }
  }

  const batchActions: BatchActionConfig[] = [
    {
      key: 'relancer',
      label: 'Relancer Catalogue (Guide WhatsApp)',
      color: 'amber',
      onClick: handleBatchRelancer,
    },
    {
      key: 'activer',
      label: 'Activer les boutiques',
      color: 'green',
      onClick: handleBatchActiver,
    },
    {
      key: 'desactiver',
      label: 'Désactiver les boutiques',
      color: 'amber',
      onClick: handleBatchDesactiver,
    },
    {
      key: 'supprimer',
      label: 'Supprimer définitivement',
      color: 'red',
      confirmMsg: 'Êtes-vous sûr de vouloir supprimer définitivement ces boutiques ?',
      onClick: handleBatchSupprimer,
    },
  ]

  const abonnees = boutiquesFiltrees.filter(b => b.plan_actif)
  const sponsorisees = boutiquesFiltrees.filter(b => !b.plan_actif && isSponsorActif(b))
  const autres = boutiquesFiltrees.filter(b => !b.plan_actif && !isSponsorActif(b))

  return (
    <div className="admin-annonces-sections" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Barre d'outils, filtres et onglets */}
      <BoutiquesFilterBar
        zeroProduitCount={counts.zeroProduit}
        max1ProduitCount={counts.max1Produit}
        cronActif={relanceConfig.actif}
        onOpenConfigCron={() => setShowConfigModal(true)}
        q={q}
        onQChange={setQ}
        seuilProduits={seuilProduits}
        onSeuilChange={setSeuilProduits}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={counts}
      />

      <BatchActionBar
        selectedCount={selectedIds.length}
        totalCount={boutiquesFiltrees.length}
        allSelected={allSelected}
        onToggleSelectAll={toggleSelectAll}
        onClearSelection={() => setSelectedIds([])}
        actions={batchActions}
        loading={loadingBatch}
        itemLabel="boutique(s)"
      />

      {abonnees.length > 0 && (
        <section className="admin-annonces-section" style={{ marginBottom: 24 }}>
          <h2 className="admin-section-titre" style={{ color: 'var(--accent, #C75B00)' }}>
            Abonnés Pro / Business
            <span className="admin-section-count">{abonnees.length}</span>
          </h2>
          <div className="admin-annonces-list">
            {abonnees.map(b => (
              <BoutiqueRow
                key={b.id}
                boutique={b}
                isSelected={selectedIds.includes(b.id)}
                onToggleSelect={() => toggleSelect(b.id)}
                onAction={refresh}
                onOpenGestion={setSelectedBoutique}
                onOpenRelance={bqt => setRelanceModalBoutiques([bqt])}
              />
            ))}
          </div>
        </section>
      )}

      {sponsorisees.length > 0 && (
        <section className="admin-annonces-section" style={{ marginBottom: 24 }}>
          <h2 className="admin-section-titre" style={{ color: '#D97706' }}>
            Boutiques sponsorisées
            <span className="admin-section-count">{sponsorisees.length}</span>
          </h2>
          <div className="admin-annonces-list">
            {sponsorisees.map(b => (
              <BoutiqueRow
                key={b.id}
                boutique={b}
                isSelected={selectedIds.includes(b.id)}
                onToggleSelect={() => toggleSelect(b.id)}
                onAction={refresh}
                onOpenGestion={setSelectedBoutique}
                onOpenRelance={bqt => setRelanceModalBoutiques([bqt])}
              />
            ))}
          </div>
        </section>
      )}

      {autres.length > 0 && (
        <section className="admin-annonces-section">
          <h2 className="admin-section-titre">
            Autres boutiques
            <span className="admin-section-count">{autres.length}</span>
          </h2>
          <div className="admin-annonces-list">
            {autres.map(b => (
              <BoutiqueRow
                key={b.id}
                boutique={b}
                isSelected={selectedIds.includes(b.id)}
                onToggleSelect={() => toggleSelect(b.id)}
                onAction={refresh}
                onOpenGestion={setSelectedBoutique}
                onOpenRelance={bqt => setRelanceModalBoutiques([bqt])}
              />
            ))}
          </div>
        </section>
      )}

      {boutiquesFiltrees.length === 0 && (
        <p
          className="admin-empty"
          style={{
            textAlign: 'center',
            padding: 32,
            background: '#fff',
            borderRadius: 12,
            border: '1px solid var(--border, #e2e8f0)',
          }}
        >
          Aucune boutique ne correspond à vos critères de recherche.
        </p>
      )}

      {selectedBoutique && (
        <ModalGestionMarchand
          boutique={selectedBoutique}
          onClose={() => setSelectedBoutique(null)}
          onRefresh={refresh}
        />
      )}

      {relanceModalBoutiques && (
        <ModalRelanceCatalogue
          boutiques={relanceModalBoutiques}
          defaultTemplate={relanceConfig.template}
          onClose={() => setRelanceModalBoutiques(null)}
          onFinished={refresh}
        />
      )}

      {showConfigModal && (
        <ModalConfigAutomatisation
          config={relanceConfig}
          stats={initialRelanceStats}
          eligibles={initialRelanceEligibles}
          onClose={() => setShowConfigModal(false)}
          onSaved={refresh}
        />
      )}
    </div>
  )
}
