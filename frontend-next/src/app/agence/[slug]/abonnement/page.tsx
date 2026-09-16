'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Building2,
  Clock,
  Zap,
  ExternalLink,
  Users2,
  Home,
  FileText,
  AlertCircle,
  Share2
} from 'lucide-react'
import '@/app/agence/agence.css'

interface AgenceItem {
  id: string
  nom: string
  slug: string
  statut: string
  abonnement_plan?: string
  abonnement_fin?: string
  sponsorise?: boolean
  sponsor_jusqu_au?: string
  is_owner?: boolean
}

interface QuotaData {
  max_agences: number
  agences_creees: number
  peut_creer: boolean
  tarif_multi_agence: number
  label_multi_agence: string
}

export default function AgenceAbonnementPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string

  const [agence, setAgence] = useState<AgenceItem | null>(null)
  const [quotas, setQuotas] = useState<QuotaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [payingSponsoring, setPayingSponsoring] = useState(false)
  const [sponsoringNotice, setSponsoringNotice] = useState<string | null>(null)

  function getAuthToken(): string {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('token') || localStorage.getItem('nopalou_token') || sessionStorage.getItem('token') || ''
  }

  async function chargerDonnees() {
    try {
      setLoading(true)
      const token = getAuthToken()
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}

      const [resAgence, resMine] = await Promise.all([
        fetch(`/api/agences/${slug}`, { headers }),
        fetch('/api/agences/mine', { headers }),
      ])

      const dataAgence = await resAgence.json()
      if (dataAgence.success && dataAgence.agence) {
        setAgence(dataAgence.agence)
      }

      const dataMine = await resMine.json()
      if (dataMine.success && dataMine.quotas) {
        setQuotas(dataMine.quotas)
      }
    } catch (err) {
      console.error('[CHARGER_ABONNEMENT_AGENCE_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) chargerDonnees()
  }, [slug])

  async function handleLancerSponsoring() {
    try {
      setPayingSponsoring(true)
      setSponsoringNotice(null)
      const token = getAuthToken()
      const res = await fetch(`/api/agences/${slug}/sponsoring`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      const data = await res.json()
      if (data.wave_url) {
        window.location.href = data.wave_url
      } else if (data.fallback_manuel) {
        setSponsoringNotice(`Paiement manuel : envoyez ${data.montant || 5000} FCFA par Wave au ${data.numero_depot} avec la référence ${data.reference}`)
      } else {
        alert(data.error || "Impossible d'initialiser le paiement Wave.")
      }
    } catch (err: any) {
      alert(err.message || 'Erreur réseau lors de la commande')
    } finally {
      setPayingSponsoring(false)
    }
  }

  async function handleActivationDirecte() {
    if (!confirm('Activer la mise en avant de cette agence pour 30 jours ?')) return
    try {
      const token = getAuthToken()
      const res = await fetch(`/api/agences/${slug}/activer-sponsoring-direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ duree_jours: 30 }),
      })
      const data = await res.json()
      if (data.success) {
        setAgence(data.agence)
        alert('Mise en avant activée avec succès pour 30 jours !')
      } else {
        alert(data.error || "Erreur lors de l'activation")
      }
    } catch (err: any) {
      alert(err.message || 'Erreur réseau')
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B' }}>
        <p>Chargement des informations d'abonnement...</p>
      </div>
    )
  }

  const isSponsored = agence?.sponsorise && agence?.sponsor_jusqu_au ? new Date(agence.sponsor_jusqu_au) > new Date() : false
  const sponsorFinFormatted = agence?.sponsor_jusqu_au ? new Date(agence.sponsor_jusqu_au).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null

  return (
    <div style={{ maxWidth: 1020, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── En-tête ── */}
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
              <CreditCard size={20} />
            </div>
            <div>
              <h1 className="agence-title">Abonnement & Visibilité Agence</h1>
              <p className="agence-subtitle">
                Gérez le forfait de votre agence, vos quotas multi-agences et activez la mise en avant en tête d'annuaire.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2 Cartes Principales : Forfait & Sponsoring ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Carte 1 : Forfait Actuel */}
        <div className="agence-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Forfait Agence
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 800,
                  background: 'rgba(10, 92, 54, 0.1)',
                  color: 'var(--price, #0A5C36)',
                }}
              >
                <CheckCircle2 size={13} />
                Actif & Inclus
              </span>
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '0 0 6px' }}>
              Plan Agence Essentiel
            </h2>
            <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 20px', lineHeight: 1.5 }}>
              Offert pour digitaliser votre agence sans frais fixes mensuels. Comprend tous les modules métier.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--border, #E8DDD2)', paddingTop: 16 }}>
              {[
                { icon: Home, label: 'Portefeuille de biens illimité' },
                { icon: Users2, label: 'CRM Prospects & Pipeline Vente complet' },
                { icon: FileText, label: 'Gestion Locative, Baux & Quittances PDF' },
                { icon: Share2, label: 'Social Shop & Smart Matching Vidéo' },
                { icon: Building2, label: 'Gestion des Agents & Courtiers' },
              ].map((feat, idx) => {
                const Icon = feat.icon
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#334155' }}>
                    <div style={{ color: 'var(--price, #0A5C36)' }}>
                      <Icon size={16} />
                    </div>
                    <span>{feat.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ marginTop: 24, padding: 12, borderRadius: 8, background: '#F8FAFC', border: '1px solid var(--border, #E8DDD2)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', display: 'block', marginBottom: 2 }}>
              Quota Compte : {quotas?.agences_creees || 1} / {quotas?.max_agences || 1} agence autorisée
            </span>
            <span style={{ fontSize: 11.5, color: '#64748B' }}>
              Pour gérer plusieurs agences ou succursales, activez l'Option Réseau Multi-Agences ({quotas?.tarif_multi_agence?.toLocaleString('fr-FR') || '15 000'} FCFA/mois).
            </span>
          </div>
        </div>

        {/* Carte 2 : Sponsoring & Mise en Avant */}
        <div
          className="agence-card"
          style={{
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: isSponsored ? '2px solid #D97706' : '1px solid var(--border, #E8DDD2)',
            background: isSponsored ? 'linear-gradient(180deg, rgba(254, 243, 199, 0.25) 0%, #FFFFFF 100%)' : '#FFFFFF',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Visibilité & Annuaire
              </span>
              {isSponsored ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 10px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 800,
                    background: '#FEF3C7',
                    color: '#92400E',
                    border: '1px solid #FCD34D',
                  }}
                >
                  <Sparkles size={13} />
                  En Vedette
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 10px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                    background: '#F1F5F9',
                    color: '#64748B',
                  }}
                >
                  Standard
                </span>
              )}
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '0 0 6px' }}>
              Mise en Avant (Sponsoring)
            </h2>
            <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 20px', lineHeight: 1.5 }}>
              Propulsez votre agence en 1ère position dans l'annuaire public des agences immobilières Nopalou et recevez plus de mandats.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--border, #E8DDD2)', paddingTop: 16 }}>
              {[
                'Remontée prioritaire en tête de liste de l\'annuaire public',
                'Badge officiel doré « ⭐ En Vedette » sur votre profil',
                'Mise en valeur de vos annonces de biens sur la page d\'accueil',
                'Durée garantie de 30 jours renouvelable',
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#334155' }}>
                  <div style={{ color: 'var(--accent, #C75B00)' }}>
                    <Sparkles size={15} />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            {isSponsored ? (
              <div style={{ padding: 14, borderRadius: 8, background: '#FEF3C7', border: '1px solid #FDE68A', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#92400E', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={15} />
                  Mise en avant active jusqu'au {sponsorFinFormatted}
                </span>
                <span style={{ fontSize: 12, color: '#78350F', display: 'block', marginTop: 4 }}>
                  Votre agence bénéficie du classement prioritaire dans l'annuaire public.
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>5 000 FCFA</span>
                <span style={{ fontSize: 13, color: '#64748B' }}>/ 30 jours de sponsoring</span>
              </div>
            )}

            {sponsoringNotice && (
              <div style={{ padding: 10, borderRadius: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', fontSize: 12, color: '#1E40AF', marginBottom: 12 }}>
                {sponsoringNotice}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleLancerSponsoring}
                disabled={payingSponsoring}
                className="btn-npl"
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 18px',
                  borderRadius: 8,
                  fontWeight: 800,
                  fontSize: 14,
                  background: 'var(--accent, #C75B00)',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: payingSponsoring ? 'not-allowed' : 'pointer',
                }}
              >
                <Zap size={16} />
                {payingSponsoring ? 'Préparation Wave...' : isSponsored ? 'Prolonger mon Sponsoring (Wave)' : 'Mettre en avant mon agence (Wave)'}
              </button>

              <button
                type="button"
                onClick={handleActivationDirecte}
                className="agence-btn-outline"
                style={{ fontSize: 12, padding: '10px 14px' }}
                title="Activation immédiate pour test ou validation administrative"
              >
                Activation test (30j)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
