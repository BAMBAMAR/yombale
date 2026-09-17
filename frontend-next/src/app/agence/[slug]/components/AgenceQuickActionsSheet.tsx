'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import {
  Home,
  Users2,
  Calendar,
  Key,
  FileSignature,
  X,
  ChevronRight,
  Sparkles
} from 'lucide-react'

interface AgenceQuickActionsSheetProps {
  slug: string
  isOpen: boolean
  onClose: () => void
}

export function AgenceQuickActionsSheet({
  slug,
  isOpen,
  onClose,
}: AgenceQuickActionsSheetProps) {
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
    {
      href: `/agence/${slug}/biens/nouveau`,
      title: 'Ajouter un bien immobilier',
      desc: 'Créer une annonce, photographier sur le terrain et publier',
      icon: Home,
      color: 'var(--accent, #C75B00)',
      bg: 'rgba(199, 91, 0, 0.1)',
    },
    {
      href: `/agence/${slug}/prospects`,
      title: 'Nouveau prospect / acquéreur',
      desc: 'Enregistrer un contact, budget et critères de recherche',
      icon: Users2,
      color: 'var(--navy, #1C2B4A)',
      bg: 'rgba(28, 43, 74, 0.08)',
    },
    {
      href: `/agence/${slug}/visites`,
      title: 'Programmer une visite',
      desc: 'Planifier un rendez-vous et envoyer confirmation WhatsApp',
      icon: Calendar,
      color: '#0284C7',
      bg: '#E0F2FE',
    },
    {
      href: `/agence/${slug}/locatif`,
      title: 'Encaisser un loyer',
      desc: 'Saisir un paiement Wave/OM/Cash et générer la quittance',
      icon: Key,
      color: 'var(--price, #0A5C36)',
      bg: '#DCFCE7',
    },
    {
      href: `/agence/${slug}/mandats`,
      title: 'Nouveau mandat de vente ou gestion',
      desc: 'Mandat exclusif ou simple avec bailleur',
      icon: FileSignature,
      color: '#92400E',
      bg: '#FEF3C7',
    },
  ]

  return (
    <div
      className="immo-action-sheet-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-actions-title"
    >
      <div
        className="immo-action-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="immo-action-sheet-pill" />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h3
              id="quick-actions-title"
              style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}
            >
              Actions Rapides Agence
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
              Opérations fréquentes sur le terrain
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#F1EBE3',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--navy, #1C2B4A)',
              cursor: 'pointer',
            }}
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {actions.map((act) => {
            const Icon = act.icon
            return (
              <Link
                key={act.title}
                href={act.href}
                onClick={onClose}
                className="immo-action-sheet-item"
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
                  <div style={{ fontSize: 13.5, fontWeight: 750, color: 'var(--navy, #1C2B4A)' }}>
                    {act.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {act.desc}
                  </div>
                </div>
                <ChevronRight size={18} color="#94A3B8" />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AgenceQuickActionsSheet
