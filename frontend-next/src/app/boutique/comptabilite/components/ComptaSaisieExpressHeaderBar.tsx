'use client'

import React from 'react'
import { Zap, ShoppingCart, Receipt, MicVocal } from 'lucide-react'

interface ComptaSaisieExpressHeaderBarProps {
  mode: 'vente' | 'depense'
  onSelectMode: (mode: 'vente' | 'depense') => void
  isMobile?: boolean
  onOpenQuickSheet?: () => void
  onDemarrerScannerEan?: () => void
  onDemarrerScannerNom?: () => void
  onDemarrerEcouteVocale?: () => void
  isListeningVoice?: boolean
  nbArticlesPanier?: number
  totalVente?: number
  onViderPanier?: () => void
  t?: (key: string) => string
}

export function ComptaSaisieExpressHeaderBar({
  mode,
  onSelectMode,
  isMobile = false,
  onDemarrerEcouteVocale,
  isListeningVoice = false,
}: ComptaSaisieExpressHeaderBarProps) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1.5px solid var(--border, #E8DDD2)',
        borderRadius: 14,
        padding: '8px 14px',
        color: 'var(--navy, #1C2B4A)',
        boxShadow: '0 2px 8px rgba(28, 43, 74, 0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
      }}
    >
      {/* Titre & Icône compacts */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: 'linear-gradient(135deg, #FFF3E8 0%, #FED7AA 100%)',
            border: '1px solid #FDBA74',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: 'var(--accent, #C75B00)',
          }}
        >
          <Zap size={17} />
        </div>
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 16.5,
              fontWeight: 900,
              color: 'var(--navy, #1C2B4A)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            Saisie Express
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: 'var(--text2, #6B7280)',
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            Caisse directe & bilan instantané
          </p>
        </div>
      </div>

      {/* Conteneur Actions Droite : Sélecteur Vente/Dépense + Bouton Vocal STRICTEMENT sur la même ligne */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexWrap: 'nowrap',
          flexShrink: 0,
        }}
      >
        {/* Sélecteur Mode Vente / Dépense */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'var(--bg, #F8F5F0)',
            padding: 3,
            borderRadius: 10,
            border: '1px solid var(--border, #E8DDD2)',
            flexShrink: 0,
          }}
        >
          {(['vente', 'depense'] as const).map((m) => {
            const isAct = mode === m
            const bg =
              m === 'vente'
                ? 'linear-gradient(135deg, var(--price, #0A5C36) 0%, #15803D 100%)'
                : 'linear-gradient(135deg, var(--accent, #C75B00) 0%, #B91C1C 100%)'
            const shadow =
              m === 'vente'
                ? '0 2px 6px rgba(10, 92, 54, 0.22)'
                : '0 2px 6px rgba(199, 91, 0, 0.22)'
            const Icon = m === 'vente' ? ShoppingCart : Receipt
            const label = m === 'vente' ? 'Vente rapide' : 'Dépense'

            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  onSelectMode(m)
                  setTimeout(() => {
                    if (m === 'vente') {
                      document.getElementById('express-vente-recherche')?.focus()
                    } else {
                      document.getElementById('express-depense-montant')?.focus()
                    }
                  }, 50)
                }}
                style={{
                  padding: '6px 11px',
                  borderRadius: 7,
                  border: 'none',
                  background: isAct ? bg : 'transparent',
                  color: isAct ? '#ffffff' : 'var(--text2, #5A4E42)',
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: 'pointer',
                  boxShadow: isAct ? shadow : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            )
          })}
        </div>

        {/* Bouton Vocal Agrandi distinct placé À DROITE de Dépense sur la MÊME LIGNE */}
        <button
          type="button"
          onClick={onDemarrerEcouteVocale}
          title="Assistant vocal & guide (Wolof & Français)"
          style={{
            height: 35,
            padding: '0 12px',
            borderRadius: 9,
            border: isListeningVoice
              ? '1.5px solid var(--accent, #C75B00)'
              : '1px solid var(--border, #E8DDD2)',
            background: isListeningVoice
              ? 'linear-gradient(135deg, #FFF3E8 0%, #FED7AA 100%)'
              : 'var(--bg, #F8F5F0)',
            color: isListeningVoice ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 800,
            flexShrink: 0,
            whiteSpace: 'nowrap',
            boxShadow: isListeningVoice
              ? '0 0 0 3px rgba(199, 91, 0, 0.22)'
              : '0 1px 3px rgba(28, 43, 74, 0.05)',
            transition: 'all 0.15s ease',
          }}
          aria-label="Ouvrir l'assistant vocal et son guide d'utilisation"
        >
          <MicVocal size={16} style={{ color: isListeningVoice ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)' }} />
          <span>{isListeningVoice ? 'Écoute...' : 'Vocal'}</span>
        </button>
      </div>
    </div>
  )
}
