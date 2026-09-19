'use client'

import React from 'react'
import Link from 'next/link'
import { PlusCircle, Home, Store, Building2, Bell, X, Wallet } from 'lucide-react'

interface AccountQuickActionsSheetProps {
  isOpen: boolean
  onClose: () => void
}

export default function AccountQuickActionsSheet({
  isOpen,
  onClose,
}: AccountQuickActionsSheetProps) {
  if (!isOpen) return null

  const actions = [
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
          margin: '0 auto',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Actions rapides du compte"
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
            paddingBottom: 14,
            borderBottom: '1px solid #E2E8F0',
            marginBottom: 14,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
              Publier ou Créer
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
              Accès express aux formulaires de publication
            </p>
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
            }}
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Action Buttons List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {actions.map(act => {
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
      </div>
    </>
  )
}
