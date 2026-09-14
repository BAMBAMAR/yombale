'use client'

import React from 'react'
import { X, ShoppingBag, MessageSquare, CreditCard, Check } from 'lucide-react'
import { Produit, fcfa } from './types'

interface CommanderHeaderProps {
  nomBoutique?: string | null
  produit: Produit
  quantite: number
  sousTotalMain: number
  mode: 'whatsapp' | 'formulaire'
  onModeChange: (mode: 'whatsapp' | 'formulaire') => void
  onClose: () => void
}

export default function CommanderHeader({
  nomBoutique,
  produit,
  quantite,
  sousTotalMain,
  mode,
  onModeChange,
  onClose,
}: CommanderHeaderProps) {
  return (
    <>
      {/* 1. Header Moderne avec Badge Boutique */}
      <div
        style={{
          padding: '18px 24px 16px',
          borderBottom: '1px solid #f1f5f9',
          background: '#fafafa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: 'var(--accent, #C75B00)',
                background: '#ffedd5',
                padding: '2px 8px',
                borderRadius: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {nomBoutique || 'Boutique Certifiée'}
            </span>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
            Finaliser votre commande
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la fenêtre"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: '#e2e8f0',
            border: 'none',
            fontSize: 16,
            cursor: 'pointer',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* 2. Mini Carte Produit & Récapitulatif Rapide */}
      <div
        style={{
          padding: '12px 24px',
          background: '#f8fafc',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#ffffff',
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              color: 'var(--navy, #1C2B4A)',
              flexShrink: 0,
            }}
          >
            <ShoppingBag size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 800,
                color: '#1e293b',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {produit.nom}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b', fontWeight: 600 }}>
              Quantité : <strong>{quantite}</strong>{' '}
              {produit.prix ? `• ${fcfa(produit.prix)} / unité` : ''}
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block' }}>
            TOTAL ARTICLE
          </span>
          <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--accent, #C75B00)' }}>
            {fcfa(sousTotalMain)}
          </span>
        </div>
      </div>

      {/* 3. Sélecteur d'Onglets Premium (Choix du canal) */}
      <div style={{ padding: '16px 24px 8px' }}>
        <p
          style={{
            margin: '0 0 10px',
            fontSize: 12,
            fontWeight: 800,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          Choisissez comment vous souhaitez commander :
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Onglet 1: WhatsApp Direct */}
          <button
            type="button"
            onClick={() => onModeChange('whatsapp')}
            className={`commander-mode-tab-card ${mode === 'whatsapp' ? 'active-whatsapp' : ''}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  padding: '2px 6px',
                  borderRadius: 6,
                  background: mode === 'whatsapp' ? '#22c55e' : '#e2e8f0',
                  color: mode === 'whatsapp' ? '#ffffff' : '#64748b',
                  letterSpacing: '0.04em',
                }}
              >
                1-CLIC RAPIDE
              </span>
              <span
                style={{
                  fontSize: 12,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: mode === 'whatsapp' ? '#22c55e' : 'transparent',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: mode === 'whatsapp' ? 'none' : '1.5px solid #cbd5e1',
                }}
              >
                {mode === 'whatsapp' && <Check size={12} strokeWidth={3} />}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <MessageSquare size={20} color={mode === 'whatsapp' ? '#15803d' : '#64748b'} />
              <div>
                <h4
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 900,
                    color: mode === 'whatsapp' ? '#15803d' : '#1e293b',
                  }}
                >
                  WhatsApp Direct
                </h4>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: 11.5,
                    color: mode === 'whatsapp' ? '#166534' : '#64748b',
                    lineHeight: 1.3,
                  }}
                >
                  Sans formulaire, échangez en direct
                </p>
              </div>
            </div>
          </button>

          {/* Onglet 2: Commande avec Formulaire */}
          <button
            type="button"
            onClick={() => onModeChange('formulaire')}
            className={`commander-mode-tab-card ${mode === 'formulaire' ? 'active-formulaire' : ''}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  padding: '2px 6px',
                  borderRadius: 6,
                  background: mode === 'formulaire' ? 'var(--accent, #C75B00)' : '#e2e8f0',
                  color: mode === 'formulaire' ? '#ffffff' : '#64748b',
                  letterSpacing: '0.04em',
                }}
              >
                PAIEMENT DIRECT
              </span>
              <span
                style={{
                  fontSize: 12,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: mode === 'formulaire' ? 'var(--accent, #C75B00)' : 'transparent',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: mode === 'formulaire' ? 'none' : '1.5px solid #cbd5e1',
                }}
              >
                {mode === 'formulaire' && <Check size={12} strokeWidth={3} />}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <CreditCard size={20} color={mode === 'formulaire' ? 'var(--accent, #C75B00)' : '#64748b'} />
              <div>
                <h4
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 900,
                    color: mode === 'formulaire' ? '#9a3412' : '#1e293b',
                  }}
                >
                  Formulaire & Paiement
                </h4>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: 11.5,
                    color: mode === 'formulaire' ? '#c2410c' : '#64748b',
                    lineHeight: 1.3,
                  }}
                >
                  Wave, OM, Espèces ou Crédit
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </>
  )
}
