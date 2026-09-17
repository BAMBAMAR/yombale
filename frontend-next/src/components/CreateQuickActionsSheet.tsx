'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  PlusCircle,
  Home,
  Store,
  Building2,
  Zap,
  Bell,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react'

interface CreateQuickActionsSheetProps {
  isOpen: boolean
  onClose: () => void
  isMerchant?: boolean
}

export default function CreateQuickActionsSheet({
  isOpen,
  onClose,
  isMerchant = false,
}: CreateQuickActionsSheetProps) {
  const [hasAgence, setHasAgence] = useState(false)
  const [effectiveMerchant, setEffectiveMerchant] = useState(isMerchant)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedMerchant = localStorage.getItem('nopalou_is_merchant')
        const storedBoutique = localStorage.getItem('nopalou_boutique_active') || localStorage.getItem('nopalou_user_boutiques')
        if (storedMerchant === 'true' || (storedBoutique && storedBoutique !== '[]' && storedBoutique !== 'null')) {
          setEffectiveMerchant(true)
        }
        const storedAgence = localStorage.getItem('nopalou_user_agences') || localStorage.getItem('nopalou_agence_active')
        if (storedAgence && storedAgence !== '[]' && storedAgence !== 'null') {
          setHasAgence(true)
        }
      } catch (err) {
        console.debug('[CreateQuickActionsSheet] Erreur lecture localStorage:', err)
      }
    }
  }, [isOpen])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const actions = [
    // 1. Accès prioritaire Caisse POS si commerçant
    ...(effectiveMerchant
      ? [
          {
            id: 'caisse_pos',
            title: 'Caisse POS Tactile (Vente & Reçu)',
            desc: 'Terminal de caisse physique, scanner code-barres et encaissement rapide',
            href: '/boutique/caisse',
            icon: Zap,
            color: 'var(--accent, #C75B00)',
            bg: '#FFF3E8',
            badge: 'POS PRO',
          },
          {
            id: 'nouveau_produit',
            title: 'Ajouter un Produit Boutique',
            desc: 'Photographier un article et publier dans votre catalogue en ligne',
            href: '/boutique?tab=produits',
            icon: PlusCircle,
            color: 'var(--price, #0A5C36)',
            bg: '#DCFCE7',
            badge: 'STOCK',
          },
        ]
      : []),

    // 2. Vendre un article / Petite annonce
    {
      id: 'vendre_article',
      title: 'Vendre un article (Petite Annonce)',
      desc: 'Téléphones, auto, mode, électroménager, matériel, services',
      href: '/deposer-annonce',
      icon: PlusCircle,
      color: 'var(--accent, #C75B00)',
      bg: '#FFF3E8',
      badge: 'GRATUIT',
    },

    // 3. Publier un bien immobilier
    {
      id: 'publier_immo',
      title: 'Publier un bien immobilier',
      desc: 'Location appartement, villa, vente de terrain, immeuble ou bureau',
      href: '/deposer-immo',
      icon: Home,
      color: 'var(--navy, #1C2B4A)',
      bg: '#EFF6FF',
      badge: 'IMMO',
    },

    // 4. Créer ma boutique en ligne & POS (si pas déjà commerçant)
    ...(!effectiveMerchant
      ? [
          {
            id: 'creer_boutique',
            title: 'Créer ma Boutique en Ligne & Caisse',
            desc: 'Catalogue e-commerce, encaissement Wave/OM/Cash et gestion des stocks',
            href: '/creer-boutique',
            icon: Store,
            color: 'var(--price, #0A5C36)',
            bg: '#DCFCE7',
            badge: 'COMMERÇANT',
          },
        ]
      : []),

    // 5. Agence Immobilière Pro
    {
      id: 'espace_agence',
      title: hasAgence ? 'Mon Espace Agence Pro' : 'Créer / Espace Agence Immobilière',
      desc: 'Mandats de vente, baux locatifs, encaissement de loyers et vitrine pro',
      href: '/agence',
      icon: Building2,
      color: '#0284C7',
      bg: '#E0F2FE',
      badge: 'AGENCE PRO',
    },

    // 6. Créer une alerte de prix WhatsApp
    {
      id: 'creer_alerte',
      title: 'Créer une alerte de prix',
      desc: 'Recevez une alerte WhatsApp dès qu’un article ou un logement baisse',
      href: '/compte?tab=mes-alertes',
      icon: Bell,
      color: '#D97706',
      bg: '#FEF3C7',
      badge: 'WHATSAPP',
    },
  ]

  return (
    <div
      className="npl-create-sheet-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Actions rapides et création"
    >
      <div
        className="npl-create-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Poignée centrale tactile */}
        <div className="npl-create-sheet-pill" />

        {/* En-tête de la Sheet */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
            paddingBottom: 10,
            borderBottom: '1px solid var(--border, #E8DDD2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'var(--accent, #C75B00)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: 'var(--navy, #1C2B4A)',
                  margin: 0,
                  letterSpacing: '-0.2px',
                }}
              >
                Créer sur Nopalou
              </h3>
              <p style={{ fontSize: 11.5, color: '#64748B', margin: '2px 0 0' }}>
                Que souhaitez-vous publier ou lancer ?
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: 20,
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            aria-label="Fermer le menu de création"
          >
            <X size={16} />
          </button>
        </div>

        {/* Liste des actions rapides */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {actions.map((act) => {
            const Icon = act.icon
            return (
              <Link
                key={act.id}
                href={act.href}
                onClick={onClose}
                className="npl-create-sheet-item"
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 11,
                    background: act.bg,
                    color: act.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        fontSize: 13.5,
                        fontWeight: 750,
                        color: 'var(--navy, #1C2B4A)',
                        lineHeight: 1.25,
                      }}
                    >
                      {act.title}
                    </span>
                    {act.badge && (
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: 6,
                          background: act.bg,
                          color: act.color,
                          letterSpacing: '0.3px',
                        }}
                      >
                        {act.badge}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: '#64748B',
                      marginTop: 2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {act.desc}
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: '#94A3B8', flexShrink: 0 }} />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
