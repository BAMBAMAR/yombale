'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  PlusCircle,
  Home,
  Store,
  Building2,
  Bell,
  X,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  HandCoins,
  CreditCard,
  Zap,
  Target,
  PiggyBank,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'

interface AccountQuickActionsSheetProps {
  isOpen: boolean
  onClose: () => void
}

export default function AccountQuickActionsSheet({
  isOpen,
  onClose,
}: AccountQuickActionsSheetProps) {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || ''
  const isKalpe = tab === 'kalpe' || tab === 'sama-xaalis'

  const [showGlobalFromKalpe, setShowGlobalFromKalpe] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShowGlobalFromKalpe(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSamaAction = (action: string) => {
    onClose()
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sama-xaalis:action', {
          detail: { action },
        })
      )
    }
  }

  // Actions contextuelles dédiées Sama Xaalis
  const kalpeActions = [
    {
      id: 'depense',
      label: 'Noter une dépense',
      description: 'Sortie d’argent, courses, loyer, facture...',
      icon: ArrowDownLeft,
      color: '#DC2626',
      bg: '#FEF2F2',
      action: () => handleSamaAction('depense'),
    },
    {
      id: 'revenu',
      label: 'Noter un reçu / entrée',
      description: 'Encaissement, salaire, versement reçu...',
      icon: ArrowUpRight,
      color: '#0A5C36',
      bg: '#ECFDF5',
      action: () => handleSamaAction('revenu'),
    },
    {
      id: 'creance',
      label: 'Noter une créance (On me doit)',
      description: 'Prêt accordé ou vente à crédit à récupérer',
      icon: HandCoins,
      color: 'var(--navy, #1C2B4A)',
      bg: '#F1F5F9',
      action: () => handleSamaAction('creance'),
    },
    {
      id: 'dette',
      label: 'Noter une dette (Je dois)',
      description: 'Emprunt ou dette fournisseur à rembourser',
      icon: CreditCard,
      color: 'var(--accent, #C75B00)',
      bg: '#FFF7ED',
      action: () => handleSamaAction('dette'),
    },
    {
      id: 'vente_express',
      label: 'Vente Express',
      description: 'Vente directe rapide au comptant ou crédit',
      icon: Zap,
      color: '#7C3AED',
      bg: '#FAF5FF',
      action: () => handleSamaAction('vente_express'),
    },
    {
      id: 'nouvel_objectif',
      label: 'Nouvel objectif d’épargne',
      description: 'Créer un projet, cagnotte ou fonds d’urgence',
      icon: Target,
      color: '#0284C7',
      bg: '#F0F9FF',
      action: () => handleSamaAction('nouvel_objectif'),
    },
    {
      id: 'epargne',
      label: 'Ajouter un versement épargne',
      description: 'Alimenter un objectif d’épargne en cours',
      icon: PiggyBank,
      color: '#059669',
      bg: '#ECFDF5',
      action: () => handleSamaAction('epargne'),
    },
  ]

  // Actions globales du compte (Publications, annonces, boutiques)
  const globalActions = [
    {
      id: 'sama_xaalis',
      label: 'Sama Xaalis (Entrée, Dépense, Dette)',
      description: 'Dictée vocale bilingue Wolof/Français & gestion 1-tap',
      href: '/compte?tab=kalpe',
      icon: Wallet,
      color: '#C75B00',
      bg: '#FFF3E8',
    },
    {
      id: 'vendre_article',
      label: 'Vendre un article (Annonce classique)',
      description: 'Téléphones, auto, mode, électro, services',
      href: '/deposer-annonce',
      icon: PlusCircle,
      color: 'var(--accent, #C75B00)',
      bg: '#FFF3E8',
    },
    {
      id: 'publier_immo',
      label: 'Publier un bien immobilier',
      description: 'Location appartement, vente terrain ou villa',
      href: '/deposer-immo',
      icon: Home,
      color: 'var(--navy, #1C2B4A)',
      bg: '#EFF6FF',
    },
    {
      id: 'espace_boutique',
      label: 'Accéder à Ma Boutique / Caisse POS',
      description: 'Gérer vos stocks, commandes et ventes en direct',
      href: '/boutique',
      icon: Store,
      color: 'var(--price, #0A5C36)',
      bg: '#DCFCE7',
    },
    {
      id: 'espace_agence',
      label: 'Accéder à Mon Agence Immobilière',
      description: 'Portefeuille de mandats, baux et prospects',
      href: '/agence',
      icon: Building2,
      color: '#0369A1',
      bg: '#E0F2FE',
    },
    {
      id: 'creer_alerte',
      label: 'Créer une alerte de prix',
      description: 'Notification WhatsApp dès qu’un produit baisse',
      href: '/compte?tab=mes-alertes',
      icon: Bell,
      color: '#D97706',
      bg: '#FEF3C7',
    },
  ]

  const isKalpeMode = isKalpe && !showGlobalFromKalpe

  return (
    <>
      {/* Overlay Backdrop */}
      <div
        className="account-action-sheet-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(3px)',
          zIndex: 998,
          animation: 'fadeIn 0.2s ease',
        }}
        aria-hidden="true"
      />

      {/* Sheet Panel */}
      <div
        className="account-action-sheet"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          background: '#FFFFFF',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: '16px 16px calc(24px + env(safe-area-inset-bottom, 0px))',
          boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.18)',
          zIndex: 999,
          maxWidth: 600,
          maxHeight: '85vh',
          overflowY: 'auto',
          margin: '0 auto',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label={isKalpeMode ? 'Actions rapides Sama Xaalis' : 'Actions rapides du compte'}
      >
        {/* Handle Bar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#CBD5E1' }} />
        </div>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 12,
            borderBottom: '1px solid #E2E8F0',
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isKalpeMode && (
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, var(--navy, #1C2B4A) 0%, var(--accent, #C75B00) 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Wallet size={18} />
              </div>
            )}
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                {isKalpeMode ? 'Sama Xaalis • Action rapide' : 'Publier ou Créer'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
                {isKalpeMode ? 'Que souhaitez-vous enregistrer ?' : 'Accès express aux formulaires de publication'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode Kalpe Contextuel */}
        {isKalpeMode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 8,
              }}
            >
              {kalpeActions.map(act => {
                const IconComponent = act.icon
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={act.action}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '11px 14px',
                      borderRadius: 12,
                      border: '1px solid #E2E8F0',
                      background: '#FAF8F5',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      width: '100%',
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: act.bg,
                        color: act.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <IconComponent size={19} strokeWidth={2.4} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 750, color: 'var(--navy, #1C2B4A)' }}>
                        {act.label}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 1 }}>
                        {act.description}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Bascule vers autres actions globales */}
            <button
              type="button"
              onClick={() => setShowGlobalFromKalpe(true)}
              style={{
                marginTop: 6,
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px dashed #CBD5E1',
                background: 'transparent',
                color: '#64748B',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                width: '100%',
              }}
            >
              <span>Voir les autres publications (Annonce, Immo, Boutique...)</span>
              <ArrowRight size={13} />
            </button>
          </div>
        ) : (
          /* Mode Global Standard */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {isKalpe && showGlobalFromKalpe && (
              <button
                type="button"
                onClick={() => setShowGlobalFromKalpe(false)}
                style={{
                  marginBottom: 2,
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: '1px solid #FED7AA',
                  background: '#FFF7ED',
                  color: 'var(--accent, #C75B00)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  alignSelf: 'flex-start',
                }}
              >
                <ArrowLeft size={13} />
                <span>Revenir aux actions Sama Xaalis</span>
              </button>
            )}

            {globalActions.map(act => {
              const IconComponent = act.icon
              return (
                <Link
                  key={act.id}
                  href={act.href}
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid #E2E8F0',
                    background: '#FAF8F5',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: act.bg,
                      color: act.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <IconComponent size={20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 750, color: 'var(--navy, #1C2B4A)' }}>
                      {act.label}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 1 }}>
                      {act.description}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

