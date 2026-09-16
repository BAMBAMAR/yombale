'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Plus,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Home,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  CreditCard,
  Crown
} from 'lucide-react'
import './agence.css'
import { ModalCreerAgence } from './components/ModalCreerAgence'
import { ModalMultiAgence } from './components/ModalMultiAgence'

interface AgenceItem {
  id: string
  nom: string
  slug: string
  description?: string
  ville: string
  quartier?: string
  telephone?: string
  statut: string
  mon_role: string
  is_owner: boolean
  nb_biens: number
  nb_prospects_actifs: number
  sponsorise?: boolean
  sponsor_jusqu_au?: string
  est_sponsorise_actif?: boolean
}

interface QuotaData {
  max_agences: number
  agences_creees: number
  peut_creer: boolean
  tarif_multi_agence: number
  label_multi_agence: string
}

export default function AgencesHubPage() {
  const router = useRouter()
  const [agences, setAgences] = useState<AgenceItem[]>([])
  const [quotas, setQuotas] = useState<QuotaData | null>(null)
  const [loading, setLoading] = useState(true)
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
    try {
      setLoading(true)
      const res = await fetch('/api/agences/mine')
      if (res.status === 401) {
        router.push('/connexion?redirect=/agence')
        return
      }
      const data = await res.json()
      if (data.success) {
        setAgences(data.agences || [])
        if (data.quotas) {
          setQuotas(data.quotas)
        }
      }
    } catch (err) {
      console.error('[CHARGER_AGENCES_ERR]', err)
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
        headers: { 'Content-Type': 'application/json' },
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

  return (
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
          {agences.map(agence => {
            const isSponsored = agence.est_sponsorise_actif || (agence.sponsorise && agence.sponsor_jusqu_au && new Date(agence.sponsor_jusqu_au) > new Date())
            return (
              <div
                key={agence.id}
                className="agence-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: 24,
                  position: 'relative',
                  border: isSponsored ? '1.5px solid #D97706' : '1px solid var(--border, #E8DDD2)',
                  background: isSponsored ? 'linear-gradient(180deg, rgba(254, 243, 199, 0.15) 0%, #FFFFFF 100%)' : '#FFFFFF',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 10,
                          background: isSponsored ? 'linear-gradient(135deg, #B45309 0%, #D97706 100%)' : 'linear-gradient(135deg, #1C2B4A 0%, #2A3F6D 100%)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: 18,
                        }}
                      >
                        {agence.nom.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
                          {agence.nom}
                        </h3>
                        <span style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <MapPin size={13} />
                          {agence.quartier ? `${agence.quartier}, ${agence.ville}` : agence.ville}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isSponsored && (
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 12,
                            background: '#FEF3C7',
                            color: '#92400E',
                            border: '1px solid #FCD34D',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <Sparkles size={11} />
                          En Vedette
                        </span>
                      )}
                      <span className={`status-badge ${agence.statut}`}>
                        {agence.statut === 'actif' ? 'Active' : agence.statut}
                      </span>
                    </div>
                  </div>

                  {agence.description && (
                    <p
                      style={{
                        fontSize: 13,
                        color: '#475569',
                        lineHeight: 1.5,
                        marginBottom: 16,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {agence.description}
                    </p>
                  )}

                  {/* Badges compteurs */}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                    <div
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        background: '#FAF8F5',
                        borderRadius: 8,
                        border: '1px solid var(--border, #E8DDD2)',
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Biens</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>{agence.nb_biens}</div>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        background: '#FAF8F5',
                        borderRadius: 8,
                        border: '1px solid var(--border, #E8DDD2)',
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Prospects</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>{agence.nb_prospects_actifs}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <Link
                    href={`/agence/${agence.slug}`}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: 13.5,
                      background: 'var(--navy, #1C2B4A)',
                      color: '#FFFFFF',
                      textDecoration: 'none',
                    }}
                  >
                    <span>Gérer l'agence</span>
                    <ArrowRight size={15} />
                  </Link>

                  <Link
                    href={`/agence/${agence.slug}/abonnement`}
                    className="agence-btn-outline"
                    style={{
                      padding: '10px 12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Abonnement & Sponsoring"
                  >
                    <CreditCard size={16} />
                  </Link>
                </div>
              </div>
            )
          })}
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
  )
}
