'use client'

import React from 'react'
import {
  ShoppingCart,
  Receipt,
  Camera,
  ScanLine,
  Mic,
  PenTool,
  X,
} from 'lucide-react'
import { useTranslation } from '@/i18n/context'

interface ComptaSaisieExpressQuickSheetProps {
  isOpen: boolean
  onClose: () => void
  onSelectMode: (mode: 'vente' | 'depense', modeSaisie?: 'catalogue' | 'libre') => void
  onDemarrerScannerEan: () => void
  onDemarrerScannerNom: () => void
  onDemarrerEcouteVocale: () => void
  boutiqueNom?: string
}

export function ComptaSaisieExpressQuickSheet({
  isOpen,
  onClose,
  onSelectMode,
  onDemarrerScannerEan,
  onDemarrerScannerNom,
  onDemarrerEcouteVocale,
  boutiqueNom,
}: ComptaSaisieExpressQuickSheetProps) {
  const { t } = useTranslation()

  if (!isOpen) return null

  const actions = [
    {
      id: 'vente_express',
      title: 'Encaisser une Vente Rapide',
      subtitle: 'Ajouter des articles du catalogue et encaisser',
      icon: ShoppingCart,
      color: 'var(--price, #0A5C36)',
      bg: '#E6F4EC',
      border: '#BBF7D0',
      onClick: () => {
        onClose()
        onSelectMode('vente', 'catalogue')
        setTimeout(() => {
          const el = document.getElementById('express-vente-recherche')
          el?.focus()
          el?.scrollIntoView({ behavior: 'smooth' })
        }, 120)
      },
    },
    {
      id: 'depense_express',
      title: 'Enregistrer une Dépense (Sortie Caisse)',
      subtitle: 'Tiak-Tiak, transport, Woyofal, stock, courses...',
      icon: Receipt,
      color: 'var(--accent, #C75B00)',
      bg: '#FFF3E8',
      border: '#FED7AA',
      onClick: () => {
        onClose()
        onSelectMode('depense')
        setTimeout(() => {
          const el = document.getElementById('express-depense-montant')
          el?.focus()
          el?.scrollIntoView({ behavior: 'smooth' })
        }, 120)
      },
    },
    {
      id: 'scan_ean',
      title: 'Scanner Code-barres Produit (EAN)',
      subtitle: 'Scanner avec la caméra pour ajouter au panier en direct',
      icon: Camera,
      color: 'var(--navy, #1C2B4A)',
      bg: 'var(--bg, #F8F5F0)',
      border: 'var(--border, #E8DDD2)',
      onClick: () => {
        onClose()
        onDemarrerScannerEan()
      },
    },
    {
      id: 'scan_ocr',
      title: 'Scanner un Ticket de Caisse (OCR)',
      subtitle: 'Photographier un ticket ou reçu pour extraire montant et motif',
      icon: ScanLine,
      color: 'var(--accent, #C75B00)',
      bg: '#FFF3E8',
      border: '#FED7AA',
      onClick: () => {
        onClose()
        onDemarrerScannerNom()
      },
    },
    {
      id: 'vocal_wolof',
      title: 'Commande Vocale (Wolof & Français)',
      subtitle: 'Exemple : « Vente 5000 » ou « Dépense tiak-tiak 2000 »',
      icon: Mic,
      color: 'var(--navy, #1C2B4A)',
      bg: 'var(--bg, #F8F5F0)',
      border: 'var(--border, #E8DDD2)',
      onClick: () => {
        onClose()
        onDemarrerEcouteVocale()
      },
    },
    {
      id: 'saisie_libre',
      title: 'Ajout Article Libre (Hors Catalogue)',
      subtitle: 'Saisir un nom et prix libre au comptoir',
      icon: PenTool,
      color: 'var(--accent, #C75B00)',
      bg: '#FFF3E8',
      border: '#FED7AA',
      onClick: () => {
        onClose()
        onSelectMode('vente', 'libre')
        setTimeout(() => {
          const el = document.getElementById('express-libre-nom')
          el?.focus()
          el?.scrollIntoView({ behavior: 'smooth' })
        }, 120)
      },
    },
  ]

  return (
    <div
      className="bq-action-sheet-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Actions rapides Saisie Express"
    >
      <div
        className="bq-action-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 540, margin: '0 auto', width: '100%' }}
      >
        <div className="bq-action-sheet-pill" />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: '1px solid var(--border, #E8DDD2)',
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
              Action Rapide · Saisie Express
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text2, #5A4E42)', margin: '2px 0 0' }}>
              {boutiqueNom ? `${boutiqueNom} · ` : ''}Sélectionnez l’opération à réaliser
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu d'actions"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text3, #8C7E74)',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {actions.map((act) => {
            const Icon = act.icon
            return (
              <button
                key={act.id}
                type="button"
                onClick={act.onClick}
                className="bq-action-sheet-item"
                style={{
                  width: '100%',
                  textAlign: 'left',
                  border: `1px solid ${act.border}`,
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: act.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: act.color,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={22} strokeWidth={2.4} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 14.5,
                      color: 'var(--navy, #1C2B4A)',
                      marginBottom: 2,
                    }}
                  >
                    {act.title}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text2, #5A4E42)',
                      lineHeight: 1.35,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {act.subtitle}
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
