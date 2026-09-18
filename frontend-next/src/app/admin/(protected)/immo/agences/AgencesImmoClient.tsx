'use client'

import React, { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import {
  Building2,
  RefreshCw,
  Crown,
  Home,
  Sparkles,
} from 'lucide-react'
import BatchActionBar, { BatchActionConfig } from '@/components/admin/BatchActionBar'
import { showToast } from '@/context/ToastContext'
import {
  batchModererAgences,
  batchSupprimerAgences,
} from '@/app/actions/admin'
import {
  AgenceImmo,
  AgencesFilterCounts,
  isSponsorActif,
  isAgenceActive,
  AgenceImmoRow,
  AgencesFilterBar,
  ModalGestionAgence,
  ModalRelanceAgence,
} from './components'

interface AgencesImmoClientProps {
  initialAgences: AgenceImmo[]
  total: number
}

export default function AgencesImmoClient({ initialAgences, total }: AgencesImmoClientProps) {
  const [, startTransition] = useTransition()
  const [agences, setAgences] = useState<AgenceImmo[]>(initialAgences)
  const [selectedAgence, setSelectedAgence] = useState<AgenceImmo | null>(null)
  const [relanceModalAgences, setRelanceModalAgences] = useState<AgenceImmo[] | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loadingBatch, setLoadingBatch] = useState<boolean>(false)

  // Filtres
  const [q, setQ] = useState('')
  const [activeTab, setActiveTab] = useState<'toutes' | 'abonnees' | 'sponsorisees' | 'suspendues'>('toutes')
  const [seuilBiens, setSeuilBiens] = useState<'tous' | '0' | '1-2' | '3-5' | '5+'>('tous')
  const [villeFilter, setVilleFilter] = useState('toutes')

  const refresh = () => {
    startTransition(() => {
      window.location.reload()
    })
  }

  // Liste dynamique des villes uniques
  const villesDisponibles = useMemo(() => {
    const set = new Set<string>()
    agences.forEach((a) => {
      if (a.ville && a.ville.trim()) set.add(a.ville.trim())
    })
    return Array.from(set).sort()
  }, [agences])

  // Filtrage combiné
  const agencesFiltrees = useMemo(() => {
    let list = [...agences]

    // 1. Onglet
    if (activeTab === 'abonnees') {
      list = list.filter(
        (a) =>
          a.abonnement_plan === 'immo_pro' ||
          a.abonnement_plan === 'pro' ||
          a.abonnement_plan === 'immo_multi_agence' ||
          a.abonnement_plan === 'multi_agence'
      )
    } else if (activeTab === 'sponsorisees') {
      list = list.filter((a) => isSponsorActif(a))
    } else if (activeTab === 'suspendues') {
      list = list.filter((a) => !isAgenceActive(a))
    }

    // 2. Seuil de biens
    if (seuilBiens === '0') {
      list = list.filter((a) => (a.nb_biens ?? 0) === 0)
    } else if (seuilBiens === '1-2') {
      list = list.filter((a) => (a.nb_biens ?? 0) >= 1 && (a.nb_biens ?? 0) <= 2)
    } else if (seuilBiens === '3-5') {
      list = list.filter((a) => (a.nb_biens ?? 0) >= 3 && (a.nb_biens ?? 0) <= 5)
    } else if (seuilBiens === '5+') {
      list = list.filter((a) => (a.nb_biens ?? 0) > 5)
    }

    // 3. Ville
    if (villeFilter !== 'toutes') {
      list = list.filter((a) => a.ville?.toLowerCase() === villeFilter.toLowerCase())
    }

    // 4. Recherche textuelle
    if (q.trim()) {
      const term = q.trim().toLowerCase()
      list = list.filter((a) => {
        return (
          a.nom?.toLowerCase().includes(term) ||
          a.slug?.toLowerCase().includes(term) ||
          a.proprietaire_nom?.toLowerCase().includes(term) ||
          a.proprietaire_email?.toLowerCase().includes(term) ||
          a.email_contact?.toLowerCase().includes(term) ||
          a.email?.toLowerCase().includes(term) ||
          a.telephone?.includes(term) ||
          a.whatsapp?.includes(term) ||
          a.ville?.toLowerCase().includes(term) ||
          a.quartier?.toLowerCase().includes(term)
        )
      })
    }

    return list
  }, [agences, activeTab, seuilBiens, villeFilter, q])

  // Compteurs statistiques
  const counts: AgencesFilterCounts = useMemo(
    () => ({
      toutes: agences.length,
      abonnees: agences.filter(
        (a) =>
          a.abonnement_plan === 'immo_pro' ||
          a.abonnement_plan === 'pro' ||
          a.abonnement_plan === 'immo_multi_agence' ||
          a.abonnement_plan === 'multi_agence'
      ).length,
      sponsorisees: agences.filter((a) => isSponsorActif(a)).length,
      suspendues: agences.filter((a) => !isAgenceActive(a)).length,
      zeroBien: agences.filter((a) => (a.nb_biens ?? 0) === 0).length,
      max2Biens: agences.filter((a) => (a.nb_biens ?? 0) <= 2).length,
    }),
    [agences]
  )

  // Gestion de la sélection par lot
  const allIds = agencesFiltrees.map((a) => a.id)
  const allSelected = allIds.length > 0 && selectedIds.length === allIds.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(allIds)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleBatchActiver = async () => {
    setLoadingBatch(true)
    try {
      const res = await batchModererAgences(selectedIds, 'actif')
      showToast(`${res.successCount} agence(s) activée(s).`, 'success', 'Actions par lot')
      setSelectedIds([])
      refresh()
    } finally {
      setLoadingBatch(false)
    }
  }

  const handleBatchSuspendre = async () => {
    setLoadingBatch(true)
    try {
      const res = await batchModererAgences(selectedIds, 'suspendu')
      showToast(`${res.successCount} agence(s) suspendue(s).`, 'success', 'Actions par lot')
      setSelectedIds([])
      refresh()
    } finally {
      setLoadingBatch(false)
    }
  }

  const handleBatchSupprimer = async () => {
    setLoadingBatch(true)
    try {
      const res = await batchSupprimerAgences(selectedIds)
      showToast(`${res.successCount} agence(s) supprimée(s).`, 'success', 'Actions par lot')
      setSelectedIds([])
      refresh()
    } finally {
      setLoadingBatch(false)
    }
  }

  const handleBatchRelancer = () => {
    const targets = agences.filter((a) => selectedIds.includes(a.id))
    if (targets.length > 0) {
      setRelanceModalAgences(targets)
    }
  }

  const batchActions: BatchActionConfig[] = [
    {
      key: 'relancer',
      label: 'Relancer WhatsApp (Guide Agence)',
      color: 'amber',
      onClick: handleBatchRelancer,
    },
    {
      key: 'activer',
      label: 'Activer les agences',
      color: 'green',
      onClick: handleBatchActiver,
    },
    {
      key: 'suspendre',
      label: 'Suspendre les agences',
      color: 'amber',
      onClick: handleBatchSuspendre,
    },
    {
      key: 'supprimer',
      label: 'Supprimer définitivement',
      color: 'red',
      confirmMsg: 'Êtes-vous certain de vouloir supprimer définitivement les agences sélectionnées ?',
      onClick: handleBatchSupprimer,
    },
  ]

  // Catégories visuelles
  const abonnees = agencesFiltrees.filter(
    (a) =>
      a.abonnement_plan === 'immo_pro' ||
      a.abonnement_plan === 'pro' ||
      a.abonnement_plan === 'immo_multi_agence' ||
      a.abonnement_plan === 'multi_agence'
  )
  const sponsorisees = agencesFiltrees.filter(
    (a) =>
      !(
        a.abonnement_plan === 'immo_pro' ||
        a.abonnement_plan === 'pro' ||
        a.abonnement_plan === 'immo_multi_agence' ||
        a.abonnement_plan === 'multi_agence'
      ) && isSponsorActif(a)
  )
  const autres = agencesFiltrees.filter(
    (a) =>
      !(
        a.abonnement_plan === 'immo_pro' ||
        a.abonnement_plan === 'pro' ||
        a.abonnement_plan === 'immo_multi_agence' ||
        a.abonnement_plan === 'multi_agence'
      ) && !isSponsorActif(a)
  )

  return (
    <div className="admin-page-container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* En-tête Métier */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy, #1C2B4A)', margin: '0 0 6px' }}>
            Réseau Agences Immobilières & Comptes Pro
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text2, #64748b)', margin: 0 }}>
            Supervision du parc immobilier, forfaits d&apos;abonnement, mandats, baux locatifs OHADA et sponsoring.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link
            href="/admin/plans?categorie=immo"
            className="btn-npl"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              padding: '8px 14px',
              background: '#ede9fe',
              color: '#6d28d9',
              border: '1px solid #ddd6fe',
              fontWeight: 600,
            }}
          >
            <Crown size={14} />
            <span>Catalogue Forfaits</span>
          </Link>
          <Link
            href="/admin/immo"
            className="btn-npl"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              padding: '8px 14px',
              background: '#f1f5f9',
              color: 'var(--navy, #1C2B4A)',
              border: '1px solid var(--border, #E8DDD2)',
            }}
          >
            <Home size={14} />
            <span>Vue globale Immo</span>
          </Link>
          <button
            type="button"
            onClick={refresh}
            className="btn-npl"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}
          >
            <RefreshCw size={14} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Barre de filtres et d'onglets */}
      <AgencesFilterBar
        q={q}
        onQChange={setQ}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        seuilBiens={seuilBiens}
        onSeuilChange={setSeuilBiens}
        villeFilter={villeFilter}
        onVilleChange={setVilleFilter}
        villesDisponibles={villesDisponibles}
        counts={counts}
        onRelancerVides={() => {
          const vides = agences.filter((a) => (a.nb_biens ?? 0) === 0)
          if (vides.length > 0) setRelanceModalAgences(vides)
        }}
      />

      {/* Barre d'actions par lot */}
      <BatchActionBar
        selectedCount={selectedIds.length}
        totalCount={agencesFiltrees.length}
        allSelected={allSelected}
        onToggleSelectAll={toggleSelectAll}
        onClearSelection={() => setSelectedIds([])}
        actions={batchActions}
        loading={loadingBatch}
        itemLabel="agence(s)"
      />

      {/* Section 1 : Abonnées Pro & Multi-Agences */}
      {abonnees.length > 0 && (
        <section style={{ marginBottom: 16 }}>
          <h2
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              margin: '0 0 12px',
            }}
          >
            <Crown size={16} />
            <span>Abonnées Pro & Multi-Agences</span>
            <span
              style={{
                fontSize: 11,
                background: '#ede9fe',
                color: '#6d28d9',
                padding: '2px 8px',
                borderRadius: 12,
              }}
            >
              {abonnees.length}
            </span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {abonnees.map((ag) => (
              <AgenceImmoRow
                key={ag.id}
                agence={ag}
                isSelected={selectedIds.includes(ag.id)}
                onToggleSelect={() => toggleSelect(ag.id)}
                onAction={refresh}
                onOpenGestion={setSelectedAgence}
                onOpenRelance={(a) => setRelanceModalAgences([a])}
              />
            ))}
          </div>
        </section>
      )}

      {/* Section 2 : Agences En Vedette / Sponsorisées */}
      {sponsorisees.length > 0 && (
        <section style={{ marginBottom: 16 }}>
          <h2
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: '#b45309',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              margin: '0 0 12px',
            }}
          >
            <Sparkles size={16} />
            <span>Agences En Vedette (Sponsoring)</span>
            <span
              style={{
                fontSize: 11,
                background: '#fef3c7',
                color: '#b45309',
                padding: '2px 8px',
                borderRadius: 12,
              }}
            >
              {sponsorisees.length}
            </span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sponsorisees.map((ag) => (
              <AgenceImmoRow
                key={ag.id}
                agence={ag}
                isSelected={selectedIds.includes(ag.id)}
                onToggleSelect={() => toggleSelect(ag.id)}
                onAction={refresh}
                onOpenGestion={setSelectedAgence}
                onOpenRelance={(a) => setRelanceModalAgences([a])}
              />
            ))}
          </div>
        </section>
      )}

      {/* Section 3 : Autres Agences */}
      {autres.length > 0 && (
        <section>
          <h2
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: 'var(--navy, #1C2B4A)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              margin: '0 0 12px',
            }}
          >
            <Building2 size={16} />
            <span>Autres Agences Immobilières</span>
            <span
              style={{
                fontSize: 11,
                background: '#f1f5f9',
                color: '#475569',
                padding: '2px 8px',
                borderRadius: 12,
              }}
            >
              {autres.length}
            </span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {autres.map((ag) => (
              <AgenceImmoRow
                key={ag.id}
                agence={ag}
                isSelected={selectedIds.includes(ag.id)}
                onToggleSelect={() => toggleSelect(ag.id)}
                onAction={refresh}
                onOpenGestion={setSelectedAgence}
                onOpenRelance={(a) => setRelanceModalAgences([a])}
              />
            ))}
          </div>
        </section>
      )}

      {/* État Vide */}
      {agencesFiltrees.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid var(--border, #E8DDD2)',
            color: 'var(--text3, #94a3b8)',
          }}
        >
          <Building2 size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <h3 style={{ margin: '0 0 6px', fontSize: 16, color: 'var(--navy, #1C2B4A)' }}>
            Aucune agence trouvée
          </h3>
          <p style={{ margin: 0, fontSize: 13 }}>
            Aucune agence immobilière ne correspond à vos critères de recherche ou de filtre.
          </p>
        </div>
      )}

      {/* Modale de Gestion Complète */}
      {selectedAgence && (
        <ModalGestionAgence
          agence={selectedAgence}
          onClose={() => setSelectedAgence(null)}
          onRefresh={refresh}
        />
      )}

      {/* Modale de Relance WhatsApp */}
      {relanceModalAgences && (
        <ModalRelanceAgence
          agences={relanceModalAgences}
          onClose={() => setRelanceModalAgences(null)}
          onFinished={refresh}
        />
      )}
    </div>
  )
}
