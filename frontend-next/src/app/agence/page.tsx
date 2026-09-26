'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Plus,
  Crown
} from 'lucide-react'
import './agence.css'
import { ModalCreerAgence } from './components/ModalCreerAgence'
import { ModalMultiAgence } from './components/ModalMultiAgence'
import { AgenceHubCard, type AgenceItem } from './components/AgenceHubCard'
import { AgenceLandingPublicView } from './components/AgenceLandingPublicView'
import AccountWorkspaceWrapper from '@/app/(account)/components/AccountWorkspaceWrapper'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

interface QuotaData {
  max_agences: number
  agences_creees: number
  peut_creer: boolean
  tarif_multi_agence: number
  label_multi_agence: string
}

export default function AgencesHubPage() {
  const router = useRouter()
  const [agences, setAgences] = useState<AgenceItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('nopalou_offline_agences_mine')
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Array.isArray(parsed) && parsed.length > 0) return parsed
        }
      } catch (_) {}
    }
    return []
  })
  const [quotas, setQuotas] = useState<QuotaData | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('nopalou_offline_agences_quotas')
        if (cached) return JSON.parse(cached)
      } catch (_) {}
    }
    return null
  })
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('nopalou_offline_agences_mine')
      if (cached) return false
    }
    return true
  })
  const [isUnauthenticated, setIsUnauthenticated] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showMultiModal, setShowMultiModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nom: '',
    ville: 'Dakar',
    quartier: '',
    telephone: '',
    whatsapp: '',
    description: '',
  })

  async function chargerAgences() {
    // 1. Initialisation instantanée depuis le cache local hors-ligne
    const cachedAgences = typeof window !== 'undefined' ? localStorage.getItem('nopalou_offline_agences_mine') : null
    let hasCache = false
    if (cachedAgences) {
      try {
        const parsed = JSON.parse(cachedAgences)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAgences(parsed)
          hasCache = true
          setLoading(false)
        }
      } catch (_) {}
    }
    const cachedQuotas = typeof window !== 'undefined' ? localStorage.getItem('nopalou_offline_agences_quotas') : null
    if (cachedQuotas) {
      try {
        setQuotas(JSON.parse(cachedQuotas))
      } catch (_) {}
    }

    try {
      if (!hasCache) setLoading(true)
      const headers = getImmoAuthHeaders()
      const res = await fetch('/api/agences/mine', {
        headers,
      })
      if (res.status === 401) {
        if (!hasCache) {
          setIsUnauthenticated(true)
          setLoading(false)
        }
        return
      }
      const data = await res.json()
      if (data.success) {
        const agencesList = data.agences || []
        setAgences(agencesList)
        if (typeof window !== 'undefined') {
          localStorage.setItem('nopalou_offline_agences_mine', JSON.stringify(agencesList))
        }
        if (data.quotas) {
          setQuotas(data.quotas)
          if (typeof window !== 'undefined') {
            localStorage.setItem('nopalou_offline_agences_quotas', JSON.stringify(data.quotas))
          }
        }
        // Si l'utilisateur possède une agence unique, redirection fluide directe vers son dashboard
        if (agencesList.length === 1 && typeof window !== 'undefined' && !window.location.search.includes('hub=true')) {
          router.replace(`/agence/${agencesList[0].slug}`)
          return
        }
      }
    } catch (err) {
      console.warn('[CHARGER_AGENCES_ERR] (mode hors-ligne)', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    chargerAgences()
  }, [])

  function handleOpenCreationFlow() {
    if (quotas && !quotas.peut_creer) {
      setShowMultiModal(true)
      return
    }
    setFormError(null)
    setShowModal(true)
  }

  async function handleCreerAgence(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!formData.nom.trim()) {
      setFormError("Le nom de l'agence est obligatoire.")
      return
    }

    try {
      setCreating(true)
      const res = await fetch('/api/agences', {
        method: 'POST',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        if (data.quotas && !data.quotas.allowed) {
          setShowModal(false)
          setShowMultiModal(true)
          return
        }
        setFormError(data.error || "Erreur lors de la création de l'agence.")
        return
      }
      setShowModal(false)
      router.push(`/agence/${data.agence.slug}`)
    } catch (err) {
      console.error('[CREER_AGENCE_ERR]', err)
      setFormError('Erreur de connexion au serveur.')
    } finally {
      setCreating(false)
    }
  }

  const userOwnerCount = agences.filter(a => a.is_owner).length
  const quotaMax = quotas?.max_agences || 1
  const isQuotaReached = userOwnerCount >= quotaMax

  if (isUnauthenticated) {
    return <AgenceLandingPublicView />
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748B', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <p style={{ fontSize: 15, fontWeight: 700 }}>Chargement de vos espaces immobiliers...</p>
      </div>
    )
  }

  return (
    <AccountWorkspaceWrapper
      activeSpace="agence"
      customCta={{
        label: 'Créer une agence',
        onClick: handleOpenCreationFlow,
      }}
    >
      <div className="agence-container">
        {/* ── En-tête de la page ── */}
        <div className="agence-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'var(--navy, #1C2B4A)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <Building2 size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 className="agence-title" style={{ margin: 0 }}>Nopalou Immobilier Pro</h1>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 12,
                    background: isQuotaReached ? '#FEF3C7' : 'rgba(10, 92, 54, 0.1)',
                    color: isQuotaReached ? '#92400E' : 'var(--price, #0A5C36)',
                    border: isQuotaReached ? '1px solid #FCD34D' : 'none',
                  }}
                >
                  Quota : {userOwnerCount} / {quotaMax} agence{quotaMax > 1 ? 's' : ''} (Plan Essentiel)
                </span>
              </div>
              <p className="agence-subtitle">
                Gérez vos agences, votre portefeuille de biens, vos prospects CRM et vos baux locatifs.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreationFlow}
          className="btn-npl"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 8,
            fontWeight: 700,
            background: 'var(--accent, #C75B00)',
            color: '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Plus size={18} />
          Créer une agence
        </button>
      </div>

      {/* ── Liste des agences ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B' }}>
          <p>Chargement de vos agences...</p>
        </div>
      ) : agences.length === 0 ? (
        <div
          className="agence-card"
          style={{
            textAlign: 'center',
            padding: '50px 24px',
            maxWidth: 600,
            margin: '40px auto',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(199, 91, 0, 0.08)',
              color: 'var(--accent, #C75B00)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Building2 size={32} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy, #1C2B4A)', marginBottom: 8 }}>
            Vous n'avez pas encore d'agence immobilière
          </h2>
          <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 24 }}>
            Digitalisez votre agence immobilière au Sénégal : catalogue de biens, multidiffusion d'annonces, CRM
            prospects, gestion des visites, baux et encaissement des loyers. 1 agence gratuite incluse.
          </p>
          <button
            type="button"
            onClick={handleOpenCreationFlow}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              borderRadius: 8,
              fontWeight: 700,
              background: 'var(--accent, #C75B00)',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Plus size={18} />
            Démarrer mon agence maintenant
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 20,
          }}
        >
          {agences.map(agence => (
            <AgenceHubCard key={agence.id} agence={agence} />
          ))}
        </div>
      )}

      {/* ── Modale de Création d'Agence ── */}
      <ModalCreerAgence
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleCreerAgence}
        creating={creating}
        formError={formError}
      />

      {/* ── Modale Option Multi-Agences ── */}
      <ModalMultiAgence
        isOpen={showMultiModal}
        onClose={() => setShowMultiModal(false)}
        tarifMensuel={quotas?.tarif_multi_agence || 15000}
        labelOption={quotas?.label_multi_agence || 'Option Réseau Multi-Agences'}
        currentAgencesCount={userOwnerCount}
      />
      </div>
    </AccountWorkspaceWrapper>
  )
}
