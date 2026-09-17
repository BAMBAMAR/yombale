'use client'

import React from 'react'
import {
  PlusCircle,
  Calculator,
  ShoppingBag,
  BookOpen,
  QrCode,
  Zap,
  X,
} from 'lucide-react'

interface BoutiqueQuickActionsSheetProps {
  nom: string
  isOpen: boolean
  onClose: () => void
  onNavigateTab: (tab: any, subTab?: string) => void
  onOpenQrModal?: () => void
  boutiqueId?: string
}

export default function BoutiqueQuickActionsSheet({
  nom,
  isOpen,
  onClose,
  onNavigateTab,
  onOpenQrModal,
  boutiqueId,
}: BoutiqueQuickActionsSheetProps) {
  if (!isOpen) return null

  const actions = [
    {
      id: 'nouveau_produit',
      label: 'Ajouter un Produit (Photo Directe)',
      description: 'Prendre une photo et ajouter un article au catalogue',
      icon: PlusCircle,
      action: () => {
        onClose()
        onNavigateTab('produits')
      },
      color: 'var(--navy, #1C2B4A)',
      bg: '#EBF3FE',
    },
    {
      id: 'caisse_pos',
      label: 'Caisse POS Tactile (Vente & Reçu)',
      description: 'Ouvrir la caisse enregistreuse tactile physique',
      icon: Calculator,
      action: () => {
        onClose()
        if (typeof window !== 'undefined') {
          if (boutiqueId) {
            localStorage.setItem('nopalou_pos_active_boutique_id', boutiqueId)
          }
          window.location.href = boutiqueId ? `/boutique/caisse?b=${boutiqueId}` : '/boutique/caisse'
        }
      },
      color: 'var(--price, #0A5C36)',
      bg: '#DCFCE7',
    },
    {
      id: 'saisie_express',
      label: 'Saisie Express (Recettes & Dépenses)',
      description: 'Enregistrer une recette ou dépense rapide en 3 secondes',
      icon: Zap,
      action: () => {
        onClose()
        onNavigateTab('express')
      },
      color: 'var(--accent, #C75B00)',
      bg: '#FFF3E8',
    },
    {
      id: 'nouvelle_commande',
      label: 'Enregistrer une Nouvelle Commande',
      description: 'Créer une commande client (Wave, Livraison, Espèces)',
      icon: ShoppingBag,
      action: () => {
        onClose()
        onNavigateTab('commandes')
      },
      color: '#B45309',
      bg: '#FEF3C7',
    },
    {
      id: 'carnet_dettes',
      label: 'Noter une Dette Client (Carnet de Crédit)',
      description: 'Ajouter un crédit client et envoyer un rappel WhatsApp',
      icon: BookOpen,
      action: () => {
        onClose()
        onNavigateTab('carnet')
      },
      color: '#B45309',
      bg: '#FFFBEB',
    },
    {
      id: 'partager_vitrine',
      label: 'Partager ma Vitrine Publique',
      description: 'Afficher le QR code et le lien WhatsApp de la boutique',
      icon: QrCode,
      action: () => {
        onClose()
        if (onOpenQrModal) onOpenQrModal()
      },
      color: '#4F46E5',
      bg: '#EEF2FF',
    },
  ]

  return (
    <div
      className="bq-action-sheet-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Actions rapides marchandes"
    >
      <div
        className="bq-action-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bq-action-sheet-pill" />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            paddingBottom: 10,
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          <div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--navy, #1C2B4A)',
                margin: 0,
              }}
            >
              Actions Rapides
            </h3>
            <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>
              {nom} • Que souhaitez-vous faire ?
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: 20,
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

        <div>
          {actions.map((act) => {
            const Icon = act.icon
            return (
              <button
                key={act.id}
                type="button"
                onClick={act.action}
                className="bq-action-sheet-item"
                style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
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
                  <Icon size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 750,
                      color: 'var(--navy, #1C2B4A)',
                      lineHeight: 1.25,
                    }}
                  >
                    {act.label}
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
                    {act.description}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
