'use client'

import React from 'react'
import {
  CreditCard,
  Coins,
  UserPlus,
  Mic,
  BellRing,
  X,
  FileSpreadsheet,
} from 'lucide-react'

interface CarnetQuickActionSheetProps {
  isOpen: boolean
  onClose: () => void
  onNouvelleDette: () => void
  onEncaisserRemboursement: () => void
  onNouveauClient: () => void
  onEcouteVocale: () => void
  onRelancerEcheances?: () => void
  onExportCSV?: () => void
  boutiqueNom?: string
}

export default function CarnetQuickActionSheet({
  isOpen,
  onClose,
  onNouvelleDette,
  onEncaisserRemboursement,
  onNouveauClient,
  onEcouteVocale,
  onRelancerEcheances,
  onExportCSV,
  boutiqueNom,
}: CarnetQuickActionSheetProps) {
  if (!isOpen) return null

  const actions = [
    {
      id: 'nouvelle_dette',
      title: 'Nouvelle Vente à Crédit',
      subtitle: 'Donner des articles ou de l’argent à crédit (Bor)',
      icon: CreditCard,
      color: '#DC2626',
      bg: '#FEF2F2',
      border: '#FECACA',
      onClick: () => {
        onClose()
        onNouvelleDette()
      },
    },
    {
      id: 'encaisser_remboursement',
      title: 'Encaisser un Remboursement',
      subtitle: 'Un client effectue un versement (Fey bor)',
      icon: Coins,
      color: 'var(--price, #0A5C36)',
      bg: '#F0FDF4',
      border: '#BBF7D0',
      onClick: () => {
        onClose()
        onEncaisserRemboursement()
      },
    },
    {
      id: 'nouveau_client',
      title: 'Ajouter un Nouveau Client',
      subtitle: 'Créer une fiche client avec contact et plafond de crédit',
      icon: UserPlus,
      color: 'var(--navy, #1C2B4A)',
      bg: '#F8FAFC',
      border: '#E2E8F0',
      onClick: () => {
        onClose()
        onNouveauClient()
      },
    },
    {
      id: 'vocal_wolof',
      title: 'Commande Vocale (Wolof & Français)',
      subtitle: 'Exemple : « Bor Moussa 10 000 » ou « Moussa feyna 5000 »',
      icon: Mic,
      color: 'var(--accent, #C75B00)',
      bg: '#FFF7ED',
      border: '#FED7AA',
      onClick: () => {
        onClose()
        onEcouteVocale()
      },
    },
  ]

  return (
    <div
      className="bq-action-sheet-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Actions rapides Carnet de Dettes"
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
              Action Rapide · Carnet
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text2, #6B7280)', margin: '2px 0 0' }}>
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
              color: '#94A3B8',
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
                  <Icon size={22} />
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
                      color: 'var(--text2, #6B7280)',
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

        {(onRelancerEcheances || onExportCSV) && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid var(--border, #E8DDD2)',
            }}
          >
            {onRelancerEcheances && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onRelancerEcheances()
                }}
                className="btn-npl btn-npl-secondary"
                style={{
                  flex: 1,
                  minHeight: 40,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <BellRing size={14} />
                <span>Relancer Échéances</span>
              </button>
            )}
            {onExportCSV && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onExportCSV()
                }}
                className="btn-npl btn-npl-secondary"
                style={{
                  flex: 1,
                  minHeight: 40,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <FileSpreadsheet size={14} />
                <span>Export Excel / CSV</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
